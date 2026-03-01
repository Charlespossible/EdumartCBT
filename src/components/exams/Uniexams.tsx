import { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
//import { toast } from "react-toastify";

interface Exam {
  name: string;
  summary: string;
  practicePath: string;
}

const UniEntranceExams = () => {
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

  // Exam data for reusability
  const exams: Exam[] = [
    {
      name: "JAMB",
      summary:
        "At Edumart Preexam Hall, we leverage our proven track record and deep educational expertise to help students conquer the JAMB exam. Our innovative approach combines cutting-edge technology with comprehensive training programs, ensuring you're fully prepared to achieve your best score and secure your university admission.",
      practicePath: "/jamb/practice",
    },
    {
      name: "POST_UTME",
      summary:
        "At Edumart Preexam Hall, we provide comprehensive preparation for Post UTME exams to help you secure admission into your desired university. Our resources include past questions, mock tests, and personalized study plans.",
      practicePath: "/post-utme/practice",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-center mb-6">
        Edumart Preexam Hall University Entrance Exam Preparation
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

export default UniEntranceExams;