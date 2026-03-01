import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Constants
const SUBSCRIPTION_FEE = 2000;
const REFERRAL_PERCENTAGE = 0.05; // 5% commission

// API endpoint to fetch referral stats
export const getStats = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }
    const userId = req.user.id; // Get authenticated user's ID

    // Aggregate referral data for the user
    const referralStats = await prisma.referral.aggregate({
      where: { referrerId: userId }, 
      _count: { id: true },
    });

    // Calculate total earnings based on number of successful referrals
    const referredCount = referralStats._count.id || 0;
    const earningsPerReferral = SUBSCRIPTION_FEE * REFERRAL_PERCENTAGE;
    const totalEarnings = referredCount * earningsPerReferral;

    // Format the response
    const stats = {
      referredCount,
      totalEarnings,
      earningsPerReferral,
      subscriptionFee: SUBSCRIPTION_FEE,
    };

    // Send successful response
    res.status(200).json(stats);
  } catch (error) {
    // Log error and send error response
    console.error('Error fetching referral stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

// New endpoint to record a successful referral
export const recordReferral = async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { referredUserId } = req.body;
    
    if (!referredUserId) {
      res.status(400).json({ message: 'Missing referredUserId' });
      return;
    }

    // Calculate earnings for this referral
    const earnings = SUBSCRIPTION_FEE * REFERRAL_PERCENTAGE;

    // Create a new referral record
    const referral = await prisma.referral.create({
      data: {
        referrerId: req.user.id,
        referredId: referredUserId,
        earnings: earnings,
      },
    });

    res.status(201).json({
      message: 'Referral recorded successfully',
      referral,
    });
  } catch (error) {
    console.error('Error recording referral:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

