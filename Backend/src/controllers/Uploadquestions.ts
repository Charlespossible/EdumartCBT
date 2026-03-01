import { Request, Response } from "express";
import csvParser from "csv-parser";
import fs from "fs";
import { PrismaClient, ExamType } from "@prisma/client";
import { promisify } from "util";

const prisma = new PrismaClient();
const unlinkAsync = promisify(fs.unlink);

// Interface for processed file results
interface ProcessedFileResult {
  filename: string;
  inserted: number;
  skipped: number;
  errors: string[];
}

// Function to determine examType from subjectName
const determineExamType = (subjectName: string): ExamType => {
  const lowerSubject = subjectName.toLowerCase();
  if (lowerSubject.includes("waec")) return ExamType.WAEC;
  if (lowerSubject.includes("neco")) return ExamType.NECO;
  if (lowerSubject.includes("gce")) return ExamType.GCE;
  if (lowerSubject.includes("jamb")) return ExamType.JAMB;
  if (lowerSubject.includes("post utme") || lowerSubject.includes("post-utme")) return ExamType.POST_UTME;
  if (lowerSubject.includes("common entrance")) return ExamType.COMMON_ENTRANCE;
  if (lowerSubject.includes("professional exams")) return ExamType.PROFESSIONAL_EXAMS;
  throw new Error(`Could not determine examType from subjectName: ${subjectName}`);
};

// Create unique key for duplicate checking
const createUniqueKey = (subjectName: string, year: number, question: string): string => {
  return `${subjectName.trim()}-${year}-${question.trim().toLowerCase()}`;
};

// Robust batch insert with multiple fallback strategies
const insertQuestionsRobustly = async (validatedQuestions: any[]): Promise<{ inserted: number; skipped: number; errors: string[] }> => {
  const result = { inserted: 0, skipped: 0, errors: [] as string[] };

  try {
    // Strategy 1: Try createMany with skipDuplicates (original approach)
    console.log("Attempting batch insert with skipDuplicates...");
    const batchResult = await prisma.exam.createMany({
      data: validatedQuestions,
      skipDuplicates: true,
    });
    
    result.inserted = batchResult.count;
    result.skipped = validatedQuestions.length - batchResult.count;
    console.log(`Batch insert successful: ${result.inserted} inserted, ${result.skipped} skipped`);
    return result;
    
  } catch (batchError) {
    console.log("Batch insert failed, trying pre-filtering approach...", batchError);
    
    try {
      // Strategy 2: Pre-filter duplicates manually
      const uniqueKeys = new Set<string>();
      const deduplicatedQuestions = validatedQuestions.filter(q => {
        const key = createUniqueKey(q.subjectName, q.year, q.question);
        if (uniqueKeys.has(key)) {
          result.skipped++;
          return false;
        }
        uniqueKeys.add(key);
        return true;
      });

      // Check what already exists in database
      const existingQuestions = await prisma.exam.findMany({
        where: {
          OR: deduplicatedQuestions.map(q => ({
            AND: [
              { subjectName: q.subjectName },
              { year: q.year },
              { question: q.question }
            ]
          }))
        },
        select: { subjectName: true, year: true, question: true }
      });

      // Filter out existing questions
      const existingKeys = new Set(
        existingQuestions.map(q => createUniqueKey(q.subjectName, q.year, q.question))
      );

      const newQuestions = deduplicatedQuestions.filter(q => {
        const key = createUniqueKey(q.subjectName, q.year, q.question);
        if (existingKeys.has(key)) {
          result.skipped++;
          return false;
        }
        return true;
      });

      if (newQuestions.length > 0) {
        // Try batch insert without skipDuplicates
        const insertResult = await prisma.exam.createMany({
          data: newQuestions
          // No skipDuplicates since we pre-filtered
        });
        
        result.inserted = insertResult.count;
        console.log(`Pre-filtered insert successful: ${result.inserted} inserted, ${result.skipped} skipped`);
        return result;
      } else {
        console.log("No new questions to insert after filtering");
        return result;
      }
      
    } catch (preFilterError) {
      console.log("Pre-filtering failed, falling back to individual inserts...", preFilterError);
      
      // Strategy 3: Individual upserts (most reliable but slowest)
      result.inserted = 0;
      result.skipped = 0;
      
      for (const question of validatedQuestions) {
  try {
    // Check if record exists
    const existingRecord = await prisma.exam.findFirst({
      where: {
        AND: [
          { subjectName: question.subjectName },
          { year: question.year },
          { question: question.question }
        ]
      }
    });

    if (existingRecord) {
      await prisma.exam.update({
        where: { id: existingRecord.id },
        data: {
          questionsGroupId: question.questionsGroupId,    
          examType: question.examType,
          optionA: question.optionA,
          optionB: question.optionB,
          optionC: question.optionC,
          optionD: question.optionD,
          correctAnswer: question.correctAnswer,
          explanation: question.explanation,
          questionImageUrl: question.questionImageUrl,
          hasImage: question.hasImage,
        }
      });
      result.skipped++;
    } else {
      await prisma.exam.create({
        data: question
      });
      result.inserted++;
    }
    
  } catch (error) {
    result.errors.push(`Failed to process question: ${question.question.substring(0, 50)}... - ${error}`);
  }
}  
      
      console.log(`Individual upserts completed: ${result.inserted} inserted, ${result.skipped} skipped, ${result.errors.length} errors`);
      return result;
    }
  }
};

// Process a single CSV file with robust error handling
const processSingleFile = async (filePath: string): Promise<ProcessedFileResult> => {
  const result: ProcessedFileResult = {
    filename: filePath,
    inserted: 0,
    skipped: 0,
    errors: [],
  };

  try {
    const questions: any[] = [];
    const stream = fs.createReadStream(filePath).pipe(csvParser()).on("data", (row) => questions.push(row));

    await new Promise((resolve, reject) => {
      stream.on("end", resolve);
      stream.on("error", reject);
    });

    // Validate and transform data
    const validatedQuestions = questions
      .map((q, index) => {
        const missingFields = [];
        if (!q.questionsGroupId) missingFields.push("questionsGroupId");
        if (!q.subjectName) missingFields.push("subjectName");
        if (!q.year || isNaN(parseInt(q.year))) missingFields.push("year (must be a number)");
        if (!q.question) missingFields.push("question");

        // Handle examType
        let examType: ExamType | undefined;
        if (q.examType) {
          const upperExamType = q.examType.toUpperCase();
          if (Object.values(ExamType).includes(upperExamType as ExamType)) {
            examType = upperExamType as ExamType;
          } else {
            missingFields.push(`examType (invalid value: ${q.examType})`);
          }
        } else {
          try {
            examType = determineExamType(q.subjectName);
          } catch (error: any) {
            missingFields.push(`examType (${error.message})`);
          }
        }

        if (missingFields.length > 0) {
          result.errors.push(`Row ${index + 1}: Missing or invalid ${missingFields.join(", ")}`);
          return null;
        }

        if (!examType) {
          result.errors.push(`Row ${index + 1}: Missing or invalid examType`);
          return null;
        }

        return {
          questionsGroupId: q.questionsGroupId,
          subjectName: q.subjectName,
          year: parseInt(q.year),
          question: q.question,
          optionA: q.optionA || null,
          optionB: q.optionB || null,
          optionC: q.optionC || null,
          optionD: q.optionD || null,
          correctAnswer: q.correctAnswer || null,
          explanation: q.explanation || null,
          questionImageUrl: q.questionImageUrl || null,
          hasImage: Boolean(q.questionImageUrl),
          examType: examType,
        };
      })
      .filter((q) => q !== null);

    // Use robust insertion strategy
    const insertResult = await insertQuestionsRobustly(validatedQuestions);
    result.inserted = insertResult.inserted;
    result.skipped = insertResult.skipped;
    result.errors.push(...insertResult.errors);

  } catch (error: any) {
    result.errors.push(`Processing error: ${error instanceof Error ? error.message : "Unknown error"}`);
  } finally {
    try {
      await unlinkAsync(filePath);
    } catch (unlinkError) {
      console.warn(`Failed to delete file ${filePath}:`, unlinkError);
    }
  }

  return result;
};

// Main upload handler
const uploadQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      res.status(400).json({ message: "No files uploaded." });
      return;
    }

    // Process all files concurrently
    const processingPromises = (req.files as Express.Multer.File[]).map((file) => 
      processSingleFile(file.path)
    );
    const results = await Promise.all(processingPromises);

    // Aggregate results
    const totalInserted = results.reduce((sum, r) => sum + r.inserted, 0);
    const totalSkipped = results.reduce((sum, r) => sum + r.skipped, 0);
    const allErrors = results.flatMap((r) => r.errors);

    res.status(200).json({
      message: "Batch processing complete",
      totalInserted,
      totalSkipped,
      filesProcessed: results.length,
      errors: allErrors,
      details: results.map((r) => ({
        filename: r.filename,
        inserted: r.inserted,
        skipped: r.skipped,
        errors: r.errors,
      })),
    });
  } catch (error: any) {
    console.error("Upload error:", error);
    res.status(500).json({
      message: "Internal server error.",
      error: error.message,
    });
  }
};

export default uploadQuestions;