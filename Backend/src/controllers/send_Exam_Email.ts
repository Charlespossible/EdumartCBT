import express, { Request, Response } from "express";
import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";
import dotenv from "dotenv";

dotenv.config();
const prisma = new PrismaClient();

// Email transporter setup
const transporter = nodemailer.createTransport({
  host: "mail.edumartcbt.com", 
  port: 465, 
  secure: true, 
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASSWORD, 
  },
  tls: {
    rejectUnauthorized: false, 
  },
  pool: true,
  maxConnections: 5,
  maxMessages: 100,
  connectionTimeout: 30000,
});

/**
 * Endpoint to send exam results via email
 */
export const sendResultEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract required fields from request body
    const { userId, examId, score } = req.body;

    // Validate input
    if (!userId || !examId || score === undefined) {
      res.status(400).json({ success: false, message: "Missing required fields: userId, examId, or score" });
      return;
    }

    // Fetch user and exam data in parallel
    const [user, exam, examResult] = await Promise.all([
      // Get user info
      prisma.user.findUnique({
        where: { id: userId },
        select: { email: true, firstName: true },
      }),
      
      // Get exam info
      prisma.exam.findUnique({
        where: { id: examId },
        select: { subjectName: true, year: true, examType: true },
      }),
      
      // Get the specific exam result to get additional context if available
      prisma.examResult.findFirst({
        where: {
          userId: userId,
          examId: examId,
        },
        orderBy: {
          createdAt: 'desc'
        }
      })
    ]);

    // Handle error cases
    if (!user) {
      res.status(404).json({ success: false, message: "User not found" });
      return;
    }

    if (!exam) {
      res.status(404).json({ success: false, message: "Exam not found" });
      return;
    }
    
    // Calculate percentage - the frontend would have displayed score out of questions.length
    const percentageScore = (score / (req.body.totalQuestions || score)) * 100;
    const formattedScore = percentageScore.toFixed(2);

    // Determine result status and styling
    const passed = percentageScore >= 50;
    const resultColor = passed ? '#2e7d32' : '#c62828';
    const resultBackground = passed ? '#e7f7e7' : '#ffebee';
    const resultMessage = passed 
      ? 'Congratulations on your performance!' 
      : 'Don\'t be discouraged! Keep practicing, you\'ll do better next time.';

    // Construct email content
    const emailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Exam Results: ${exam.subjectName} (${exam.year})</h2>
        <p>Hello ${user.firstName},</p>
        <p>Your results for the ${exam.examType} exam are now available:</p>
        
        <div style="background-color: ${resultBackground}; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: ${resultColor};">
            ${passed ? 'Congratulations! You passed!' : 'Not passed this time.'}
          </h3>
          <p style="font-size: 18px;">Your score: <strong>${score} out of ${req.body.totalQuestions || score}</strong></p>
          <p style="font-size: 18px;">Percentage: <strong>${formattedScore}%</strong></p>
        </div>
        
        <p>${resultMessage}</p>
        <p>You can view your detailed results by logging into your account.</p>
        <p>Best regards,<br>The EdumartCBT Team</p>
      </div>
    `;

    // Send the email
    await transporter.sendMail({
      from:`"EduMart CBT" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: `Your Exam Results for ${exam.subjectName} (${exam.year})`,
      html: emailHtml,
    });

    // Respond with success
    res.status(200).json({ success: true, message: "Exam results sent to email successfully" });
  } catch (error) {
    // Log error and respond with failure
    console.error("Error sending exam result email:", error);
    res.status(500).json({ success: false, message: "Failed to send exam results to email" });
  }
};
