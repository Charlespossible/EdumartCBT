import { Request, Response } from "express";
import { PrismaClient, SchoolRole } from '@prisma/client';
import bcrypt from "bcryptjs";
import crypto from "crypto";

const prisma = new PrismaClient();

// Local Request with attached user from auth middleware
type LocalRequest = Request & {
  user?: {
    id: string;
    role: string;
    schoolId: string;
  };
};

// Helper to generate random password
export const generateTempPassword = (length = 8): string => {
  return crypto.randomBytes(Math.ceil(length / 2)).toString('hex').slice(0, length);
};

export const getTeachers = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    
    // Get the school ID from the user
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    const teachers = await prisma.teacher.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
    });
    
    res.status(200).json(teachers);
    return;
  } catch (error) {
    console.error('Error fetching teacher:', error);
    res.status(500).json({ message: 'Failed to retrieve teacher' });
    return;
  }
};

// POST /school/create-teachers
export const CreateTeacher = async (req: Request, res: Response): Promise<void> => {
    const userId = req.schoolUser!.id;
   const user = await prisma.schoolUser.findUnique({
        where: { id: userId },
        select: { role: true, schoolId: true }
      });
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      if (user.role !== SchoolRole.ADMIN) {
        res.status(403).json({ message: 'Forbidden: Only admins can add teachers' });
        return;
      }
      //console.log("User attempting to create student:", user);

  const { name, email, classId, schoolId } = req.body;
  if (!name || !email || !classId) {
     res.status(400).json({ message: "Missing fields" });
     return;
  }

  try {
    const tempPass = generateTempPassword(8);
    const hashed = await bcrypt.hash(tempPass, 10);

    const student = await prisma.teacher.create({
      data: {
        name,
        email,
        password: hashed,
        classId,
        schoolId: schoolId, // Use the schoolId from the user if not provided
      },
    });

    res.status(201).json(student);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
     res.status(409).json({ message: 'Email already exists' });
     return;
    }
    res.status(500).json({ message: "Failed to create teacher" });
  }
};

