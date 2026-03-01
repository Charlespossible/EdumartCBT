import { Request, Response } from 'express';
import { PrismaClient, SchoolRole } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();



// Validation schemas
const subjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
});

const updateSubjectSchema = z.object({
  name: z.string().min(1, 'Subject name is required').max(100),
});

/**
 * Get all subjects for a school
 */
export const getSubjects = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId   = req.schoolUser!.id;
    //const { role, schoolId } = req.schoolUser!;

    
    // Get the school ID from the user
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { schoolId: true }
    });
    
    if (!user) {
       res.status(404).json({ message: 'User not found' });
       return;
    }
    
    const subjects = await prisma.subject.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
    });
    
    res.status(200).json(subjects);
    return;
  } catch (error) {
    console.error('Error fetching subjects:', error);
    res.status(500).json({ message: 'Failed to retrieve subjects' });
    return;
  }
};

/**
 * Add a new subject
 * Only ADMIN and TEACHER roles can add subjects
 */
export const createSubject = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    const validationResult = subjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
     res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
      return ;
    }
    
    const { name } = validationResult.data;
    
    // Check if the user has permission to add a subject
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return ;
    }
    
    if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
      res.status(403).json({ message: 'Forbidden: Only admins and teachers can add subjects' });
      return ;
    }
    
    // Check if the subject already exists for this school
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name: name,
        schoolId: user.schoolId
      }
    });
    
    if (existingSubject) {
       res.status(409).json({ message: 'A subject with this name already exists' });
       return ;
    }
    
    // Create the subject
    const newSubject = await prisma.subject.create({
      data: {
        name,
        schoolId: user.schoolId
      }
    });
    
     res.status(201).json(newSubject);
     return ;
  } catch (error) {
    console.error('Error adding subject:', error);
   res.status(500).json({ message: 'Failed to add subject' });
   return ;
  }
};

/**
 * Update a subject
 * Only ADMIN and TEACHER roles can update subjects
 */
export const updateSubject = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    const { id } = req.params;
    const validationResult = updateSubjectSchema.safeParse(req.body);
    
    if (!validationResult.success) {
       res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
      return;
    }
    
    const { name } = validationResult.data;
    
    // Check if the user has permission to update a subject
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
       res.status(403).json({ message: 'Forbidden: Only admins and teachers can update subjects' });
       return;
    }
    
    // Check if the subject exists and belongs to the user's school
    const subject = await prisma.subject.findUnique({
      where: { id }
    });
    
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    
    if (subject.schoolId !== user.schoolId) {
       res.status(403).json({ message: 'Forbidden: You can only update subjects from your school' });
       return;
    }
    
    // Check if the new name would conflict with an existing subject
    const existingSubject = await prisma.subject.findFirst({
      where: {
        name,
        schoolId: user.schoolId,
        id: { not: id }
      }
    });
    
    if (existingSubject) {
       res.status(409).json({ message: 'A subject with this name already exists' });
       return;
    }
    
    // Update the subject
    const updatedSubject = await prisma.subject.update({
      where: { id },
      data: { name }
    });
    
    res.status(200).json(updatedSubject);
    return;
  } catch (error) {
    console.error('Error updating subject:', error);
    res.status(500).json({ message: 'Failed to update subject' });
    return;
  }
};

/**
 * Delete a subject
 * Only ADMIN and TEACHER roles can delete subjects
 */
export const deleteSubject = async (req: Request, res: Response):Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    const { id } = req.params;
    
    // Check if the user has permission to delete a subject
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true }
    });
    
    if (!user) {
       res.status(404).json({ message: 'User not found' });
       return;
    }
    
    if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
      res.status(403).json({ message: 'Forbidden: Only admins and teachers can delete subjects' });
      return;
    }
    
    // Check if the subject exists and belongs to the user's school
    const subject = await prisma.subject.findUnique({
      where: { id }
    });
    
    if (!subject) {
      res.status(404).json({ message: 'Subject not found' });
      return;
    }
    
    if (subject.schoolId !== user.schoolId) {
      res.status(403).json({ message: 'Forbidden: You can only delete subjects from your school' });
      return;
    }
    
    // Check if the subject is associated with any exams
    const examsCount = await prisma.schoolExam.count({
      where: { subjectId: id }
    });
    
    if (examsCount > 0) {
      res.status(409).json({ 
        message: 'Cannot delete subject: It is associated with exams', 
        examsCount 
      });
      return;
    }
    
    // Delete the subject
    await prisma.subject.delete({
      where: { id }
    });
    
     res.status(200).json({ message: 'Subject deleted successfully' });
     return;
  } catch (error) {
    console.error('Error deleting subject:', error);
    res.status(500).json({ message: 'Failed to delete subject' });
    return;
  }
};