import { Request, Response } from "express";
import { PrismaClient  } from "@prisma/client";


declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: string;
      };
    }
  }
}

const prisma = new PrismaClient();

export const getPerformance = async (req: Request, res: Response):Promise<void> => {
  const userId = req.user?.id;
  if (!userId) {
     res.status(401).json({ message: "Unauthorized" });
     return;
  }
  try {
    const totalExams = await prisma.examResult.count({
      where: { userId },
    });
    const averageScoreResult = await prisma.examResult.aggregate({
      _avg: { score: true },
      where: { userId },
    });
    const averageScore = averageScoreResult._avg.score || 0;

    // 3. Fetch exam results with subject names
    const performances = await prisma.examResult.findMany({
      where: { userId },
      include: {
        exam: {
          select: { subjectName: true },
        },
      },
    });

    // 4. Calculate average score per subject
    const subjectAverages: { [key: string]: { total: number; count: number } } = {};
    performances.forEach((result) => {
      const subject = result.exam.subjectName;
      if (!subjectAverages[subject]) {
        subjectAverages[subject] = { total: 0, count: 0 };
      }
      subjectAverages[subject].total += result.score;
      subjectAverages[subject].count += 1;
    });

    const subjectStats = Object.entries(subjectAverages).map(([subject, stats]) => ({
      subject,
      average: stats.total / stats.count,
    }));

    // 5. Determine best and weakest subjects
    let bestPerformance = null;
    let weakestSubject = null;
    if (subjectStats.length > 0) {
      bestPerformance = subjectStats.reduce((prev, current) =>
        prev.average > current.average ? prev : current
      );
      weakestSubject = subjectStats.reduce((prev, current) =>
        prev.average < current.average ? prev : current
      );
    }

    // 6. Send response
    res.status(200).json({
      totalExams,
      averageScore: Math.round(averageScore),
      bestPerformance: bestPerformance
        ? { subject: bestPerformance.subject, score: Math.round(bestPerformance.average) }
        : null,
      weakestSubject: weakestSubject
        ? { subject: weakestSubject.subject, score: Math.round(weakestSubject.average) }
        : null,
    });
  } catch (error) {
    console.error("Error fetching performance data:", error);
    res.status(500).json({ message: "Failed to fetch performance data" });
  }
};