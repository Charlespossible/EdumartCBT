import cron from 'node-cron';
import { PrismaClient } from '@prisma/client';
import nodemailer from 'nodemailer';

const prisma = new PrismaClient();

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

// Define the subscription type with user relation
interface SubscriptionWithUser {
  id: number;
  userId: string;
  reference: string;
  amount: number;
  startDate: Date;
  endDate: Date | null;
  user: {
    email: string;
    firstName: string;
  };
}

// Schedule a daily task at midnight
cron.schedule('0 0 * * *', async () => {
  try {
    const subscriptions: SubscriptionWithUser[] = await prisma.subscription.findMany({
      where: {
        endDate: {
          lte: new Date(new Date().setDate(new Date().getDate() + 365)), 
          gte: new Date(), // Not yet expired
        },
      },
      include: { user: true }, 
    });

    for (const sub of subscriptions) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: sub.user.email,
        subject: 'Subscription Expiry Reminder',
        text: `Dear ${sub.user.firstName}, your subscription will expire on ${sub.endDate ? sub.endDate.toDateString() : 'an unknown date'}. Renew now to continue enjoying access!`,
      };

      await transporter.sendMail(mailOptions);
    }
  } catch (error) {
    console.error('Error sending subscription reminders:', error);
  }
})