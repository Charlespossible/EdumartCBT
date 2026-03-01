import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();


export const authenticate = async (req: Request, res: Response, next: NextFunction):Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];
  if (!token) {
     res.status(401).json({ message: "Unauthorized: No token provided" });
      return;
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    if (typeof decoded === "object" && decoded !== null && "id" in decoded) {
      req.user = decoded as { id: string; schoolId:string; role: string };
    } else {
       res.status(401).json({ message: "Unauthorized: Invalid token" });
       return;
    }
    const user = await prisma.user.findUnique({ where: { id: decoded.id } });
    if (!user || user.currentSessionToken !== decoded.sessionToken) {
      res.status(401).json({ message: "Session expired" });
      return ;
    }

    req.user = user;
    next(); 
  } catch (error) {
    res.status(401).json({ message: "Unauthorized: Invalid token" });
    return;
  }
};


export const adminAuth = (req: Request, res: Response, next: NextFunction):void=> {
  const authHeader = req.headers.authorization?.split(" ")[1];
  if (!authHeader) {
    res.status(401).json({ message: "Unauthorized" });
    return;
  }

  try {
    if (!process.env.JWT_SECRET) {
       res.status(500).json({ message: "Internal server error: JWT secret not set" });
       return;
    }
    const decoded = jwt.verify(authHeader, process.env.JWT_SECRET) as unknown as { id: number; role: string };
    if (decoded.role !== "ADMIN") {
      res.status(403).json({ message: "Forbidden: Admin access required" });
      return;
    }
    req.user = { 
      id: decoded.id.toString() ,
      role: decoded.role 
    
    };
    next();
  } catch (error) {
    res.status(401).json({ message: "Invalid token" });
  }
};