import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient, SchoolRole } from '@prisma/client';

const prisma = new PrismaClient();

// 1) Augment Express Request type
declare module 'express-serve-static-core' {
  interface Request {
    schoolUser?: {
      id: number;
      role: SchoolRole;
      schoolId: number;
    };
  }
}

/**
 * Authenticate middleware:
 * - Expects Authorization: Bearer <token>
 * - Verifies JWT, looks up user in Prisma, attaches to req.schoolUser
 */
export const verifyToken = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith('Bearer ')) {
    res.status(401).json({ message: 'Missing or malformed Authorization header' });
    return;
  }

  const token = authHeader.split(' ')[1];
  try {
    // 2) Verify token (assumes payload contains { id: number })
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as { userId?: number };
    if (!payload.userId) {
      throw new Error('Token payload missing user ID');
    }

    // 3) Fetch user from DB
    const user = await prisma.schoolUser.findUnique({
      where: { id: payload.userId },
      select: { id: true, role: true, schoolId: true },
    });

    if (!user) {
      res.status(401).json({ message: 'User not found' });
      return;
    }

    // 4) Attach to req and continue
    req.schoolUser = {
      id: user.id,
      role: user.role,
      schoolId: user.schoolId,
    };

    next();
  } catch (err) {
    console.error('Authentication error:', err);
     res.status(401).json({ message: 'Invalid or expired token' });
     return;
  }
};
