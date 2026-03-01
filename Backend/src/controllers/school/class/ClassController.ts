import { Request, Response } from 'express';
import { PrismaClient, SchoolRole } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

// Validation schemas
const classSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
});

const updateClassSchema = z.object({
  name: z.string().min(1, 'Class name is required').max(100),
});

/**
 * Get all classes for a school
 */
export const getClasses = async (req: Request, res: Response): Promise<void> => {
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
    
    const classes = await prisma.class.findMany({
      where: { schoolId: user.schoolId },
      orderBy: { name: 'asc' },
    });
    
    res.status(200).json(classes);
    return;
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ message: 'Failed to retrieve classes' });
    return;
  }
};

/**
 * Add a new class
 * Only ADMIN and TEACHER roles can add classes
 */
export const createClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    const validationResult = classSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
      return;
    }
    
    const { name } = validationResult.data;
    
    // Check if the user has permission to add a class
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
      res.status(403).json({ message: 'Forbidden: Only admins and teachers can add classes' });
      return;
    }
    
    // Check if the class already exists for this school
    const existingClass = await prisma.class.findFirst({
      where: {
        name: name,
        schoolId: user.schoolId
      }
    });
    
    if (existingClass) {
      res.status(409).json({ message: 'A class with this name already exists' });
      return;
    }
    
    // Create the class
    const newClass = await prisma.class.create({
      data: {
        name,
        schoolId: user.schoolId
      }
    });
    
    res.status(201).json(newClass);
    return;
  } catch (error) {
    console.error('Error adding class:', error);
    res.status(500).json({ message: 'Failed to add class' });
    return;
  }
};

/**
 * Update a class
 * Only ADMIN and TEACHER roles can update classes
 */
export const updateClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    const { id } = req.params;
    const validationResult = updateClassSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      res.status(400).json({ 
        message: 'Validation error', 
        errors: validationResult.error.errors 
      });
      return;
    }
    
    const { name } = validationResult.data;
    
    // Check if the user has permission to update a class
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
      res.status(403).json({ message: 'Forbidden: Only admins and teachers can update classes' });
      return;
    }
    
    // Check if the class exists and belongs to the user's school
    const classItem = await prisma.class.findUnique({
      where: { id }
    });
    
    if (!classItem) {
      res.status(404).json({ message: 'Class not found' });
      return;
    }
    
    if (classItem.schoolId !== user.schoolId) {
      res.status(403).json({ message: 'Forbidden: You can only update classes from your school' });
      return;
    }
    
    // Check if the new name would conflict with an existing class
    const existingClass = await prisma.class.findFirst({
      where: {
        name,
        schoolId: user.schoolId,
        id: { not: id }
      }
    });
    
    if (existingClass) {
      res.status(409).json({ message: 'A class with this name already exists' });
      return;
    }
    
    // Update the class
    const updatedClass = await prisma.class.update({
      where: { id },
      data: { name }
    });
    
    res.status(200).json(updatedClass);
    return;
  } catch (error) {
    console.error('Error updating class:', error);
    res.status(500).json({ message: 'Failed to update class' });
    return;
  }
};

/**
 * Delete a class
 * Only ADMIN and TEACHER roles can delete classes
 */
export const deleteClass = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.schoolUser!.id;
    const { id } = req.params;
    
    // Check if the user has permission to delete a class
    const user = await prisma.schoolUser.findUnique({
      where: { id: userId },
      select: { role: true, schoolId: true }
    });
    
    if (!user) {
      res.status(404).json({ message: 'User not found' });
      return;
    }
    
    if (user.role !== SchoolRole.ADMIN && user.role !== SchoolRole.TEACHER) {
      res.status(403).json({ message: 'Forbidden: Only admins and teachers can delete classes' });
      return;
    }
    
    // Check if the class exists and belongs to the user's school
    const classItem = await prisma.class.findUnique({
      where: { id }
    });
    
    if (!classItem) {
      res.status(404).json({ message: 'Class not found' });
      return;
    }
    
    if (classItem.schoolId !== user.schoolId) {
      res.status(403).json({ message: 'Forbidden: You can only delete classes from your school' });
      return;
    }
    
    // Check if the class is associated with any students
    const studentsCount = await prisma.student.count({
      where: { classId: id }
    });
    
    if (studentsCount > 0) {
      res.status(409).json({ 
        message: 'Cannot delete class: It is associated with students', 
        studentsCount 
      });
      return;
    }
    
    // Delete the class
    await prisma.class.delete({
      where: { id }
    });
    
    res.status(200).json({ message: 'Class deleted successfully' });
    return;
  } catch (error) {
    console.error('Error deleting class:', error);
    res.status(500).json({ message: 'Failed to delete class' });
    return;
  }
};