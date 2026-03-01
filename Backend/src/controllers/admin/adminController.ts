import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import multer from "multer";
import path from "path";
import fs from "fs";

const prisma = new PrismaClient();

// Get all users with pagination
export const getUsers = async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const skip = (page - 1) * limit;

  try {
    const total = await prisma.user.count();
    const users = await prisma.user.findMany({
      skip,
      take: limit,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phoneNumber: true,
      },
    });

    res.status(200).json({
      users,
      total,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete a user
export const deleteUser = async (req: Request, res: Response):Promise<void> => {
  const { id } = req.params;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    await prisma.user.delete({ where: { id } });
    res.status(200).json({ message: "User deleted successfully" });
  } catch (error) {
    console.error("Error deleting user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};


export const updateUsers = async (req: Request, res: Response):Promise<void> => {
  const { id } = req.params;
  const { firstName, lastName, email, phoneNumber } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
       res.status(404).json({ message: "User not found" });
       return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phoneNumber,
      },
    });

    res.status(200).json(updatedUser);
  } catch (error) {
    console.error("Error updating user:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

export const getQuestions = async (req: Request, res: Response) => {
  const { subjectName, examType, year } = req.query;
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 3;
  
  try {
    // Build the where clause with intelligent matching
    const whereClause: any = {};
    
    // Handle year filter (exact match)
    if (year) {
      whereClause.year = parseInt(year as string);
    }
    
    // Build conditions array for AND logic
    const andConditions: any[] = [];
    
    // Handle intelligent subjectName matching (matches second word - the actual subject)
    if (subjectName && typeof subjectName === 'string' && subjectName.trim()) {
      andConditions.push({
        subjectName: {
          contains: subjectName.trim(),
          mode: 'insensitive' // Case-insensitive matching
        }
      });
    }
    
    // Handle intelligent examType matching (matches first word - the exam prefix)
    if (examType && typeof examType === 'string' && examType.trim()) {
      andConditions.push({
        subjectName: {
          startsWith: examType.trim(),
          mode: 'insensitive' // Case-insensitive matching
        }
      });
    }
    
    // Combine all conditions
    if (andConditions.length > 0) {
      whereClause.AND = andConditions;
    }
    
    // Fetch questions with filters
    const questions = await prisma.exam.findMany({
      where: whereClause,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: {
        id: 'asc' // Optional: maintain consistent ordering
      }
    });
    
    // Get total count with same filters
    const total = await prisma.exam.count({ where: whereClause });
    
    res.json({ questions, total });
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ error: "Failed to fetch questions" });
  }
};

export const updateQuestion = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const {
    question,
    subjectName,
    examType,
    year,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    explanation,
    questionImageUrl,
  } = req.body;

  try {
    // Build data object with ONLY fields that are actually provided
    const data: any = {};

    // Only add fields that are explicitly provided (not undefined)
    if (question !== undefined) data.question = question;
    if (subjectName !== undefined) data.subjectName = subjectName;
    if (examType !== undefined) data.examType = examType;
    if (year !== undefined) {
      // Handle year - could be string or number
      data.year = typeof year === 'string' ? parseInt(year, 10) : year;
    }
    if (optionA !== undefined) data.optionA = optionA;
    if (optionB !== undefined) data.optionB = optionB;
    if (optionC !== undefined) data.optionC = optionC;
    if (optionD !== undefined) data.optionD = optionD;
    if (correctAnswer !== undefined) data.correctAnswer = correctAnswer;
    if (explanation !== undefined) data.explanation = explanation;
    if (questionImageUrl !== undefined) data.questionImageUrl = questionImageUrl;

    // Check if there's anything to update
    if (Object.keys(data).length === 0) {
      res.status(400).json({ error: "No fields to update" });
      return;
    }

    // Get the current question to check for unique constraint
    const currentQuestion = await prisma.exam.findUnique({
      where: { id: parseInt(id, 10) },
    });

    if (!currentQuestion) {
      res.status(404).json({ error: "Question not found" });
      return;
    }

    // Build the values that will be checked for uniqueness
    const finalSubjectName = data.subjectName ?? currentQuestion.subjectName;
    const finalYear = data.year ?? currentQuestion.year;
    const finalQuestion = data.question ?? currentQuestion.question;

    // Check if another question with same unique combination exists
    const duplicate = await prisma.exam.findFirst({
      where: {
        subjectName: finalSubjectName,
        year: finalYear,
        question: finalQuestion,
        NOT: { id: parseInt(id, 10) }, // Exclude current question
      },
    });

    if (duplicate) {
      res.status(409).json({ 
        error: "A question with the same subject, year, and text already exists",
        duplicateId: duplicate.id 
      });
      return;
    }

    const updatedQuestion = await prisma.exam.update({
      where: { id: parseInt(id, 10) },
      data,
    });

    res.json(updatedQuestion);
  } catch (error: any) {
    // Log the FULL error for debugging
    console.error("Error updating question:");
    console.error("Error name:", error?.name);
    console.error("Error message:", error?.message);
    console.error("Error code:", error?.code);
    console.error("Full error:", JSON.stringify(error, null, 2));
    
    // Send more detailed error response
    res.status(500).json({ 
      error: "Failed to update question",
      details: error?.message || "Unknown error",
      code: error?.code || "UNKNOWN"
    });
  }
};

export const deleteQuestion = async (req:Request, res:Response) => {
  const { id } = req.params;
  try {
    await prisma.exam.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete question" });
  }
};


// Create a new admin user
export const createAdmin = async (req: Request, res: Response):Promise<void> => {
  const { email, password } = req.body;

  try {
    // Check for existing admin with the same email
    const existingAdmin = await prisma.admin.findUnique({ where: { email } });
    if (existingAdmin) {
       res.status(400).json({ message: "Admin with this email already exists" });
       return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the new admin
    const newAdmin = await prisma.admin.create({
      data: {
        email,
        password: hashedPassword,
        name: "admin", // Default value from model
        role: "ADMIN", // Default value from model
      },
    });

    res.status(201).json({ message: "Admin created successfully", admin: newAdmin });
  } catch (error) {
    console.error("Error creating admin:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const uploadDir = path.join(process.cwd(), "uploads", "questions");
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `question-${uniqueSuffix}${ext}`);
  },
});

// File filter for images only
const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, GIF and WebP are allowed."));
  }
};

// Multer upload configuration
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max file size
  },
});

// Upload question image endpoint
export const uploadQuestionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.file) {
      res.status(400).json({ error: "No image file provided" });
      return;
    }

    // Construct the image URL (adjust based on your server setup)
    const imageUrl = `${req.protocol}://${req.get("host")}/uploads/questions/${req.file.filename}`;
    
    res.status(200).json({
      message: "Image uploaded successfully",
      imageUrl: imageUrl,
      filename: req.file.filename,
    });
  } catch (error) {
    console.error("Error uploading image:", error);
    res.status(500).json({ error: "Failed to upload image" });
  }
};

// Delete question image (optional - for cleanup)
export const deleteQuestionImage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { filename } = req.params;
    const filePath = path.join(__dirname, "../uploads/questions", filename);

    // Check if file exists
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      res.status(200).json({ message: "Image deleted successfully" });
    } else {
      res.status(404).json({ error: "Image not found" });
    }
  } catch (error) {
    console.error("Error deleting image:", error);
    res.status(500).json({ error: "Failed to delete image" });
  }
};

// Search questions by text content
export const searchQuestionByText = async (req: Request, res: Response): Promise<void> => {
  const { searchText } = req.query;

  try {
    // Validate search text
    if (!searchText || typeof searchText !== 'string' || searchText.trim().length < 3) {
      res.status(400).json({ 
        error: "Search text must be at least 3 characters long" 
      });
      return;
    }

    const trimmedSearch = searchText.trim();

    // Search for questions containing the search text (case-insensitive)
    const questions = await prisma.exam.findMany({
      where: {
        question: {
          contains: trimmedSearch,
          mode: 'insensitive',
        },
      },
      take: 10, 
      orderBy: {
        id: 'desc', 
      },
    });

    // Calculate match relevance (how much of the question matches)
    const resultsWithRelevance = questions.map((q) => {
      const questionLower = q.question.toLowerCase();
      const searchLower = trimmedSearch.toLowerCase();
      
      // Check for exact match
      const isExactMatch = questionLower === searchLower;
      
      // Check if search text appears at the start
      const startsWithSearch = questionLower.startsWith(searchLower);
      
      // Calculate percentage of question that matches
      const matchPercentage = Math.round((trimmedSearch.length / q.question.length) * 100);

      return {
        ...q,
        matchInfo: {
          isExactMatch,
          startsWithSearch,
          matchPercentage,
        },
      };
    });

    // Sort by relevance: exact matches first, then starts with, then by match percentage
    resultsWithRelevance.sort((a, b) => {
      if (a.matchInfo.isExactMatch && !b.matchInfo.isExactMatch) return -1;
      if (!a.matchInfo.isExactMatch && b.matchInfo.isExactMatch) return 1;
      if (a.matchInfo.startsWithSearch && !b.matchInfo.startsWithSearch) return -1;
      if (!a.matchInfo.startsWithSearch && b.matchInfo.startsWithSearch) return 1;
      return b.matchInfo.matchPercentage - a.matchInfo.matchPercentage;
    });

    res.status(200).json({
      results: resultsWithRelevance,
      count: resultsWithRelevance.length,
      searchText: trimmedSearch,
    });
  } catch (error: any) {
    console.error("Error searching questions:", error);
    res.status(500).json({ 
      error: "Failed to search questions",
      details: error?.message || "Unknown error",
    });
  }
};

// Create a new question
export const createQuestion = async (req: Request, res: Response): Promise<void> => {
  const {
    question,
    subjectName,
    examType,
    year,
    optionA,
    optionB,
    optionC,
    optionD,
    correctAnswer,
    explanation,
    questionImageUrl,
    questionsGroupId,
  } = req.body;

  try {
    // Validate required fields
    if (!question || !subjectName || !examType || !year) {
      res.status(400).json({ 
        error: "Missing required fields: question, subjectName, examType, and year are required" 
      });
      return;
    }

    // Parse year if it's a string
    const parsedYear = typeof year === 'string' ? parseInt(year, 10) : year;

    if (isNaN(parsedYear)) {
      res.status(400).json({ error: "Invalid year format" });
      return;
    }

    // Check if question already exists (unique constraint: subjectName + year + question)
    const existingQuestion = await prisma.exam.findFirst({
      where: {
        subjectName,
        year: parsedYear,
        question,
      },
    });

    if (existingQuestion) {
      res.status(409).json({ 
        error: "A question with the same subject, year, and text already exists",
        existingId: existingQuestion.id,
      });
      return;
    }

    // Generate questionsGroupId if not provided
    // Format: examType-subjectName-year (e.g., "WAEC-Mathematics-2024")
    const groupId = questionsGroupId || `${examType}-${subjectName.replace(/\s+/g, '_')}-${parsedYear}`;

    // Create the new question
    const newQuestion = await prisma.exam.create({
      data: {
        question,
        subjectName,
        examType,
        year: parsedYear,
        optionA: optionA || null,
        optionB: optionB || null,
        optionC: optionC || null,
        optionD: optionD || null,
        correctAnswer: correctAnswer || null,
        explanation: explanation || null,
        questionImageUrl: questionImageUrl || null,
        questionsGroupId: groupId,
      },
    });

    res.status(201).json({
      message: "Question created successfully",
      question: newQuestion,
    });
  } catch (error: any) {
    console.error("Error creating question:", error);
    res.status(500).json({ 
      error: "Failed to create question",
      details: error?.message || "Unknown error",
    });
  }
};

// Get available categories (for dropdowns)
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get unique exam types
    const examTypes = await prisma.exam.findMany({
      select: { examType: true },
      distinct: ['examType'],
      orderBy: { examType: 'asc' },
    });

    // Get unique subject names
    const subjectNames = await prisma.exam.findMany({
      select: { subjectName: true },
      distinct: ['subjectName'],
      orderBy: { subjectName: 'asc' },
    });

    // Get unique years
    const years = await prisma.exam.findMany({
      select: { year: true },
      distinct: ['year'],
      orderBy: { year: 'desc' },
    });

    res.status(200).json({
      examTypes: examTypes.map(e => e.examType),
      subjectNames: subjectNames.map(s => s.subjectName),
      years: years.map(y => y.year),
    });
  } catch (error: any) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ error: "Failed to fetch categories" });
  }
};