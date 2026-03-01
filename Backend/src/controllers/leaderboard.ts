import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

// Updated getBestPerformers function
export const getBestPerformers = async (req: Request, res: Response):Promise<void> => {
  try {
    // Get user details and best subject in single query
    const results = await prisma.examResult.groupBy({
      by: ['userId'],
      _avg: { score: true },
      _max: { score: true },
      orderBy: { _avg: { score: 'desc' } },
      take: 10,
    });

    if (results.length === 0) {
       res.status(200).json([]);
       return;
    }

    // Batch fetch user data
    const userIds = results.map(r => r.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, firstName: true, lastName: true }
    });

    // Batch fetch best subjects
    const bestExams = await prisma.examResult.findMany({
      where: { userId: { in: userIds } },
      distinct: ['userId'],
      orderBy: { score: 'desc' },
      select: {
        userId: true,
        exam: { select: { subjectName: true } }
      }
    });

    // Create lookup maps
    const userMap = new Map(users.map(u => [u.id, u]));
    const examMap = new Map(bestExams.map(e => [e.userId, e]));

    // Build response
    const leaderboard = results.map(result => {
      const user = userMap.get(result.userId);
      const bestExam = examMap.get(result.userId);

      return {
        name: user ? `${user.firstName} ${user.lastName}` : 'Unknown User',
        bestSubject: bestExam?.exam?.subjectName || 'N/A',
        averageScore: result._avg.score?.toFixed(2) || 0 // Format number
      };
    });

    res.status(200).json(leaderboard);
  } catch (error) {
    console.error("Error fetching best performers:", error);
    res.status(500).json({ message: "Server error" });
  }
};