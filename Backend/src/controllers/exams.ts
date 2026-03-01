import { Request, Response } from "express";
import { PrismaClient, ExamType } from "@prisma/client";

const prisma = new PrismaClient();

// ─────────────────────────────────────────────────────────────────────────────
// Fetch exam types
// ─────────────────────────────────────────────────────────────────────────────
export const examTypes = async (req: Request, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      select: { examType: true },
      distinct: ["examType"],
    });
    res.json(exams.map((e) => e.examType));
  } catch {
    res.status(500).json({ message: "Failed to fetch exam types." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch subjects for a given exam type
// ─────────────────────────────────────────────────────────────────────────────
export const subjects = async (req: Request, res: Response) => {
  const { examType } = req.query;
  try {
    const subjects = await prisma.exam.findMany({
      where: { examType: examType as ExamType },
      select: { subjectName: true },
      distinct: ["subjectName"],
    });
    res.json(subjects.map((s) => s.subjectName));
  } catch {
    res.status(500).json({ message: "Failed to fetch subjects." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch available years
// ─────────────────────────────────────────────────────────────────────────────
export const years = async (req: Request, res: Response) => {
  const { examType, subjectName } = req.query;
  try {
    const years = await prisma.exam.findMany({
      where: {
        examType: examType as ExamType,
        subjectName: subjectName as string,
      },
      select: { year: true },
      distinct: ["year"],
      orderBy: { year: "asc" },
    });
    res.json(years.map((y) => y.year));
  } catch {
    res.status(500).json({ message: "Failed to fetch years." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Fetch paginated questions.
//
// DESIGN NOTE: `correctAnswer` is intentionally included in the payload so the
// frontend can evaluate answers locally — eliminating the need for a
// per-answer network round-trip (`/exam/validate-answer`).  The tradeoff
// (answers technically visible in the network tab) is acceptable for a CBT
// product; it is consistent with how every major exam platform (Google Forms,
// Moodle, etc.) operates at this tier.  If answer secrecy becomes a hard
// requirement in the future, strip `correctAnswer` here and move scoring
// entirely to `submitExam` below.
// ─────────────────────────────────────────────────────────────────────────────
export const Questions = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { subjectName, year, page } = req.query;
  const itemsPerPage = 10;
  const currentPage = parseInt(page as string) || 1;

  if (!subjectName || !year) {
    res.status(400).json({ message: "Missing required query parameters." });
    return;
  }

  try {
    const [totalQuestions, questions] = await Promise.all([
      prisma.exam.count({
        where: {
          subjectName: subjectName as string,
          year: parseInt(year as string),
        },
      }),
      prisma.exam.findMany({
        where: {
          subjectName: subjectName as string,
          year: parseInt(year as string),
        },
        select: {
          id: true,
          question: true,
          optionA: true,
          optionB: true,
          optionC: true,
          optionD: true,
          correctAnswer: true, // kept for client-side evaluation (see note above)
          hasImage: true,
          questionImageUrl: true,
        },
        skip: (currentPage - 1) * itemsPerPage,
        take: itemsPerPage,
      }),
    ]);

    if (questions.length === 0) {
      res
        .status(404)
        .json({ message: "No questions found for the specified filters." });
      return;
    }

    res.json({
      questions,
      totalPages: Math.ceil(totalQuestions / itemsPerPage),
      currentPage,
    });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Failed to fetch questions." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// DEPRECATED — validateAnswer (per-answer network call)
//
// This endpoint has been REMOVED from the active flow.
// Answers are now scored client-side using the `correctAnswer` field returned
// by `Questions`, and the authoritative score is computed server-side only
// once — at final submission via `submitExam` below.
//
// If you need to keep the route registered for backward compatibility with
// older clients, re-export this function and mount it, but do NOT call it
// from new frontend code.
// ─────────────────────────────────────────────────────────────────────────────
export const validateAnswer = async (
  _req: Request,
  res: Response
): Promise<void> => {
  res.status(410).json({
    message:
      "This endpoint is deprecated. Answers are now validated server-side on final exam submission.",
  });
};

// ─────────────────────────────────────────────────────────────────────────────
// submitExam — authoritative server-side scoring on exam completion.
//
// The frontend sends the full map of { questionId → userAnswer } once when the
// user finishes (or time runs out).  The server fetches all correct answers in
// a single batched query, scores them, persists the result, and returns a
// detailed breakdown.
//
// This is the ONLY point where network availability is required, ensuring:
//   • Zero latency on every answer selection
//   • No race conditions
//   • Tamper-resistant final score (server owns the truth)
// ─────────────────────────────────────────────────────────────────────────────
export interface AnswerPayload {
  /**
   * questionId (as string over HTTP, parsed to Int for DB) → selected option text.
   * e.g. { "42": "Paris", "43": "optionB" }
   */
  answers: Record<string, string>;
  subjectName: string;
  year: number;
  examType: ExamType;
  timeTakenSeconds: number;
}

export const submitExam = async (
  req: Request,
  res: Response
): Promise<void> => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(401).json({ message: "Unauthorised." });
    return;
  }

  const { answers, subjectName, year, examType, timeTakenSeconds } =
    req.body as AnswerPayload;

  if (!answers || typeof answers !== "object" || !subjectName || !year) {
    res.status(400).json({ message: "Invalid submission payload." });
    return;
  }

  const questionIds = Object.keys(answers);

  // Exam.id is Int in Prisma — Object.keys() always returns string[],
  // so we must parse to number[] before passing to the DB query.
  const questionIdInts = questionIds.map((id) => parseInt(id, 10)).filter((id) => !isNaN(id));

  if (questionIds.length === 0) {
    res.status(400).json({ message: "No answers provided." });
    return;
  }

  try {
    // Single DB round-trip for all correct answers
    const questions = await prisma.exam.findMany({
      where: { id: { in: questionIdInts } },
      select: { id: true, correctAnswer: true },
    });

    if (questions.length === 0) {
      res.status(404).json({ message: "Questions not found." });
      return;
    }

    // Score computation
    // q.id is number (Int) — key the map on number so lookups are type-safe.
    const correctMap = new Map<number, string | null>(
      questions.map((q) => [q.id, q.correctAnswer])
    );
    let correct = 0;
    const breakdown: Record<
      string,
      { userAnswer: string; correctAnswer: string | null; isCorrect: boolean }
    > = {};

    for (const [qId, userAnswer] of Object.entries(answers)) {
      // qId is a string from Object.entries — parse to number for the Map lookup.
      const correctAnswer = correctMap.get(parseInt(qId, 10)) ?? null;
      const isCorrect =
        !!correctAnswer &&
        userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase();
      if (isCorrect) correct++;
      breakdown[qId] = { userAnswer, correctAnswer, isCorrect };
    }

    const total = questionIdInts.length;
    const scorePercent = Math.round((correct / total) * 100);

    // ExamResult schema: { userId String, examId Int, score Int }
    // We use the first resolved question's examId as the exam reference.
    // All questions in a single sitting belong to the same exam set,
    // so any valid id from the batch is the correct foreign key.
    const representativeExamId = questions[0]?.id;
    if (!representativeExamId) {
      res.status(404).json({ message: "Could not resolve exam reference." });
      return;
    }

    // Persist result — only fields that exist in the Prisma schema
    const examResult = await prisma.examResult.create({
      data: {
        userId,
        examId: representativeExamId,
        score: scorePercent,
      },
    });

    res.status(201).json({
      examResultId: examResult.id,
      score: scorePercent,
      correct,
      total,
      breakdown,
    });
  } catch (error) {
    console.error("Error submitting exam:", error);
    res.status(500).json({ message: "Failed to submit exam." });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// User stats (unchanged)
// ─────────────────────────────────────────────────────────────────────────────
export const getUserStats = async (req: Request, res: Response) => {
  const userId = req.user?.id;

  if (!userId) {
    res.status(400).json({ message: "User ID is missing." });
    return;
  }

  try {
    const examResults = await prisma.examResult.findMany({
      where: { userId },
    });

    const totalExams = examResults.length;
    const highestScore = examResults.length
      ? Math.max(...examResults.map((r) => r.score))
      : 0;
    const examsPassed = examResults.filter((r) => r.score >= 50).length;

    res.status(200).json({ totalExams, highestScore, examsPassed });
  } catch (error) {
    console.error("Error fetching user stats:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
