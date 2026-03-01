import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";

// ======================================================
// === MATH HELPERS (Integrated from Maths.tsx) ===
// ======================================================

function decodeLatexFromUrl(url: string): string | null {
  try {
    const u = new URL(url);
    if (!u.hostname.includes("chart.apis.google.com")) return null;
    if (!u.searchParams.get("cht")?.includes("tx")) return null;
    const latex = decodeURIComponent(u.searchParams.get("chl") || "");
    return latex || null;
  } catch {
    return null;
  }
}

const mathSymbolMap: Record<string, string> = {
  "&alpha;": "α",
  "&beta;": "β",
  "&gamma;": "γ",
  "&Delta;": "Δ",
  "&infin;": "∞",
  "&le;": "≤",
  "&ge;": "≥",
};

function renderMathSymbols(text: string): string {
  return text.replace(/&[a-zA-Z]+;/g, (entity) => mathSymbolMap[entity] || entity);
}

const OptionalMathContent: React.FC<{ content: string }> = ({ content }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!content) return;
    const hasMath =
      content.includes("chart.apis.google.com") ||
      content.includes("$$") ||
      content.includes("\\(") ||
      content.includes("\\[");
    if (!hasMath) return;

    if (!(window as any).MathJax) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js";
      script.async = true;
      script.onload = () => {
        if ((window as any).MathJax && ref.current) {
          (window as any).MathJax.typesetPromise([ref.current]);
        }
      };
      document.head.appendChild(script);
    } else {
      (window as any).MathJax.typesetPromise([ref.current]);
    }
  }, [content]);

  const latex = decodeLatexFromUrl(content);
  return (
    <div ref={ref} className="math-content">
      {latex ? <span>{`$$${latex}$$`}</span> : <span>{renderMathSymbols(content)}</span>}
    </div>
  );
};

const SmartImage: React.FC<{ src: string; alt?: string }> = ({ src, alt }) => {
  const latex = decodeLatexFromUrl(src);
  if (latex) {
    return (
      <div className="p-2 bg-gray-50 border rounded-lg text-center">
        <OptionalMathContent content={`$$${latex}$$`} />
      </div>
    );
  }
  return <img src={src} alt={alt || "question image"} className="max-h-64 mx-auto" />;
};

// ======================================================
// === QUIZ PAGE COMPONENT ===
// ======================================================

export interface Question {
  id: number;
  question: string;
  optionA: string | null;
  optionB: string | null;
  optionC: string | null;
  optionD: string | null;
  correctAnswer?: string | null;
  explanation?: string | null;
  questionImageUrl?: string | null;
  hasImage?: boolean | null;
}

interface UserData {
  id: string;
  firstName: string;
}

interface PaginationData {
  currentPage: number;
  totalPages: number;
  totalQuestions: number;
}

const QuizPage: React.FC = () => {
  const location = useLocation();

  const headerRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const questionsContainerRef = useRef<HTMLDivElement | null>(null);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [allQuestions, setAllQuestions] = useState<Question[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<number, string>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [score, setScore] = useState<number>(0);

  const [timeRemaining, setTimeRemaining] = useState<number>(3600);
  const [isQuizEnded, setIsQuizEnded] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const [userData, setUserData] = useState<UserData>({ id: "", firstName: "User" });

  const [pagination, setPagination] = useState<PaginationData>({
    currentPage: 1,
    totalPages: 1,
    totalQuestions: 0,
  });

  const [showReviewDialog, setShowReviewDialog] = useState<boolean>(false);

  const queryParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    return {
      examType: params.get("examType"),
      subjectName: params.get("subjectName"),
      year: params.get("year"),
    };
  }, [location.search]);

  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUserData(JSON.parse(stored));
  }, []);

  // === Fetch questions (with accumulation across pages) ===
  useEffect(() => {
    const controller = new AbortController();
    const run = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${baseApi}/exam/questions`, {
          params: { ...queryParams, page: pagination.currentPage },
          signal: controller.signal,
        });
        const fetched: Question[] = res.data?.questions ?? [];
        setQuestions(fetched);
        setAllQuestions((prev) => {
          const map = new Map<number, Question>(prev.map((q) => [q.id, q]));
          for (const q of fetched) if (!map.has(q.id)) map.set(q.id, q);
          return Array.from(map.values());
        });
        setPagination((p) => ({
          ...p,
          totalPages: res.data?.totalPages ?? p.totalPages,
          totalQuestions: res.data?.totalQuestions ?? p.totalQuestions,
        }));
      } catch (err) {
        if (!axios.isCancel(err)) {
          toast.error("Failed to fetch questions.");
        }
      } finally {
        setLoading(false);
      }
    };
    run();
    return () => controller.abort();
  }, [queryParams, pagination.currentPage]);

  // === Timer ===
  useEffect(() => {
    if (timeRemaining <= 0 || isQuizEnded) return;
    const t = setInterval(() => setTimeRemaining((s) => s - 1), 1000);
    return () => clearInterval(t);
  }, [timeRemaining, isQuizEnded]);

  // === Handle answers ===
  const handleAnswerSelect = useCallback(
    async (questionId: number, optionText: string) => {
      if (isQuizEnded) return;
      try {
        const res = await axios.post(`${baseApi}/exam/validate-answer`, {
          questionId,
          userAnswer: optionText,
        });
        const isCorrect = res.data?.isCorrect === true;
        setUserAnswers((prev) => ({ ...prev, [questionId]: optionText }));
        setCorrectAnswers((prev) => ({ ...prev, [questionId]: isCorrect }));
      } catch {
        toast.error("Failed to validate answer.");
      }
    },
    [isQuizEnded]
  );

  useEffect(() => {
    setScore(Object.values(correctAnswers).filter(Boolean).length);
  }, [correctAnswers]);

  // === Stats (use all questions, not just displayed) ===
  const totalQuestionsSafe = useMemo(() => {
    if (pagination.totalQuestions > 0) return pagination.totalQuestions;
    if (allQuestions.length > 0) return allQuestions.length;
    return questions.length;
  }, [pagination.totalQuestions, allQuestions.length, questions.length]);

  const examStats = useMemo(() => {
    const passed = Object.values(correctAnswers).filter(Boolean).length;
    const attempted = Object.keys(userAnswers).length;
    const failed = Math.max(0, attempted - passed);
    const unattempted = Math.max(0, totalQuestionsSafe - attempted);
    const percentage =
      totalQuestionsSafe > 0 ? Math.round((passed / totalQuestionsSafe) * 100) : 0;
    return { passed, attempted, failed, unattempted, percentage };
  }, [correctAnswers, userAnswers, totalQuestionsSafe]);

  // === Submit with review dialog ===
  const confirmFinalSubmit = async () => {
    setIsSubmitting(true);
    try {
      const payload = {
        userId: userData.id,
        examId: allQuestions[0]?.id ?? questions[0]?.id,
        score,
        totalQuestions: totalQuestionsSafe,
        examType: queryParams.examType,
        subjectName: queryParams.subjectName,
        year: queryParams.year,
      };
      await axios.post(`${baseApi}/exam/submit-result`, payload);
      toast.success("Exam submitted successfully!");
      setIsQuizEnded(true);
    } catch {
      toast.error("Submission failed.");
    } finally {
      setIsSubmitting(false);
      setShowReviewDialog(false);
    }
  };

  const handleSubmitExam = () => {
    setShowReviewDialog(true);
  };

  // ======================================================
  // === RENDER ===
  // ======================================================
  return (
    <div className="bg-gray-50 min-h-screen">
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Review Dialog */}
      {showReviewDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Submit Exam?</h2>
            <p className="mb-6">Do you want to review your answers before submitting?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowReviewDialog(false)}
                className="px-4 py-2 bg-gray-300 rounded-lg"
              >
                Review
              </button>
              <button
                onClick={confirmFinalSubmit}
                className="px-4 py-2 bg-[#66934e] text-white rounded-lg"
              >
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <header ref={headerRef} className="bg-white shadow-md py-6 px-4 mb-6">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-3xl font-bold text-gray-800">Take Exam</h1>
          <div className="flex justify-center mt-2 text-gray-700">
            {queryParams.examType} - {queryParams.subjectName} - {queryParams.year}
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-6xl mx-auto px-4 pb-28">
        {loading ? (
          <p className="text-center">Loading...</p>
        ) : (
          <div ref={questionsContainerRef}>
            {!isQuizEnded ? (
              questions.map((q) => (
                <div key={q.id} className="p-4 bg-white shadow rounded mb-4">
                  <div className="mb-2 font-medium">
                    <OptionalMathContent content={q.question} />
                  </div>
                  {q.questionImageUrl && <SmartImage src={q.questionImageUrl} />}
                  <div className="space-y-2 mt-2">
                    {["A", "B", "C", "D"].map((opt) => {
                      const text = (q as any)[`option${opt}`];
                      if (!text) return null;
                      return (
                        <label key={opt} className="block p-2 border rounded cursor-pointer">
                          <input
                            type="radio"
                            name={`q-${q.id}`}
                            checked={userAnswers[q.id] === text}
                            onChange={() => handleAnswerSelect(q.id, text)}
                          />{" "}
                          <OptionalMathContent content={text} />
                        </label>
                      );
                    })}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center">
                <h2 className="text-xl font-bold">Your Results</h2>
                <p>
                  Score: {score}/{totalQuestionsSafe} ({examStats.percentage}%)
                </p>
                <p>Correct: {examStats.passed}</p>
                <p>Incorrect: {examStats.failed}</p>
                <p>Unattempted: {examStats.unattempted}</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Footer */}
      {!isQuizEnded && (
        <div
          ref={footerRef}
          className="fixed bottom-0 inset-x-0 bg-white border-t py-4 px-4 flex justify-center"
        >
          <button
            onClick={handleSubmitExam}
            disabled={isSubmitting}
            className="bg-[#66934e] text-white py-3 px-8 rounded-lg"
          >
            {isSubmitting ? "Submitting..." : "Submit Exam"}
          </button>
        </div>
      )}
    </div>
  );
};

export default QuizPage;