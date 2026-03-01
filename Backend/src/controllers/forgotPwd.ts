import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import nodemailer from "nodemailer";
import crypto from "crypto";

const prisma = new PrismaClient();

// Forgot Password: Send reset link
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  // Get the host from the request
  //const host = "localhost:5173";  
  //const protocol = "http"; 
  const baseURL = "http://localhost:5173";
  
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate a more secure reset token
    const resetToken = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(resetToken).digest("hex");
    
    // Set token expiration time (1 hour from now)
    const tokenExpiry = new Date();
    tokenExpiry.setHours(tokenExpiry.getHours() + 1);

    // Save hashed reset token to the database
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        resetToken: hashedToken,
        resetTokenExpiry: tokenExpiry
      },
    });

    // Create reset URL - using the client-side URL for reset page
    const resetURL = `${baseURL}/reset-password?token=${resetToken}`;
    
    // Create email transporter
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

    // Create email content with improved HTML formatting
    const mailOptions = {
      from: `"EduMart CBT" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "Password Reset Request",
      text: `Hello,\n\nYou requested a password reset. Please click the following link to reset your password: ${resetURL}\n\nThis link is valid for 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nEduMart CBT Team`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <div style="text-align: center; margin-bottom: 20px;">
            <h2 style="color: #66934e;">Password Reset Request</h2>
          </div>
          <p>Hello,</p>
          <p>You requested a password reset for your EduMart CBT account.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetURL}" style="background-color: #66934e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Your Password</a>
          </div>
          <p>This link is valid for 1 hour. If you didn't request this password reset, please ignore this email.</p>
          <p>Regards,<br>EduMart CBT Team</p>
          <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e0e0e0; font-size: 12px; color: #888;">
            <p>If the button above doesn't work, copy and paste this URL into your browser: ${resetURL}</p>
          </div>
        </div>
      `,
    };

    // Send email
    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Reset link sent to your email" });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

// Reset Password: Update password
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      res.status(400).json({ message: "Token and new password are required" });
      return;
    }

    // Validate password strength
    const passwordRegex = /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z]).{8,}$/;
    if (!passwordRegex.test(newPassword)) {
      res.status(400).json({ 
        message: "Password must be at least 8 characters long and include uppercase, lowercase, and numbers." 
      });
      return;
    }

    // Hash the received token to compare with stored hash
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    
    // Find user with this token and check if token is still valid
    const user = await prisma.user.findFirst({ 
      where: { 
        resetToken: hashedToken,
        resetTokenExpiry: {
          gt: new Date() // Token must not be expired
        }
      } 
    });

    if (!user) {
      res.status(400).json({ message: "Invalid or expired token" });
      return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await prisma.user.update({
      where: { id: user.id },
      data: { 
        password: hashedPassword, 
        resetToken: null,
        resetTokenExpiry: null
      },
    });

    res.status(200).json({ message: "Password reset successfully" });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ message: "Server error" });
  }
};

export const Rpassword = (req:Request, res:Response) => {
  const token = req.query.token;
  res.redirect(`http://localhost:5173/reset-password?token=${token}`);
};