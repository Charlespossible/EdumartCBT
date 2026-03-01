import nodemailer from "nodemailer";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Generate a random 6-digit OTP
export const generateOTP = (): string => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};
  const otp = generateOTP();

// Configure email transporter
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

// Send OTP to user's email
export const sendOTPEmail = async (email: string, otp: string): Promise<void> => {
  const mailOptions = {
    from: `"EduMart CBT" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: "Your Verification Code",
    text: `Hello,\n\nThank you for registering. Please use the following code to verify your account: ${otp}\n\nThis code will expire in 3 days.\n\nIf you didn't request this code, please ignore this email.\n\nRegards,\nEduMart CBT Team`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #66934e;">Email Verification</h2>
        </div>
        <p>Hello,</p>
        <p>Thank you for registering with EduMart CBT. Please use the following code to verify your account:</p>
        <div style="text-align: center; margin: 30px 0; background-color: #f5f5f5; padding: 15px; font-size: 24px; font-weight: bold; letter-spacing: 5px;">
          ${otp}
        </div>
         <div style="text-align: center; margin: 20px 0;">
          <a href="edumartcbt.com/otp-verification?email=${encodeURIComponent(email)}" style="background-color: #66934e; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block; font-weight: bold;">
            Verify Your Account
          </a>
        </div>
        <p style="text-align: center; font-size: 14px; color: #777;">
          Or copy and paste this URL into your browser:<br>
          <a href="edumartcbt.com/otp-verification?email=${encodeURIComponent(email)}" style="color: #4a90e2; word-wrap: break-word;">
           edumartcbt.com/otp-verification?email=${encodeURIComponent(email)}
          </a>
        </p>
        <p>This code will expire in 3 days. If you didn't request this code, please ignore this email.</p>
        <p>Regards,<br>EduMart CBT Team</p>
      </div>
    `
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Failed to send OTP email");
  }
};

// Create or update OTP for a user
export const createOrUpdateOTP = async (email: string): Promise<string> => {
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000);
  
  try {
    // Update user with new OTP
    await prisma.user.update({
      where: { email },
      data: { otp, otpExpires }
    });
    
    return otp;
  } catch (error) {
    console.error("Error updating OTP:", error);
    throw new Error("Failed to update OTP");
  }
};

// Verify if OTP is valid
export const verifyUserOTP = async (email: string, otp: string): Promise<boolean> => {
  try {
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user || user.otp !== otp || new Date() > (user.otpExpires as Date)) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error("Error verifying OTP:", error);
    throw new Error("Failed to verify OTP");
  }
};

// Clear OTP after verification
export const clearUserOTP = async (userId: string): Promise<void> => {
  try {
    await prisma.user.update({
      where: { id: userId },
      data: { otp: null, otpExpires: null }
    });
  } catch (error) {
    console.error("Error clearing OTP:", error);
    throw new Error("Failed to clear OTP");
  }
};