import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import { createOrUpdateOTP, sendOTPEmail } from "../utils/OtpUtils";

const prisma = new PrismaClient();

// Resend OTP to user's email
export const resendOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: "Email is required" });
      return;
    }

    // Check if user exists
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Generate new OTP and update user record
    const otp = await createOrUpdateOTP(email);

    // Send OTP to user's email
    await sendOTPEmail(email, otp);

    res.status(200).json({ message: "OTP resent successfully" });
  } catch (error) {
    console.error("Resend OTP error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};

// Verify OTP implementation (moved from auth.ts)
export const verifyOTP = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, otp } = req.body;

    if (!email || !otp) {
      res.status(400).json({ message: "Email and OTP are required" });
      return;
    }

    // Find user by email
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true, otp: true, otpExpires: true, firstName: true, email: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    // Check OTP validity
    if (user.otp !== otp || new Date() > (user.otpExpires as Date)) {
      res.status(400).json({ message: "Invalid or expired OTP" });
      return;
    }

    // Clear OTP after successful verification
    await prisma.user.update({
      where: { id: user.id },
      data: { otp: null, otpExpires: null },
    });

    // Generate auth token
    const jwt = require('jsonwebtoken');
    const token = jwt.sign(
      { userId: user.id },
      process.env.JWT_SECRET!,
      { expiresIn: '3d' }
    );

    res.status(200).json({ 
      message: "OTP verified successfully!",
      token,
      user: { id: user.id, email: user.email, firstName: user.firstName }
    });

  } catch (error) {
    console.error("OTP verification error:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    res.status(500).json({ message: "Server error", error: errorMessage });
  }
};