import React, { useState, useEffect } from "react";
import axios from "axios";
import baseApi from "../../utils/baseApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Link, useNavigate } from "react-router-dom";
import { FaSchool, FaEnvelope, FaPhone, FaMapMarkerAlt, FaUser, FaLock, FaArrowLeft } from "react-icons/fa";

const SchoolRegistrationPage: React.FC = () => {
  const navigate = useNavigate();
  
  const nigerianStates = [
    "Abia", "Adamawa", "Akwa Ibom", "Anambra", "Bauchi", "Bayelsa", "Benue", "Borno",
    "Cross River", "Delta", "Ebonyi", "Edo", "Ekiti", "Enugu", "FCT - Abuja", "Gombe",
    "Imo", "Jigawa", "Kaduna", "Kano", "Katsina", "Kebbi", "Kogi", "Kwara", "Lagos",
    "Nasarawa", "Niger", "Ogun", "Ondo", "Osun", "Oyo", "Plateau", "Rivers", "Sokoto",
    "Taraba", "Yobe", "Zamfara"
  ];

  const schoolTypes = ["Primary School", "Secondary School", "Vocational Schools"];

  // Check if there's saved form data in localStorage
  const getSavedFormData = () => {
    const savedData = localStorage.getItem('schoolRegistrationData');
    return savedData ? JSON.parse(savedData) : {
      schoolName: "",
      schoolType: "",
      principalName: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      password: "",
      confirmPassword: "",
      agreedToTerms: false,
    };
  };

  interface SchoolRegistrationFormData {
    schoolName: string;
    schoolType: string;
    principalName: string;
    email: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    password: string;
    confirmPassword: string;
    agreedToTerms: boolean;
  }

  const [formData, setFormData] = useState(getSavedFormData());
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [step, setStep] = useState(() => {
    // Restore step from localStorage if available
    const savedStep = localStorage.getItem('registrationStep');
    return savedStep ? parseInt(savedStep) : 1;
  });
  const [passwordStrength, setPasswordStrength] = useState(0);
  
  // Save form data to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem('schoolRegistrationData', JSON.stringify(formData));
  }, [formData]);

  // Save current step to localStorage
  useEffect(() => {
    localStorage.setItem('registrationStep', step.toString());
  }, [step]);

  // Calculate password strength on component mount and when password changes
  useEffect(() => {
    if (formData.password) {
      checkPasswordStrength(formData.password);
    }
  }, [formData.password]);
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
    
    setFormData((prev: SchoolRegistrationFormData) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };
  
  const checkPasswordStrength = (password: string) => {
    let strength = 0;
    
    if (password.length >= 8) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    
    setPasswordStrength(strength);
  };
  
  const getPasswordStrengthLabel = () => {
    switch (passwordStrength) {
      case 0: return "Weak";
      case 1: return "Fair";
      case 2: return "Good";
      case 3: return "Strong";
      case 4: return "Very Strong";
      default: return "";
    }
  };
  
  const getPasswordStrengthColor = () => {
    switch (passwordStrength) {
      case 0: return "bg-red-500";
      case 1: return "bg-orange-500";
      case 2: return "bg-yellow-500";
      case 3: return "bg-blue-500";
      case 4: return "bg-green-500";
      default: return "";
    }
  };
  
  const validateStep1 = () => {
    if (!formData.schoolName.trim()) {
      setError("School name is required");
      toast.error("School name is required");
      return false;
    }
    if (!formData.schoolType) {
      setError("School type is required");
      toast.error("School type is required");
      return false;
    }
    if (!formData.principalName.trim()) {
      setError("Principal/Director name is required");
      toast.error("Principal/Director name is required");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Email is required");
      toast.error("Email is required");
      return false;
    }
    if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      setError("Please enter a valid email address");
      toast.error("Please enter a valid email address");
      return false;
    }
    if (!formData.phone.trim()) {
      setError("Phone number is required");
      toast.error("Phone number is required");
      return false;
    }
    
    setError("");
    return true;
  };
  
  const validateStep2 = () => {
    if (!formData.address.trim()) {
      setError("Address is required");
      toast.error("Address is required");
      return false;
    }
    if (!formData.city.trim()) {
      setError("City is required");
      toast.error("City is required");
      return false;
    }
    if (!formData.state) {
      setError("State is required");
      toast.error("State is required");
      return false;
    }
    if (!formData.password) {
      setError("Password is required");
      toast.error("Password is required");
      return false;
    }
    if (formData.password.length < 8) {
      setError("Password must be at least 8 characters long");
      toast.error("Password must be at least 8 characters long");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      toast.error("Passwords do not match");
      return false;
    }
    if (!formData.agreedToTerms) {
      setError("You must agree to the terms and conditions");
      toast.error("You must agree to the terms and conditions");
      return false;
    }
    
    setError("");
    return true;
  };
  
  const nextStep = () => {
    if (validateStep1()) {
      setStep(2);
      toast.info("Please complete your registration");
    }
  };
  
  const prevStep = () => {
    setStep(1);
    setError("");
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (step === 1) {
      nextStep();
      return;
    }
    
    if (!validateStep2()) return;
    
    setIsLoading(true);
    setError("");

  
    // Properly structure data for API submission
    const submissionData = {
      schoolData: {
        name: formData.schoolName,
        type: formData.schoolType,
        principalName: formData.principalName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
      },
      adminData: {
        password: formData.password
      }
    };
  
    try {
      toast.info("Processing your registration...");
      
      const response = await axios.post(
        `${baseApi}/school/school-register`,
        submissionData,
        {
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.data && response.status === 201) {
        // Registration successful
        toast.success("School registration successful!");
        
        // Save school ID or token if returned from API
        if (response.data.token) {
          localStorage.setItem('schoolAuthToken', response.data.token);
        }
        
        if (response.data.schoolId) {
          localStorage.setItem('schoolId', response.data.schoolId);
        }
        
        // Clear registration data from localStorage
        localStorage.removeItem('schoolRegistrationData');
        localStorage.removeItem('registrationStep');
        
        // Redirect after a short delay to allow toast to be seen
        setTimeout(() => {
          navigate("/schools/login");
        }, 1500);
      } else {
        throw new Error(response.data.message || "Registration failed");
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || "An error occurred during registration";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <ToastContainer 
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
      
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <Link to="/" className="inline-block">
            {/* Logo would go here */}
            <h1 className="text-2xl font-bold text-[#66934e]">Edumart CBT</h1>
          </Link>
        </div>

        <div className="bg-white py-8 px-6 shadow rounded-xl sm:px-10">
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800">School Registration</h2>
            <p className="text-gray-600 mt-2">Register your school to access the CBT platform</p>
          </div>

          {/* Progress Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className="flex items-center">
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 1 ? 'bg-[#66934e] text-white' : 'bg-gray-200'}`}>
                1
              </div>
              <div className={`h-1 w-16 ${step >= 2 ? 'bg-[#66934e]' : 'bg-gray-200'}`}></div>
              <div className={`rounded-full h-8 w-8 flex items-center justify-center ${step >= 2 ? 'bg-[#66934e] text-white' : 'bg-gray-200'}`}>
                2
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 border-l-4 border-red-500 p-4 text-red-700">
              <p>{error}</p>
            </div>
          )}

          <form className="space-y-6" onSubmit={handleSubmit}>
            {step === 1 && (
              <>
                <div>
                  <label htmlFor="schoolName" className="block text-sm font-medium text-gray-700 mb-1">
                    School Name*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaSchool className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="schoolName"
                      name="schoolName"
                      type="text"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="e.g., St. Mary's High School"
                      value={formData.schoolName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="schoolType" className="block text-sm font-medium text-gray-700 mb-1">
                    School Type*
                  </label>
                  <div className="relative">
                    <select
                      id="schoolType"
                      name="schoolType"
                      required
                      className="appearance-none block w-full pl-3 pr-10 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      value={formData.schoolType}
                      onChange={handleChange}
                    >
                      <option value="">Select School Type</option>
                      {schoolTypes.map((type) => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="principalName" className="block text-sm font-medium text-gray-700 mb-1">
                    Principal/Director Name*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="principalName"
                      name="principalName"
                      type="text"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="e.g., Dr. John Doe"
                      value={formData.principalName}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email Address*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="school@example.com"
                      value={formData.email}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                    Phone Number*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaPhone className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="phone"
                      name="phone"
                      type="tel"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="+234 800 000 0000"
                      value={formData.phone}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">
                    School Address*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaMapMarkerAlt className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="address"
                      name="address"
                      type="text"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="School address"
                      value={formData.address}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="city" className="block text-sm font-medium text-gray-700 mb-1">
                      City*
                    </label>
                    <input
                      id="city"
                      name="city"
                      type="text"
                      required
                      className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="City"
                      value={formData.city}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="state" className="block text-sm font-medium text-gray-700 mb-1">
                      State*
                    </label>
                    <select
                      id="state"
                      name="state"
                      required
                      className="appearance-none block w-full px-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      value={formData.state}
                      onChange={handleChange}
                    >
                      <option value="">Select State</option>
                      {nigerianStates.map((state) => (
                        <option key={state} value={state}>{state}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                    />
                  </div>
                  {formData.password && (
                    <div className="mt-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-gray-500">Password Strength:</span>
                        <span className={`text-xs font-medium ${
                          passwordStrength <= 1 ? 'text-red-500' : 
                          passwordStrength === 2 ? 'text-yellow-500' :
                          passwordStrength === 3 ? 'text-blue-500' : 'text-green-500'
                        }`}>
                          {getPasswordStrengthLabel()}
                        </span>
                      </div>
                      <div className="h-1 w-full bg-gray-200 rounded-full">
                        <div 
                          className={`h-1 rounded-full ${getPasswordStrengthColor()}`} 
                          style={{ width: `${(passwordStrength / 4) * 100}%` }}
                        ></div>
                      </div>
                      <ul className="text-xs text-gray-500 mt-2 space-y-1">
                        <li className={formData.password.length >= 8 ? "text-green-500" : ""}>
                          • At least 8 characters
                        </li>
                        <li className={/[A-Z]/.test(formData.password) ? "text-green-500" : ""}>
                          • At least one uppercase letter
                        </li>
                        <li className={/[0-9]/.test(formData.password) ? "text-green-500" : ""}>
                          • At least one number
                        </li>
                        <li className={/[^A-Za-z0-9]/.test(formData.password) ? "text-green-500" : ""}>
                          • At least one special character
                        </li>
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                    Confirm Password*
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaLock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      className="appearance-none block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#66934e] focus:border-[#66934e]"
                      placeholder="••••••••"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                    />
                  </div>
                  {formData.password && formData.confirmPassword && formData.password !== formData.confirmPassword && (
                    <p className="mt-1 text-xs text-red-500">Passwords do not match</p>
                  )}
                </div>

                <div className="flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      id="agreedToTerms"
                      name="agreedToTerms"
                      type="checkbox"
                      className="h-4 w-4 text-[#66934e] focus:ring-[#66934e] border-gray-300 rounded"
                      checked={formData.agreedToTerms}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="agreedToTerms" className="text-gray-600">
                      I agree to the <Link to="/terms" className="text-[#66934e] hover:underline">Terms and Conditions</Link> and <Link to="/privacy" className="text-[#66934e] hover:underline">Privacy Policy</Link>
                    </label>
                  </div>
                </div>
              </>
            )}

            <div className="flex justify-between items-center mt-8">
              {step === 2 ? (
                <button
                  type="button"
                  onClick={prevStep}
                  className="py-2 px-4 border border-gray-300 rounded-lg shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e]"
                >
                  Back
                </button>
              ) : (
                <div></div>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className={`py-3 px-6 border border-transparent rounded-lg shadow-sm text-white bg-[#66934e] hover:bg-[#557a40] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e] ${
                  isLoading ? "opacity-70 cursor-not-allowed" : ""
                }`}
              >
                {isLoading 
                  ? "Processing..." 
                  : step === 1 ? "Next" : "Register School"
                }
              </button>
            </div>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link to="/schools/login" className="font-medium text-[#66934e] hover:text-[#557a40]">
                Sign in
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-8 text-center">
          <Link to="/schools" className="inline-flex items-center text-sm text-gray-600 hover:text-[#66934e]">
            <FaArrowLeft className="mr-2" />
            Back to home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SchoolRegistrationPage;