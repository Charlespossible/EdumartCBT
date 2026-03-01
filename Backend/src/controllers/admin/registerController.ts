import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Admin Registration Route
export const adminRegister =  async (req:Request, res:Response):Promise<void> => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
     res.status(400).json({ message: 'Please provide name, email, and password' });
     return;
  }

  try {
   
    const existingAdmin = await prisma.admin.findUnique({
      where: { email },
    });
    if (existingAdmin) {
       res.status(400).json({ message: 'Admin with this email already exists' });
       return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newAdmin = await prisma.admin.create({
      data: {
        name,
        email,
        password: hashedPassword,
      },
    });

    res.status(201).json({
      message: 'Admin registered successfully',
      admin: { id: newAdmin.id, name: newAdmin.name, email: newAdmin.email },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
};
