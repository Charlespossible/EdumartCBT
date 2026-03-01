import  { Request, Response } from 'express';
import axios from 'axios';
import { PrismaClient } from '@prisma/client';


const prisma = new PrismaClient();

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;


// Route to verify a payment transaction and create a subscription
export const verify = async (req: Request, res: Response) => {
  const { reference, examType } = req.body; // Extract examType from request body
  try {
    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    const { status, data } = response.data;
    if (status && data.status === "success") {
      const subscription = await prisma.subscription.create({
        data: {
          userId: req.user?.id ?? "",
          reference,
          plan: `${examType}-yearly`, 
          amount: data.amount / 1000, 
          startDate: new Date(),
          endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)),
          examType, 
        },
      });
      res.json({ message: "Subscription successful", subscription });
    } else {
      res.status(400).json({ message: "Transaction failed" });
    }
  } catch (error) {
    console.error("Error verifying transaction:", error);
    res.status(500).json({ message: "Failed to verify transaction" });
  }
};


