import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PasswordForgetForm = () => {
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<'email' | 'success'>('email');
  const emailInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Focus email input on component mount
  useState(() => {
    if (emailInputRef.current) {
      emailInputRef.current.focus();
    }
  });

  // Handle email input change
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value);
  };

  // Validate email format
  const isEmailValid = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!isEmailValid(email)) {
      toast.error('Please enter a valid email address');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // API call would go here
      // const response = await axios.post(`${baseApi}/auth/forgot-password`, { email });
      console.log('Requesting password reset for email:', email);
      
      // Simulate API call
      setTimeout(() => {
        // Store email for OTP verification
        localStorage.setItem('email', email);
        
        // Show success message and update UI
        toast.success('Reset link sent successfully!');
        setStep('success');
        setIsSubmitting(false);
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to request password reset');
      setIsSubmitting(false);
    }
  };

  // Navigate to login page
  const handleBackToLogin = () => {
    navigate('/schools/login');
  };

  // Navigate to OTP verification page
  const handleContinueToVerification = () => {
    navigate('schools/otpverify');
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg">
        {step === 'email' ? (
          <>
            <h1 className="text-2xl font-bold text-center text-[#66934e] mb-2">
              Forgot Your Password?
            </h1>
            <p className="text-center text-gray-600 mb-6">
              Enter your email address and we'll send you a verification code to reset your password.
            </p>
            
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex flex-col">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  ref={emailInputRef}
                  value={email}
                  onChange={handleEmailChange}
                  placeholder="you@example.com"
                  className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
                  required
                />
              </div>
              
              <div className="flex flex-col space-y-4">
                <button
                  type="submit"
                  className="w-full px-4 py-3 font-medium text-white bg-[#66934e] rounded-lg hover:bg-[#557a41] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e] disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending..." : "Send Reset Link"}
                </button>
                
                <div className="text-center">
                  <button
                    type="button"
                    onClick={handleBackToLogin}
                    className="text-[#66934e] hover:text-[#557a41] font-medium focus:outline-none transition-colors"
                  >
                    Back to Login
                  </button>
                </div>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-6">
            <div className="w-16 h-16 flex items-center justify-center rounded-full bg-green-100 text-[#66934e]">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h1 className="text-2xl font-bold text-center text-[#66934e]">
              Check Your Email
            </h1>
            
            <p className="text-center text-gray-600">
              We've sent a verification code to <span className="font-medium">{email}</span>
            </p>
            
            <div className="flex flex-col space-y-4 w-full">
              <button
                onClick={handleContinueToVerification}
                className="w-full px-4 py-3 font-medium text-white bg-[#66934e] rounded-lg hover:bg-[#557a41] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e]"
              >
                Continue to Verification
              </button>
              
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setStep('email')}
                  className="text-[#66934e] hover:text-[#557a41] font-medium focus:outline-none transition-colors"
                >
                  Use a Different Email
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PasswordForgetForm;