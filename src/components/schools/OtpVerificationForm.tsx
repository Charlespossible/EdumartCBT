import { useState, useEffect, useRef } from 'react';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';

const OTPVerificationForm = () => {
  const [otp, setOtp] = useState<string[]>(Array(6).fill(''));
  const [timeLeft, setTimeLeft] = useState(120); // Increased to 2 minutes like OtpVerify
  const [isVerifying, setIsVerifying] = useState(false);
  const [email, setEmail] = useState('');
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const navigate = useNavigate();

  // Initialize with email from storage
  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (!storedEmail) {
      navigate('/schools/register');
      return;
    }
    setEmail(storedEmail);
    
    // Focus the first input field when component mounts
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, [navigate]);

  // Handle timer countdown
  useEffect(() => {
    if (timeLeft <= 0) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);
    
    return () => clearInterval(timer);
  }, [timeLeft]);

  // Format time to display as MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle input change
  const handleChange = (index: number, value: string) => {
    // Only allow numbers
    if (!/^\d*$/.test(value)) return;
    
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto-focus next input
    if (value && index < 5 && inputRefs.current[index + 1]) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // Handle key press
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    // Move to previous input on backspace if current input is empty
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      if (inputRefs.current[index - 1]) {
        inputRefs.current[index - 1]?.focus();
      }
    }
  };

  // Handle OTP paste
  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    
    if (!/^\d+$/.test(pastedData)) return;
    
    const digits = pastedData.slice(0, 6).split('');
    const newOtp = [...otp];
    
    digits.forEach((digit, index) => {
      if (index < 6) newOtp[index] = digit;
    });
    
    setOtp(newOtp);
    
    // Focus the next empty input or the last input if all are filled
    const nextEmptyIndex = newOtp.findIndex(val => val === '');
    if (nextEmptyIndex !== -1 && inputRefs.current[nextEmptyIndex]) {
      inputRefs.current[nextEmptyIndex]?.focus();
    } else if (inputRefs.current[5]) {
      inputRefs.current[5]?.focus();
    }
  };

  // Handle resend OTP
  const handleResendOTP = async () => {
    try {
      setIsVerifying(true);
      // API call would go here
      // await axios.post(`${baseApi}/auth/resendOTP`, { email });
      console.log('Resending OTP for email:', email);
      
      // Reset OTP fields
      setOtp(Array(6).fill(''));
      // Reset timer
      setTimeLeft(120);
      
      // Focus the first input
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
      
      toast.success('New OTP sent successfully!');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to resend OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  // Handle form submission
  const handleVerify = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    const otpString = otp.join('');
    if (otpString.length !== 6) {
      toast.error('Please enter a complete 6-digit OTP');
      return;
    }
    
    setIsVerifying(true);
    
    try {
      // API call would go here
      // const response = await axios.post(`${baseApi}/auth/verifyOTP`, { email, otp: otpString });
      console.log('Verifying OTP:', otpString, 'for email:', email);
      
      // Simulate verification (replace with actual API response handling)
      setTimeout(() => {
        if (otpString === '123456') {
          toast.success('OTP verified successfully!');
          setTimeout(() => navigate('/login'), 2000);
        } else {
          toast.error('Invalid OTP. Please try again.');
        }
        setIsVerifying(false);
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'OTP verification failed');
      setIsVerifying(false);
    }
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
        
        <form onSubmit={handleVerify} className="space-y-6">
          <div className="flex flex-col items-center">
            <label htmlFor="otp-input" className="sr-only">Enter OTP</label>
            <div className="flex justify-between w-full max-w-xs gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  ref={el => inputRefs.current[index] = el}
                  type="text"
                  maxLength={1}
                  value={digit}
                  onChange={(e) => handleChange(index, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(index, e)}
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
              disabled={isVerifying || otp.some(v => v === '') || timeLeft <= 0}
            >
              {isVerifying ? "Verifying..." : "Verify"}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleResendOTP}
                disabled={isVerifying || timeLeft > 0}
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

export default OTPVerificationForm;