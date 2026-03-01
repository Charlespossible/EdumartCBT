import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { v4 as uuidv4 } from 'uuid';
import { generateOTP, sendOTPEmail } from "../utils/OtpUtils";
import { generateAccessToken, generateRefreshToken } from "../utils/Jwt";

// Initialize Prisma client once
const prisma = new PrismaClient();

// Centralized error handling
const handleError = (res: Response, error: unknown, message: string = "Server error"): void => {
  console.error(`${message}:`, error);
  const errorMessage = error instanceof Error ? error.message : "Unknown error";
  res.status(500).json({ message, error: errorMessage });
};

// REGISTER FUNCTION - Optimized
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { firstName, lastName, email, phoneNumber, password, referer } = req.body;

    // Validate required fields
    if (!firstName || !lastName || !email || !password) {
      res.status(400).json({ message: "Missing required fields" });
      return;
    }

    // Check if user exists (optimized query with select)
    const existingUser = await prisma.user.findUnique({ 
      where: { email },
      select: { id: true }
    });
      
    if (existingUser) {
      res.status(400).json({ message: "Email already exists" });
      return;
    }

    // Generate OTP and hash password concurrently
    const [otp, hashedPassword] = await Promise.all([
      Promise.resolve(generateOTP()),
      bcrypt.hash(password, 10)
    ]);
    
    const otpExpires = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days

    // Create user transaction
    const newUser = await prisma.$transaction(async (tx) => {
      // Create the user
      const user = await tx.user.create({
        data: {
          firstName,
          lastName,
          email,
          phoneNumber,
          password: hashedPassword,
          referer,
          otp,
          otpExpires,
        },
        select: {
          id: true,
        }
      });

      // Handle referral if provided
      if (referer) {
        const referrer = await tx.user.findUnique({
          where: { email: referer },
          select: { id: true }
        });

        if (referrer) {
          // Generate random earnings between ₦500 and ₦2000
          const randomEarnings = Math.floor(Math.random() * 1501) + 500;

          // Create referral record
          await tx.referral.create({
            data: {
              referrerId: referrer.id,
              referredId: user.id,
              earnings: randomEarnings,
            },
          });
        }
      }

      return user;
    });

    // Send OTP email (done outside the transaction to not block it)
    await sendOTPEmail(email, otp);

    // Generate JWT token
    const token = jwt.sign(
      { userId: newUser.id },
      process.env.JWT_SECRET!,
      { expiresIn: "3d" }
    );

    res.status(201).json({
      message: "Registration successful! OTP sent to your email.",
      token,
    });
  } catch (error) {
    handleError(res, error, "Registration error");
  }
};

// LOGIN FUNCTION - Optimized
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Email and password are required" });
      return;
    }

    // Get only the fields we need
    const user = await prisma.user.findUnique({ 
      where: { email },
      select: { 
        id: true, 
        firstName: true, 
        lastName: true, 
        email: true, 
        password: true, 
        role: true, 
        otp: true,
        currentSessionToken: true
      }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    if (user.otp !== null) {
      res.status(403).json({ message: "Please verify your OTP before logging in" });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      res.status(401).json({ message: "Incorrect password" });
      return;
    }

    if (user.currentSessionToken) {
      res.status(403).json({ message: "Already logged in on another device" });
      return;
    }

    // Generate a unique session token
    const sessionToken = uuidv4();

    // Update user and generate tokens in parallel
    const [_, accessToken, refreshToken] = await Promise.all([
      prisma.user.update({
        where: { id: user.id },
        data: { currentSessionToken: sessionToken },
      }),
      generateAccessToken({ 
        id: user.id, 
        sessionToken, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role 
      }),
      generateRefreshToken({ 
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        role: user.role 
      })
    ]);

    res.status(200).json({
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id, 
        firstName: user.firstName, 
        lastName: user.lastName, 
        email: user.email, 
        role: user.role 
      },
    });
  } catch (error) {
    handleError(res, error, "Login error");
  }
};

// REFRESH TOKEN - Optimized
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const refreshToken = req.cookies.refreshToken;
    
    if (!refreshToken) {
      res.status(401).json({ message: "No refresh token, please login" });
      return;
    }
    
    if (!process.env.JWT_REFRESH_SECRET) {
      throw new Error("JWT_REFRESH_SECRET is missing");
    }

    jwt.verify(
      refreshToken, 
      process.env.JWT_REFRESH_SECRET, 
      (err: any, decoded: any) => {
        if (err) {
          return res.status(403).json({ message: "Invalid refresh token" });
        }

        const newAccessToken = generateAccessToken({ 
          id: decoded.id, 
          sessionToken: decoded.sessionToken, 
          firstName: decoded.firstName, 
          lastName: decoded.lastName, 
          role: decoded.role 
        });
        
        res.json({ accessToken: newAccessToken });
      }
    );
  } catch (error) {
    handleError(res, error, "Refresh Token Error");
  }
};

// GET PROFILE - Optimized
export const getProfile = async (req: Request, res: Response): Promise<void> => {
  try {
    // Extract the token from the Authorization header
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) {
      res.status(401).json({ message: "No token provided" });
      return;
    }

    // Verify the token and extract the user ID
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as { id: string };
    
    // Fetch only the needed fields
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        createdAt: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    handleError(res, error, "Error fetching profile");
  }
};

// SETTINGS - Optimized and renamed for consistency
export const getUserSettings = async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.params;

  if (!userId) {
    res.status(400).json({ message: "User ID is required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json(user);
  } catch (error) {
    handleError(res, error, "Error fetching user details");
  }
};

// GET USER - Optimized
export const getUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;

  if (!id) {
    res.status(400).json({ message: "User ID is required" });
    return;
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phoneNumber,
    });
  } catch (error) {
    handleError(res, error, "Error fetching user details");
  }
};

// UPDATE USER - Optimized
export const updateUser = async (req: Request, res: Response): Promise<void> => {
  const { id } = req.params;
  const { firstName, lastName, phone } = req.body;

  if (!id) {
    res.status(400).json({ message: "User ID is required" });
    return;
  }

  try {
    // Only update fields that were provided
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phone !== undefined) updateData.phoneNumber = phone;
    
    // Don't update if no fields were provided
    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No fields to update" });
      return;
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        firstName: true,
        lastName: true,
        phoneNumber: true,
      },
    });

    res.status(200).json({
      message: "User details updated successfully",
      user: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phoneNumber,
      },
    });
  } catch (error) {
    handleError(res, error, "Error updating user details");
  }
};

// LOGOUT - Optimized
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    
    if (!userId) {
      res.status(400).json({ message: "User ID is required" });
      return;
    }

    // Check if user exists while also updating
    const user = await prisma.user.update({
      where: { id: userId },
      data: { currentSessionToken: null },
      select: { id: true }
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    handleError(res, error, "Logout error");
  }
};

