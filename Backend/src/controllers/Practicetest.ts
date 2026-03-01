import  {Response, Request} from 'express';
import { PrismaClient , ExamType } from "@prisma/client";


const prisma = new PrismaClient();

// Get unique subjects for an examType
export const Practicetest =  async (req:Request, res:Response) => {
  const { examType } = req.params;
  try {
    const subjects = await prisma.exam.findMany({
      where: { examType: examType as ExamType },
      select: { subjectName: true },
      distinct: ['subjectName'],
    });
    res.json(subjects.map((item) => item.subjectName));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

// Get unique years for an examType and subjectName
export const PracticetestYear =  async (req:Request, res:Response) => {
  const { examType, subjectName } = req.params;
  try {
    const years = await prisma.exam.findMany({
      where: { examType: examType as ExamType , subjectName },
      select: { year: true },
      distinct: ['year'],
    });
    res.json(years.map((item) => item.year));
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch years' });
  }
};

// Get 10 random questions for an examType, subjectName, and year
export const getRandomQ =  async (req:Request, res:Response) => {
  const { examType, subjectName, year } = req.params;
  try {
    const questions = await prisma.exam.findMany({
      where: { examType: examType as ExamType , subjectName, year: parseInt(year) },
      select: {
        id: true,
        question: true,
        optionA: true,
        optionB: true,
        optionC: true,
        optionD: true,
        correctAnswer: true, 
      },
      take: 10,
      orderBy: { id: 'asc' }, 
    });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch questions' });
  }
};




// Check if the selected answer is correct
export const CheckAnswer = async (req:Request, res:Response):Promise<void> => {
  const { questionId, selectedAnswer } = req.body;

  if (!questionId || !selectedAnswer) {
     res.status(400).json({ error: 'questionId and selectedAnswer are required' });
     return;
  }

  try {
    // Fetch the question from the database
    const question = await prisma.exam.findUnique({
      where: { id: Number(questionId) },
      select: {
        correctAnswer: true,
        explanation: true,
      },
    });

    if (!question) {
       res.status(404).json({ error: 'Question not found' });
       return;
    }

    // Determine if the selected answer is correct
    const isCorrect = selectedAnswer === question.correctAnswer;

    // Respond with the result
    res.json({
      isCorrect,
      correctAnswer: question.correctAnswer, // Send this back for results display
      explanation: question.explanation || null, // Include explanation if available
    });
  } catch (error) {
    console.error('Error checking answer:', error);
    res.status(500).json({ error: 'Server error' });
  }
};

