import React, { useContext, useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { NavLink, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

interface ExamType {
  id: string;
  title: string;
  price: number;
  features: string[];
  buttonText: string;
}

const examTypes: ExamType[] = [
  {
    id: "olevel",
    title: "O'Level Exams",
    price: 1000,
    features: [
      "Practice with past WAEC questions",
      "Mock exams with time limits",
      "Performance analytics",
      "Study guides for key subjects"
    ],
    buttonText: "Subscribe Now",
  },
  {
    id: "jamb",
    title: "JAMB UTME",
    price: 1000,
    features: [
      "Updated JAMB curriculum",
      "Subject-specific practice tests",
      "Performance tracking",
      "Time management practice"
    ],
    buttonText: "Subscribe Now",
  },
  {
    id: "postutme",
    title: "Post UTME",
    price: 1000,
    features: [
      "University-specific practice tests",
      "Adaptable difficulty levels",
      "Comprehensive explanations",
      "Progress tracking"
    ],
    buttonText: "Subscribe Now",
  },
  {
    id: "common",
    title: "Common Entrance",
    price: 1000,
    features: [
      "Age-appropriate questions",
      "Foundational subject coverage",
      "Interactive learning tools",
      "Parent progress reports"
    ],
    buttonText: "Subscribe Now",
  },
  {
    id: "professional",
    title: "Professional Exams",
    price: 1000,
    features: [
      "Industry standard questions",
      "Certification preparation",
      "Specialization topics",
      "Career advancement tools"
    ],
    buttonText: "Subscribe Now",
  },
];

const PricingTable: React.FC = () => {
  const authContext = useContext(AuthContext);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Optimized user state management
    if (authContext?.user) {
      setUser(authContext.user);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        try {
          setUser(JSON.parse(storedUser));
        } catch (error) {
          console.error("Failed to parse user from localStorage:", error);
        }
      }
    }
  }, [authContext?.user]);

  const handleSubscribe = (examId: string) => {
    if (!user) {
      toast.info("Please log in to subscribe to this exam.");
      navigate("/login", { state: { returnTo: "/pricing", examId } });
      return;
    }
    
    // Here you would implement your payment logic
    // For now, we'll just navigate to dashboard
    toast.success(`Successfully subscribed to ${examId} exam!`);
    navigate("/dashboard");
  };

  return (
    <div className="bg-gray-50 py-12 px-4">
      <div className="container mx-auto">
        <h2 className="text-4xl font-bold text-center text-gray-800 mb-4">
          Choose Your Exam Preparation
        </h2>
        <p className="text-center text-gray-600 mb-12 max-w-2xl mx-auto">
          Each exam preparation package is tailored to help you succeed with comprehensive practice tests, study materials, and performance analytics.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {examTypes.map((exam) => (
            <div
              key={exam.id}
              className="bg-white rounded-xl shadow-lg overflow-hidden transition-all duration-300 hover:shadow-xl transform hover:-translate-y-1"
            >
              <div className="p-6 border-b border-gray-100">
                <h3 className="text-xl font-bold text-gray-800 mb-2">{exam.title}</h3>
                <div className="flex items-baseline">
                  <span className="text-3xl font-bold text-[#66934e]">₦{exam.price.toLocaleString()}</span>
                  <span className="ml-1 text-gray-500 text-sm">/year</span>
                </div>
              </div>
              
              <div className="p-6">
                <ul className="mb-6 space-y-3">
                  {exam.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start">
                      <svg className="h-5 w-5 text-[#66934e] mr-2 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
                
                <button
                  onClick={() => handleSubscribe(exam.id)}
                  className="w-full py-3 px-4 bg-[#66934e] hover:bg-[#557a40] text-white font-medium rounded-lg transition-colors duration-300 flex items-center justify-center"
                >
                  {exam.buttonText}
                  <svg className="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3" />
                  </svg>
                </button>
              </div>
              
              {!user && (
                <div className="bg-gray-50 px-6 py-4">
                  <p className="text-sm text-gray-600 text-center">
                    Already have an account?{" "}
                    <NavLink to="/login" className="text-[#66934e] font-medium hover:underline">
                      Log in
                    </NavLink>
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} closeOnClick pauseOnHover />
    </div>
  );
};

export default PricingTable;