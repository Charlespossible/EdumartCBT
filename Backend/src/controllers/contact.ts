import { Request, Response } from "express";
import nodemailer from "nodemailer";

// Configure Nodemailer transporter
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

export const submitContactForm = async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, message } = req.body;

    // Validate input
    if (!name || !email || !message) {
      res.status(400).json({ message: "All fields are required" });
      return;
    }

    // Send email to admin
    const mailOptions = {
      from: process.env.EMAIL_USER, // Sender email address
      to: process.env.ADMIN_EMAIL, // Admin email address
      subject: "New Contact Form Submission", // Email subject
      text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`, // Plain text body
      html: `
        <h3>New Contact Form Submission</h3>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Message:</strong> ${message}</p>
      `, // HTML body
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({ message: "Message sent successfully!" });
  } catch (error) {
    console.error("Error submitting contact form:", error);
    res.status(500).json({ message: "Server error", error });
  }
};