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

export const getStudents = async (req: Request, res: Response): Promise<void> => {
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
    
    const students = await prisma.student.findMany({
      where: { schoolId: user.schoolId.toString() },
      orderBy: { name: 'asc' },
    });
    
    res.status(200).json(students);
    return;
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Failed to retrieve student' });
    return;
  }
};

// POST /school/create-students
export const CreateStudent = async (req: Request, res: Response): Promise<void> => {
    const userId = req.schoolUser!.id;
   const user = await prisma.schoolUser.findUnique({
        where: { id: userId },
        select: { role: true, schoolId: true }
      });
      
      if (!user) {
        res.status(404).json({ message: 'User not found' });
        return;
      }
      
      if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
        res.status(403).json({ message: 'Forbidden: Only admins and teachers can add students' });
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

    const student = await prisma.student.create({
      data: {
        name,
        email,
        password: hashed,
        classId,
        schoolId: schoolId || (user ? user.schoolId.toString() : undefined), // Use the schoolId from the user if not provided
      },
    });

    res.status(201).json(student);
  } catch (error: any) {
    console.error(error);
    if (error.code === 'P2002') {
     res.status(409).json({ message: 'Email already exists' });
     return;
    }
    res.status(500).json({ message: "Failed to create student" });
  }
};

// DELETE /school/delete-students/:id
export const DeleteStudents = async (req: Request, res: Response) => {
  const { user } = req as LocalRequest;
  // Fix: Check if user is ADMIN or TEACHER, not STUDENT
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { id } = req.params;
  try {
    await prisma.student.delete({ where: { id } });
    res.sendStatus(204);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to delete student" });
  }
};

// POST /school/student-credentials
export const StudentCredentials = async (req: Request, res: Response) => {
  const { user } = req as LocalRequest;
  // Fix: Check if user is ADMIN or TEACHER, not STUDENT
  if (!user || (user.role !== "ADMIN" && user.role !== "TEACHER")) {
    return res.status(403).json({ message: "Forbidden" });
  }

  const { studentId, expiresInDays } = req.body;
  if (!studentId || typeof expiresInDays !== 'number') {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    const tempPass = generateTempPassword(10);
    const hashed = await bcrypt.hash(tempPass, 10);

    // Update student password
    await prisma.student.update({
      where: { id: studentId },
      data: { password: hashed },
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + expiresInDays);

    res.json({
      studentName: student.name,
      studentEmail: student.email,
      tempPassword: tempPass,
      expiresAt: expiresAt.toISOString(),
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to create credentials" });
  }
};