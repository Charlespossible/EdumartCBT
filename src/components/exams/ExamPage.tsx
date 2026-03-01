import { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";

interface ExamPageProps {
  title: string;
  examType: string;
  summary: string;
  practicePath?: string;
  price?: string;
}

const ExamPage: React.FC<ExamPageProps> = ({
  title,
  examType,
  summary,
  practicePath = "",
  price = "N2000/year"
}) => {
  const navigate = useNavigate();
  const authContext = useContext(AuthContext);
  const user = authContext?.user;
  
  // Format practice path or use lowercase exam type
  const formattedPath = practicePath || `/${examType.toLowerCase()}/practice`;

  // Handler for "Take Free Test" button - NO LOGIN REQUIRED
  const handleTakeTest = () => {
    navigate(formattedPath, { state: { examType } });
  };

  // Handler for "Buy Access" button - redirects to dashboard
  const handleBuyAccess = () => {
    if (user) {
      navigate("/dashboard");
    } else {
      navigate("/login");
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Heading */}
      <h1 className="text-3xl font-bold text-center mb-6">{title}</h1>
      <div className="w-24 h-1 bg-[#66934e] mx-auto mb-12 rounded-full"></div>

      {/* Exam Section */}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-2xl mx-auto transition-all hover:shadow-xl">
        {/* Exam Heading */}
        <h2 className="text-2xl font-semibold text-center mb-4">{examType}</h2>

        {/* Summary */}
        <p className="text-gray-700 text-center mb-8 leading-relaxed">
          {summary}
        </p>
        <div className="w-32 h-0.5 bg-[#66934e] mx-auto mb-10 rounded-full"></div>

        {/* Pricing and Buttons Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Free Practice Card */}
          <div className="bg-gray-50 p-6 rounded-xl transition-all hover:shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-center">Free Practice</h3>
            <p className="text-gray-600 mb-5 text-center">
              Try free {examType} practice tests.
            </p>
            <button
              onClick={handleTakeTest}
              className="bg-green-500 text-white px-4 py-3 rounded-lg hover:bg-green-600 transition-colors w-full font-medium transform hover:scale-[1.02] active:scale-[0.98] duration-200 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-opacity-50"
            >
              Take Free Test
            </button>
          </div>

          {/* Pricing Plan Card */}
          <div className="bg-gray-50 p-6 rounded-xl transition-all hover:shadow-md">
            <h3 className="text-xl font-semibold mb-3 text-center">Premium Access</h3>
            <p className="text-gray-600 mb-5 text-center">
              Full {examType} access for {price}.
            </p>
            <button
              onClick={handleBuyAccess}
              className="bg-[#66934e] text-white px-4 py-3 rounded-lg hover:bg-[#66934e] transition-colors w-full font-medium transform hover:scale-[1.02] active:scale-[0.98] duration-200 focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
            >
              Buy Access
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamPage;