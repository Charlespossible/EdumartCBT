import { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { PrismaClient, SchoolRole, SchoolType } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt , { SignOptions } from 'jsonwebtoken';

// Load environment variables
dotenv.config();

// Initialize Prisma client
const prisma = new PrismaClient();

// Configuration constants
const SALT_ROUNDS = 10;
const JWT_EXPIRY = {
  LOGIN: '8h',
  REGISTRATION: '7d'
};

// Custom interface for authenticated requests
interface AuthRequest extends Request {
  user?: any;
}

// Helper function for consistent error responses
export const createErrorResponse = (status: number, message: string) => ({
  status,
  json: { error: message }
});
  
// Middleware for authentication
export const authenticateSchoolUser = async (req: AuthRequest, res: Response, next: NextFunction):Promise<void> => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
     res.status(401).json({ error: 'Authentication required' });
     return;
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { 
      id: number; 
      schoolId: number; 
      role: SchoolRole;
    };
    
    // Get user with minimal fields for authentication
    const user = await prisma.schoolUser.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        password: true,
        role: true,
        schoolId: true,
        school: {
          select: {
            id: true,
            name: true,
            isVerified: true
          }
        }
      }
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid token' });
      return;
    }
    
    req.user = user;
    next();
  } catch (error) {
     res.status(401).json({ error: 'Invalid or expired token' });
     return;
  }
};

// Validation middleware for registration data
export const validateRegistrationData = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  const { schoolData, adminData } = req.body;
  
  // Check required fields for school
  if (!schoolData?.name || !schoolData?.email || !schoolData?.phone) {
    res.status(400).json({ error: 'Missing required school information' });
    return;
  }
  
  // Email validation
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(schoolData.email)) {
     res.status(400).json({ error: 'Invalid email format' });
     return;
  }
  
  // Check required fields for admin
  if (!adminData?.password || adminData.password.length < 8) {
     res.status(400).json({ error: 'Password must be at least 8 characters' });
     return;
  }
  
  next();
};

// Generate JWT token
const generateToken = (userId: number, schoolId: number, role: SchoolRole, expiresIn: string) => {
  return jwt.sign(
    { userId, schoolId, role },
    process.env.JWT_SECRET || '',
    { expiresIn } as SignOptions
  );
};


// School Registration
export const schoolRegister = async (req: Request, res: Response):Promise<void>=> {
  try {
    const { schoolData, adminData } = req.body;
    
    // Check if school email exists - use a cached query for better performance
    const existingSchool = await prisma.school.findUnique({
      where: { email: schoolData.email },
      select: { id: true } // Only select the ID for efficiency
    });
    
    if (existingSchool) {
      res.status(400).json({ error: 'School already registered with this email' });
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(adminData.password, SALT_ROUNDS);

    // Create school and admin user in a transaction for data consistency
    const result = await prisma.$transaction(async (tx) => {
      // Create school
      const school = await tx.school.create({
        data: {
          name: schoolData.name,
          email: schoolData.email,
          phone: schoolData.phone,
          address: schoolData.address,
          city: schoolData.city,
          state: schoolData.state,
          principalName: schoolData.principalName,
          type: schoolTypeStringToEnum(schoolData.type),
          isVerified: false
        }
      });

   
      function schoolTypeStringToEnum(typeString: string): any {
        switch(typeString) {
          case 'Primary School': return SchoolType.Primary_School;
          case 'Secondary School': return SchoolType.Secondary_School;
          case 'Vocational Schools': return SchoolType.Vocational_Institute;
          default:
            throw new Error(`Invalid school type: ${typeString}`);
        }
      }

      // Create admin user
      const adminUser = await tx.schoolUser.create({
        data: {
          email: school.email,
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: school.id,
          fullName: schoolData.principalName
        }
      });

      return { school, adminUser };
    });

    // Generate JWT
    const token = generateToken(
      result.adminUser.id, 
      result.school.id, 
      result.adminUser.role,
      JWT_EXPIRY.REGISTRATION
    );

    // Remove sensitive data
    const { password, ...adminWithoutPassword } = result.adminUser;

    // Return success response
    res.status(201).json({
      success: true,
      message: 'School registered successfully',
      data: {
        school: result.school,
        user: adminWithoutPassword,
        token
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed. Please try again.' });
  }
};

// School Login
export const schoolLogin = async (req: Request, res: Response):Promise<void> => {
  try {
    const { email, password, role, signInId } = req.body;

    if (role === 'ADMIN') {
      if (!email || !password) {
        res.status(400).json({ error: 'Email and password are required for admin login' });
        return;
      }

      const user = await prisma.schoolUser.findUnique({
        where: { email },
        include: { 
          school: {
            select: {
              id: true,
              name: true,
              email: true,
              isVerified: true,
              type: true
            }
          }
        }
      });

      if (!user || !user.school || user.role !== 'ADMIN') {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      const token = generateToken(
        user.id, 
        user.schoolId,
        user.role,
        JWT_EXPIRY.LOGIN
      );

      // Omit sensitive data
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          school: user.school,
          token
        }
      });
    } else if (role === 'TEACHER' || role === 'STUDENT') {
      if (!signInId) {
        res.status(400).json({ error: `${role} ID is required` });
        return;
      }

      const user = await prisma.schoolUser.findFirst({
        where: { 
          signInId: signInId,
          role: role as SchoolRole
        },
        include: { 
          school: {
            select: {
              id: true,
              name: true,
              email: true,
              isVerified: true,
              type: true
            }
          }
        }
      });

      if (!user || !user.school) {
        res.status(401).json({ error: 'Invalid ID' });
        return;
      }

      // Generate JWT
      const token = generateToken(
        user.id, 
        user.schoolId,
        user.role,
        JWT_EXPIRY.LOGIN
      );

      // Omit sensitive data
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({
        success: true,
        message: 'Login successful',
        data: {
          user: userWithoutPassword,
          school: user.school,
          token
        }
      });
    } else {
      res.status(400).json({ error: 'Invalid role specified' });
      return;
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed. Please try again.' });
  }
};

// Create School User (Admin only)
export const createUser = async (req: AuthRequest, res: Response):Promise<void> => {
  try {
    // Verify admin role
    if (req.user.role !== 'ADMIN') {
       res.status(403).json({ error: 'Admin access required for this operation' });
       return;
    }

    const { email, password, role, fullName, phone } = req.body;
    
    // Input validation
    if (!email || !password || !role || !fullName) {
       res.status(400).json({ error: 'Missing required user information' });
       return;
    }
    
    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
       res.status(400).json({ error: 'Invalid email format' });
       return;
    }
    
    // Check if email already exists
    const existingUser = await prisma.schoolUser.findUnique({
      where: { email },
      select: { id: true }
    });
    
    if (existingUser) {
       res.status(400).json({ error: 'Email already registered' });
       return;
    }
    
    // Validate role
    if (!['TEACHER', 'STUDENT'].includes(role)) {
       res.status(400).json({ error: 'Invalid user role. Must be TEACHER or STUDENT.' });
       return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const newUser = await prisma.schoolUser.create({
      data: {
        email,
        password: hashedPassword,
        role: role as SchoolRole,
        fullName,
        phone,
        schoolId: req.user.schoolId
      }
    });

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;
    
    res.status(201).json({
      success: true,
      message: 'User created successfully',
      data: userWithoutPassword
    });

  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'User creation failed. Please try again.' });
  }
};

// Get School Users (Admin only)
export const getSchoolUsers = async (req: AuthRequest, res: Response):Promise<void> => {
  try {
    if (req.user.role !== 'ADMIN') {
       res.status(403).json({ error: 'Admin access required' });
       return;
    }

    // Use pagination for better performance with large datasets
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const skip = (page - 1) * limit;
    
    // Optional role filter
    const roleFilter = req.query.role as string;
    const whereClause: any = { 
      schoolId: req.user.schoolId 
    };
    
    if (roleFilter && ['ADMIN', 'TEACHER', 'STUDENT'].includes(roleFilter)) {
      whereClause.role = roleFilter;
    }

    // Count total for pagination
    const totalUsers = await prisma.schoolUser.count({
      where: whereClause
    });

    // Get users with pagination
    const users = await prisma.schoolUser.findMany({
      where: whereClause,
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        phone: true,
        createdAt: true
      },
      skip,
      take: limit,
      orderBy: { createdAt: 'desc' }
    });

    res.json({
      success: true,
      data: {
        users,
        pagination: {
          total: totalUsers,
          pages: Math.ceil(totalUsers / limit),
          currentPage: page,
          limit
        }
      }
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to retrieve users' });
  }
};

// Password Reset
export const SchoolresetPassword = async (req: AuthRequest, res: Response):Promise<void> => {
  try {
    const { oldPassword, newPassword } = req.body;
    
    if (!oldPassword || !newPassword) {
       res.status(400).json({ error: 'Both current and new passwords are required' });
       return;
    }
    
    if (newPassword.length < 8) {
       res.status(400).json({ error: 'New password must be at least 8 characters' });
       return;
    }
    
    // Verify old password
    const validPassword = await bcrypt.compare(oldPassword, req.user.password);
    if (!validPassword) {
       res.status(401).json({ error: 'Current password is incorrect' });
       return;
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);

    // Update password
    await prisma.schoolUser.update({
      where: { id: req.user.id },
      data: { password: hashedPassword }
    });

    res.json({ 
      success: true,
      message: 'Password updated successfully' 
    });
  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).json({ error: 'Password reset failed. Please try again.' });
  }
};

// Forgot Password Request
export const schoolforgotPassword = async (req: Request, res: Response):Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
       res.status(400).json({ error: 'Email is required' });
       return;
    }
    
    // Check if user exists
    const user = await prisma.schoolUser.findUnique({
      where: { email },
      select: { id: true, email: true, fullName: true }
    });
    
    if (!user) {
      // Don't reveal if email exists or not for security
       res.json({ 
        success: true, 
        message: 'If your email is registered, password reset instructions will be sent' 
      });
      return;
    }
    
    // Generate a reset token (short expiry)
    const resetToken = jwt.sign(
      { userId: user.id, email: user.email },
      process.env.JWT_SECRET as string,
      { expiresIn: '1h' }
    );
    
    // Store the token in DB with expiry
    await prisma.passwordReset.create({
        data: {
          token: resetToken,
          schoolUserId: user.id, // Correct field name
          expiresAt: new Date(Date.now() + 3600000)
        }
      });
    
    // In a real app, send email with reset link
    // For now, we'll just simulate success
    
    res.json({
      success: true,
      message: 'Password reset instructions sent to your email'
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({ error: 'Failed to process request. Please try again.' });
  }
};
