import React, { useState } from "react";
import axios from "axios";
import { NavLink } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [emailSent, setEmailSent] = useState(false);
  //const navigate = useNavigate();

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address");
      return;
    }
    
    setIsSubmitting(true);

    try {
      const response = await axios.post(`${baseApi}/auth/forgot-password`, { email });
      toast.success(response.data.message);
      setEmailSent(true);
      // Don't automatically navigate away - let user read the success message
    } catch (error: any) {
      if (error.response?.status === 404) {
        toast.error("No account found with this email address");
      } else {
        toast.error(error.response?.data?.message || "Failed to send reset link");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (emailSent) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold text-center text-[#66934e] mb-6">Check Your Email</h1>
          <div className="text-center mb-6">
            <p className="text-[#78846f] mb-4">
              We've sent a password reset link to <strong>{email}</strong>
            </p>
            <p className="text-[#78846f] mb-4">
              Please check your inbox and follow the instructions to reset your password.
            </p>
            <p className="text-[#78846f] text-sm">
              If you don't see the email, check your spam folder or try again.
            </p>
          </div>
          <div className="flex flex-col space-y-3">
            <button
              onClick={() => setEmailSent(false)}
              className="w-full px-4 py-2 text-[#66934e] bg-white border border-[#66934e] rounded-lg hover:bg-gray-50"
            >
              Try Another Email
            </button>
            <NavLink
              to="/login"
              className="w-full px-4 py-2 text-center text-white bg-[#66934e] rounded-lg hover:bg-green-700"
            >
              Back to Login
            </NavLink>
          </div>
        </div>
        <ToastContainer position="top-right" autoClose={2000} />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="w-full max-w-md p-6 bg-white rounded-lg shadow-md">
        <h1 className="text-2xl font-bold text-center text-[#66934e] mb-6">Forgot Password</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-[#78846f] mb-2">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-1 focus:ring-[#66934e]"
              required
            />
          </div>
          <button
            type="submit"
            className="w-full px-4 py-2 text-white bg-[#66934e] rounded-lg hover:bg-green-700 disabled:opacity-50"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
        <p className="text-center text-[#78846f] mt-4">
          Remember your password? <NavLink to="/login" className="text-[#66934e] hover:underline">Login</NavLink>
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={2000} />
    </div>
  );
};

export default ForgotPassword;