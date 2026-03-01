import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import authRoutes from "./routes/auth";
import path from "path";
import multer from "multer";

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
    cors({
      origin: "http://localhost:5173", 
      credentials: true,
    })
  );
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));
app.use(cookieParser());

// Error handling middleware for multer errors
const multerErrorHandler: express.ErrorRequestHandler = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === "LIMIT_FILE_SIZE") {
      res.status(400).json({ error: "File size too large. Maximum size is 5MB." });
      return;
    }
    res.status(400).json({ error: err.message });
    return;
  } else if (err) {
    res.status(400).json({ error: err.message });
    return;
  }
  next();
};
app.use(multerErrorHandler);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/auth", authRoutes);
app.use("/api/admin", authRoutes); 
app.use("/api/exam", authRoutes);
app.use("/api/referrals", authRoutes);
app.use("/api/subscription", authRoutes);
app.use("/api/payment" , authRoutes);
app.use("/api/forgotPwd", authRoutes);
app.use("/api/school" , authRoutes); 
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));







