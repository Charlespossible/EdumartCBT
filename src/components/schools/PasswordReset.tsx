import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';

const PasswordResetForm = () => {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [email, setEmail] = useState('');
  const [passwordStrength, setPasswordStrength] = useState<'weak' | 'medium' | 'strong' | ''>('');
  const passwordInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Get email from localStorage
  useEffect(() => {
    const storedEmail = localStorage.getItem('email');
    if (!storedEmail) {
      // Redirect to forgot password if email is not found
      navigate('/schools/forgotpassword');
      return;
    }
    setEmail(storedEmail);
    
    // Focus password input on component mount
    if (passwordInputRef.current) {
      passwordInputRef.current.focus();
    }
  }, [navigate]);

  // Check password strength
  const checkPasswordStrength = (password: string) => {
    if (!password) return '';
    
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const isLongEnough = password.length >= 8;
    
    if (isLongEnough && hasLetter && hasNumber && hasSpecial) {
      return 'strong';
    } else if (isLongEnough && ((hasLetter && hasNumber) || (hasLetter && hasSpecial) || (hasNumber && hasSpecial))) {
      return 'medium';
    } else {
      return 'weak';
    }
  };

  // Handle password input change
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
  };

  // Handle confirm password input change
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmPassword(e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    // Validate passwords
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      toast.error('Passwords do not match');
      return;
    }
    
    if (passwordStrength === 'weak') {
      toast.error('Please use a stronger password');
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // API call would go here
      // const response = await axios.post(`${baseApi}/auth/reset-password`, { email, password });
      console.log('Resetting password for email:', email);
      
      // Simulate API call
      setTimeout(() => {
        // Clear stored email
        localStorage.removeItem('email');
        
        toast.success('Password reset successfully!');
        
        // Redirect to login page after success
        setTimeout(() => navigate('/schools/login'), 2000);
        
        setIsSubmitting(false);
      }, 1500);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to reset password');
      setIsSubmitting(false);
    }
  };

  // Get strength indicator color
  const getStrengthColor = () => {
    switch (passwordStrength) {
      case 'weak': return 'bg-red-500';
      case 'medium': return 'bg-yellow-500';
      case 'strong': return 'bg-green-500';
      default: return 'bg-gray-300';
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="w-full max-w-md p-6 sm:p-8 bg-white rounded-lg shadow-lg">
        <h1 className="text-2xl font-bold text-center text-[#66934e] mb-2">
          Reset Your Password
        </h1>
        <p className="text-center text-gray-600 mb-6">
          Create a new password<span className="font-medium">{email}</span>
        </p>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="flex flex-col">
            <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              ref={passwordInputRef}
              value={password}
              onChange={handlePasswordChange}
              className="px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:border-transparent"
              required
            />
            
            {password && (
              <div className="mt-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Password strength:</span>
                  <span className="text-xs font-medium capitalize">
                    {passwordStrength || 'None'}
                  </span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${getStrengthColor()} transition-all duration-300`}
                    style={{ 
                      width: passwordStrength === 'weak' ? '33%' : 
                             passwordStrength === 'medium' ? '66%' : 
                             passwordStrength === 'strong' ? '100%' : '0%' 
                    }}
                  ></div>
                </div>
                <ul className="mt-2 text-xs text-gray-500 space-y-1">
                  <li className={`${password.length >= 8 ? 'text-green-500' : ''}`}>
                    • At least 8 characters
                  </li>
                  <li className={`${/[a-zA-Z]/.test(password) ? 'text-green-500' : ''}`}>
                    • Letters (a-z, A-Z)
                  </li>
                  <li className={`${/\d/.test(password) ? 'text-green-500' : ''}`}>
                    • Numbers (0-9)
                  </li>
                  <li className={`${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : ''}`}>
                    • Special characters (!@#$%...)
                  </li>
                </ul>
              </div>
            )}
          </div>
          
          <div className="flex flex-col">
            <label htmlFor="confirm-password" className="text-sm font-medium text-gray-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={handleConfirmPasswordChange}
              className={`px-4 py-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:border-transparent ${
                confirmPassword && password !== confirmPassword ? 'border-red-500' : ''
              }`}
              required
            />
            {confirmPassword && password !== confirmPassword && (
              <p className="mt-1 text-xs text-red-500">
                Passwords do not match
              </p>
            )}
          </div>
          
          <div className="flex flex-col space-y-4">
            <button
              type="submit"
              className="w-full px-4 py-3 font-medium text-white bg-[#66934e] rounded-lg hover:bg-[#557a41] transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e] disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={isSubmitting || !password || !confirmPassword || password !== confirmPassword}
            >
              {isSubmitting ? "Resetting..." : "Reset Password"}
            </button>
            
            <div className="text-center">
              <button
                type="button"
                onClick={() => navigate('/schools/login')}
                className="text-[#66934e] hover:text-[#557a41] font-medium focus:outline-none transition-colors"
              >
                Back to Login
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PasswordResetForm;