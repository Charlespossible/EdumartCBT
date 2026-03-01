import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import baseApi from "../utils/baseApi";

const OtpVerify: React.FC = () => {
  const [otpValues, setOtpValues] = useState<string[]>(Array(6).fill(""));
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(120); // 2 minutes countdown
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    const storedEmail = localStorage.getItem("email");
    if (!storedEmail) {
      navigate("/register");
      return;
    }
    setEmail(storedEmail);
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [navigate]);

  // Countdown timer for OTP expiration
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  const handleInputChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtpValues = [...otpValues];
    newOtpValues[index] = value;
    setOtpValues(newOtpValues);
    
    // Auto-focus to next input field if current field is filled
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === "Backspace" && !otpValues[index] && index > 0 && inputRefs.current[index - 1]) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text");
    if (!/^\d+$/.test(pastedData)) return;
    
    const digits = pastedData.slice(0, 6).split("");
    const newOtpValues = [...otpValues];
    
    digits.forEach((digit, index) => {
      if (index < 6) newOtpValues[index] = digit;
    });
    
    setOtpValues(newOtpValues);
    
    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newOtpValues.findIndex(val => val === "");
    if (nextEmptyIndex !== -1 && inputRefs.current[nextEmptyIndex]) {
      inputRefs.current[nextEmptyIndex].focus();
    } else if (inputRefs.current[5]) {
      inputRefs.current[5].focus();
    }
  };

  const handleResendOtp = async () => {
    try {
      setIsSubmitting(true);
      await axios.post(`${baseApi}/auth/resendOTP`, { email });
      toast.success("New OTP sent successfully!");
      setTimeLeft(120); // Reset the timer
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const otp = otpValues.join("");
    if (otp.length !== 6) {
      toast.error("Please enter a complete 6-digit OTP");
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await axios.post(`${baseApi}/auth/verifyOTP`, { email, otp });
      toast.success(response.data.message || "OTP verified successfully!");
      setTimeout(() => navigate("/login"), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "OTP verification failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format time as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#66934e] mb-2">
          Verify Your Email
        </h1>
        <p className="text-center text-gray-600 mb-6">
          We've sent a 6-digit code to {email}
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col items-center">
            <label htmlFor="otp-input" className="sr-only">Enter OTP</label>
            <div className="flex justify-between w-full max-w-xs gap-2">
              {otpValues.map((value, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={value}
                  onChange={e => handleInputChange(index, e.target.value)}
                  onKeyDown={e => handleKeyDown(index, e)}
                  onPaste={index === 0 ? handlePaste : undefined}
                  className="w-10 h-12 text-center text-xl font-semibold border rounded-md focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                  required
                />
              ))}
            </div>
            
            <div className="mt-4 text-center">
              {timeLeft > 0 ? (
                <p className="text-sm text-gray-600">
                  Code expires in <span className="font-medium">{formatTime(timeLeft)}</span>
                </p>
              ) : (
                <p className="text-sm text-red-500">OTP has expired</p>
              )}
            </div>
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className="w-full px-4 py-3 font-medium text-white bg-[#66934e] rounded-lg hover:bg-[#557a41] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || otpValues.some(v => v === "") || timeLeft <= 0}
            >
              {isSubmitting ? "Verifying..." : "Verify"}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isSubmitting || timeLeft > 0}
                className="text-[#66934e] hover:text-[#557a41] font-medium focus:outline-none disabled:text-gray-400 disabled:cursor-not-allowed transition-colors"
              >
                {timeLeft > 0 ? `Resend code in ${formatTime(timeLeft)}` : "Resend code"}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default OtpVerify;