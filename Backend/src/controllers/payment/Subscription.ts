import  { Request, Response , NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Route to check subscription status get method
export const status = async (req: Request, res: Response) => {
  if (!req.user) {
    res.status(401).send("Unauthorized");
    return;
  }
  try {
    const subscriptions = await prisma.subscription.findMany({
      where: {
        userId: req.user.id,
        status: "active",
        endDate: { gt: new Date() },
      },
      select: {
        examType: true,
      },
    });
    const subscribedExamTypes = [...new Set(subscriptions.map(sub => sub.examType))];
    res.json({ subscribedExamTypes });
  } catch (error) {
    console.error('Error checking subscription status:', error);
    res.status(500).json({ message: 'Failed to check subscription status' });
  }
};




