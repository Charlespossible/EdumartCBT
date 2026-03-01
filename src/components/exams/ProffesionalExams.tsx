import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

interface Exam {
  name: string;
  summary: string;
  practicePath: string;
}

const ProfessionalExams = () => {
  const navigate = useNavigate();
  const auth = useContext(AuthContext);

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(auth?.user || null);

  // Sync user state
  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
      setLoading(false);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
  }, [auth?.user]);

  // Handler for "Take Free Test" button
  const handleTakeTest = (examType: string, practicePath: string) => {
    navigate(practicePath, { state: { examType } });
  };

  // Handler for "Buy Access" button - redirects to dashboard
  const handleBuyAccess = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  // Exam data for professional exams
  const exams: Exam[] = [
    {
      name: "GMAT",
      summary:
        "Excel in your GMAT examination with Edumart's comprehensive preparation platform. Our expertly curated materials, practice tests, and proven strategies will help you achieve your target score and gain admission to top business schools worldwide.",
      practicePath: "/gmat/practice",
    },
    {
      name: "TOEFL",
      summary:
        "Master the TOEFL exam with our extensive preparation resources. We provide comprehensive practice materials, mock tests, and expert guidance to help you demonstrate your English language proficiency and achieve your academic or professional goals.",
      practicePath: "/toefl/practice",
    },
    {
      name: "ICAN",
      summary:
        "Achieve excellent results with our novel and comprehensive exam preparation system and materials for your ICAN exams. Access past questions, mock tests, and expert guidance tailored to help you succeed in your professional accounting certification.",
      practicePath: "/ican/practice",
    },
    {
      name: "NURSING SCHOOL",
      summary:
        "Prepare for your nursing school entrance exams with confidence using Edumart's specialized preparation materials. Our comprehensive resources include practice questions, mock exams, and study guides designed to help you secure admission into your desired nursing program.",
      practicePath: "/nursing-school/practice",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-center mb-6">
        Professional Exams Preparation
      </h1>
      
      <div className="w-24 h-1 bg-[#66934e] mx-auto mb-12 rounded-full"></div>

      {/* User greeting */}
      <h2 className="text-xl font-semibold text-center mb-8">
        {loading
          ? <div className="w-64 h-6 bg-gray-200 animate-pulse rounded-md mx-auto"></div>
          : `Hi ${user?.firstName || "there"}, Take Free Test Below`}
      </h2>

      {/* Exams Container */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {exams.map((exam) => (
          <div
            key={exam.name}
            className="bg-white p-8 rounded-lg shadow-lg transition-all hover:shadow-xl"
          >
            {/* Exam Heading */}
            <h2 className="text-2xl font-semibold text-center mb-4">{exam.name}</h2>

            {/* Summary */}
            <p className="text-gray-700 text-center mb-6 leading-relaxed">{exam.summary}</p>
            <div className="w-24 h-0.5 bg-[#66934e] mx-auto mb-8 rounded-full"></div>

            {/* Pricing and Buttons Section */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Free Practice Card */}
              <div className="bg-gray-50 p-5 rounded-xl transition-all hover:shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-center">Free Practice</h3>
                <p className="text-gray-600 mb-4 text-sm text-center">
                  Try free {exam.name} practice tests.
                </p>
                <button
                  onClick={() => handleTakeTest(exam.name, exam.practicePath)}
                  className="bg-green-500 text-white px-3 py-2 rounded-lg hover:bg-green-600 transition-colors w-full font-medium transform hover:scale-[1.02] active:scale-[0.98] duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
                >
                  Take Free Test
                </button>
              </div>

              {/* Pricing Plan Card */}
              <div className="bg-gray-50 p-5 rounded-xl transition-all hover:shadow-md">
                <h3 className="text-lg font-semibold mb-2 text-center">Premium Access</h3>
                <p className="text-gray-600 mb-4 text-sm text-center">
                  Full {exam.name} access for ₦2000/year.
                </p>
                <button
                  onClick={handleBuyAccess}
                  className="bg-[#66934e] text-white px-3 py-2 rounded-lg hover:bg-[#557941] transition-colors w-full font-medium transform hover:scale-[1.02] active:scale-[0.98] duration-200 focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
                >
                  Buy Access
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProfessionalExams;