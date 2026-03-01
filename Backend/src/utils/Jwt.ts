import jwt from "jsonwebtoken";

// Generate Access Token (short-lived)
export const generateAccessToken = (user: any) => {
  const ACCESS_TOKEN_SECRET = process.env.JWT_SECRET; 
  
  if (!ACCESS_TOKEN_SECRET) throw new Error("JWT_SECRET is missing");
  
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "3d" });
};

export const generateRefreshToken = (user: any) => {
  const REFRESH_TOKEN_SECRET = process.env.JWT_REFRESH_SECRET; 
  
  if (!REFRESH_TOKEN_SECRET) throw new Error("JWT_REFRESH_SECRET is missing");
  
  return jwt.sign(user, REFRESH_TOKEN_SECRET, { expiresIn: "7d" });
};
