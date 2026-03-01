import React, { useState, useContext, useEffect } from "react";
import { FaChartLine, FaTrophy, FaClipboardList, FaBars } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import StatsCard from "../components/StatsCard";
import Profile from "../components/Profile";
import Performance from "../components/Perfomance";
import ExamHistory from "../components/ExamHistory";
import Setting from "../components/Setting";
import { AuthContext } from "../context/AuthContext";
import { ToastContainer, toast } from "react-toastify";
import PaymentModal from "../components/PaymentModal";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import baseApi from "../utils/baseApi";

interface UserStats {
  totalExams: number;
  highestScore: number;
  examsPassed: number;
}

interface Modal {
  profile: boolean;
  performance: boolean;
  examHistory: boolean;
  settings: boolean;
  payment: boolean;
}

const Dashboard: React.FC = () => {
  const auth = useContext(AuthContext);
  const navigate = useNavigate();
  
  // Consolidated state management
  const [user, setUser] = useState(auth?.user || null);
  const [loading, setLoading] = useState({
    user: true,
    stats: true,
    examTypes: true,
    subscriptions: true,
    referrals: true
  });
  const [modals, setModals] = useState<Modal>({
    profile: false,
    performance: false,
    examHistory: false,
    settings: false,
    payment: false
  });
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [referralData, setReferralData] = useState({
  referredCount: 0,
  totalEarnings: 0,
  earningsPerReferral: 0,
  subscriptionFee: 2000 
});
  const [stats, setStats] = useState<UserStats>({
    totalExams: 0,
    highestScore: 0,
    examsPassed: 0,
  });
  const [examData, setExamData] = useState({
    availableTypes: [] as string[],
    subscribedTypes: [] as string[],
    selectedType: null as string | null
  });

  // Helper function to get auth token
  const getToken = () => localStorage.getItem("accessToken");

  // Helper function for API requests with error handling
  const apiRequest = async (endpoint: string, options = {}) => {
    try {
      const token = getToken();
      if (!token) throw new Error("No access token found");
      
      const response = await axios.get(`${baseApi}${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` },
        ...options
      });
      return { success: true, data: response.data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return { success: false, error };
    }
  };

  // Modal toggle helpers
  const toggleModal = (modalName: keyof Modal, value?: boolean) => {
    setModals(prev => ({
      ...prev,
      [modalName]: value !== undefined ? value : !prev[modalName]
    }));
  };

  // Fetch user data
  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
      setLoading(prev => ({ ...prev, user: false }));
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(prev => ({ ...prev, user: false }));
    }
  }, [auth?.user]);

  // Fetch available exam types
  useEffect(() => {
    const fetchExamTypes = async () => {
      try {
        const response = await axios.get(`${baseApi}/exam/exam-types`);
        setExamData(prev => ({ ...prev, availableTypes: response.data }));
      } catch (error) {
        console.error("Failed to fetch exam types:", error);
        toast.error("Failed to load exam types. Please try again later.");
      } finally {
        setLoading(prev => ({ ...prev, examTypes: false }));
      }
    };
    fetchExamTypes();
  }, []);

  // Fetch subscription status
  useEffect(() => {
    const checkSubscriptionStatus = async () => {
      const result = await apiRequest("/subscription/payment-status");
      if (result.success) {
        setExamData(prev => ({
          ...prev,
          subscribedTypes: result.data.subscribedExamTypes || []
        }));
      } else {
        toast.error("Failed to check subscription status.");
      }
      setLoading(prev => ({ ...prev, subscriptions: false }));
    };
    
    if (user) {
      checkSubscriptionStatus();
    }
  }, [user]);

  // Fetch user stats
  useEffect(() => {
    const fetchUserStats = async () => {
      const result = await apiRequest("/exam/stats");
      if (result.success) {
        setStats(result.data);
      }
      setLoading(prev => ({ ...prev, stats: false }));
    };
    fetchUserStats();
  }, []);

  // Fetch referral stats
  useEffect(() => {
   const fetchReferralStats = async () => {
  if (!user) return;
  
  const result = await apiRequest("/referrals/referral-stats");
  if (result.success) {
    setReferralData({
      referredCount: result.data.referredCount || 0,
      totalEarnings: result.data.totalEarnings || 0,
      earningsPerReferral: result.data.earningsPerReferral || 0,
      subscriptionFee: result.data.subscriptionFee || 2000
    });
  } else {
    toast.error("Failed to fetch referral stats");
  }
  setLoading(prev => ({ ...prev, referrals: false }));
};
    
    if (!loading.user && user) {
      fetchReferralStats();
    }
  }, [loading.user, user]);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  const handleTakeExam = (examType: string) => {
    navigate(`/exams?examType=${examType.toLowerCase()}`);
  };

  const handleSubscribe = (examType: string) => {
    setExamData(prev => ({ ...prev, selectedType: examType }));
    toggleModal('payment', true);
  };

  const handleCopyReferralLink = () => {
    if (!user?.email) return;
    
    const referralLink = `${window.location.origin}/register?ref=${user.email}`;
    navigator.clipboard.writeText(referralLink);
    toast.success("Referral link copied to clipboard!");
  };

  const handleTakeFreeTest = () => {
    if (user) {
      navigate("/olevel");
    } else {
      toast.error("Please log in to take a free test.");
      navigate("/login");
    }
  };

  const isPageLoading = Object.values(loading).some(state => state);

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } md:translate-x-0 md:relative`}
      >
        <Sidebar
          openProfileModal={() => toggleModal('profile', true)}
          openPerformanceModal={() => toggleModal('performance', true)}
          openExamHistoryModal={() => toggleModal('examHistory', true)}
          openSettingsModal={() => toggleModal('settings', true)}
        />
      </div>

      {/* Sidebar Overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        <header className="bg-white shadow-sm p-4 flex justify-between items-center sticky top-0 z-10">
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-600 focus:outline-none"
            aria-label="Toggle menu"
          >
            <FaBars className="w-6 h-6" />
          </button>
          <h1 className="text-xl font-semibold text-gray-800">
            {isPageLoading
              ? "Loading..."
              : `Welcome, ${user?.firstName || 'User'} ${user?.lastName || ''}`}
          </h1>
          <button
            onClick={handleTakeFreeTest}
            className="bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
          >
            Take Free Test
          </button>
        </header>

        <main className="p-6 overflow-auto">
          {/* Page sections */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Available Exams</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {examData.availableTypes.length > 0 ? (
                examData.availableTypes.map((examType) => (
                  <div key={examType} className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
                    <h3 className="text-lg font-semibold mb-3 text-gray-800">{examType}</h3>
                    {examData.subscribedTypes.includes(examType) ? (
                      <>
                        <span className="inline-block mb-3 px-2 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium">
                          Subscribed
                        </span>
                        <button
                          onClick={() => handleTakeExam(examType)}
                          className="w-full bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
                        >
                          Take Exam
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => handleSubscribe(examType)}
                        className="w-full bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
                      >
                        Subscribe
                      </button>
                    )}
                  </div>
                ))
              ) : (
                <div className="col-span-3 p-6 bg-white rounded-lg shadow-sm text-center">
                  {loading.examTypes ? (
                    <p className="text-gray-500">Loading available exams...</p>
                  ) : (
                    <p className="text-gray-500">No exam types available at this time.</p>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Your Performance</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatsCard
                icon={<FaChartLine className="text-[#66934e] text-3xl" />}
                title="Total Exams"
                value={stats.totalExams.toString()}
              />
              <StatsCard
                icon={<FaTrophy className="text-[#66934e] text-3xl" />}
                title="Highest Score"
                value={`${stats.highestScore}%`}
              />
              <StatsCard
                icon={<FaClipboardList className="text-[#66934e] text-3xl" />}
                title="Exams Passed"
                value={stats.examsPassed.toString()}
              />
            </div>
          </section>

          {!loading.user && user && (
           <section>
  <h2 className="text-xl font-semibold text-gray-800 mb-4">Referral Program</h2>
  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
    <div className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Referral Link
      </h3>
      <div className="flex items-center">
        <input
          type="text"
          value={`${window.location.origin}/register?ref=${user.email}`}
          readOnly
          className="flex-1 px-3 py-2 border rounded-l-lg bg-gray-50 text-sm focus:outline-none"
        />
        <button
          onClick={handleCopyReferralLink}
          className="bg-[#66934e] text-white px-4 py-2 rounded-r-lg hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
        >
          Copy
        </button>
      </div>
      <p className="text-sm text-gray-600 mt-2">
        Share this link to earn ₦{referralData.earningsPerReferral.toFixed(2)} per successful referral!
      </p>
    </div>
    <div className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Referrals
      </h3>
      <p className="text-2xl font-bold text-[#66934e]">
        {referralData.referredCount} Users
      </p>
      <p className="text-sm text-gray-600 mt-1">
        {referralData.referredCount === 0 ? 
          "No referrals yet. Share your link to start earning!" : 
          `You've successfully referred ${referralData.referredCount} user${referralData.referredCount > 1 ? 's' : ''}.`}
      </p>
    </div>
    <div className="p-5 bg-white rounded-lg shadow-sm hover:shadow-md transition-shadow border border-gray-100">
      <h3 className="text-lg font-semibold mb-3 text-gray-800">
        Total Earnings
      </h3>
      <p className="text-2xl font-bold text-[#66934e]">
        ₦{referralData.totalEarnings.toFixed(2)}
      </p>
      <p className="text-sm text-gray-600 mt-1">
        You earn 5% (₦{referralData.earningsPerReferral.toFixed(2)}) of each ₦{referralData.subscriptionFee.toFixed(2)} subscription
      </p>
    </div>
  </div>
</section>
          )}
        </main>
      </div>

      {/* Modals */}
      {modals.profile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">User Profile</h2>
            <Profile />
            <button
              onClick={() => toggleModal('profile', false)}
              className="mt-4 bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {modals.performance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Performance Metrics</h2>
            <Performance />
            <button
              onClick={() => toggleModal('performance', false)}
              className="mt-4 bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {modals.examHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Exam History</h2>
            <ExamHistory />
            <button
              onClick={() => toggleModal('examHistory', false)}
              className="mt-4 bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {modals.settings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Account Settings</h2>
            <Setting />
            <button
              onClick={() => toggleModal('settings', false)}
              className="mt-4 bg-[#66934e] text-white px-4 py-2 rounded-md hover:bg-[#85b35c] transition-colors focus:outline-none focus:ring-2 focus:ring-[#66934e] focus:ring-opacity-50"
            >
              Close
            </button>
          </div>
        </div>
      )}
      
      {modals.payment && examData.selectedType && (
        <PaymentModal
          email={user?.email || ""}
          examType={examData.selectedType}
          onClose={() => toggleModal('payment', false)}
          onSuccess={() => {
            setExamData(prev => ({
              ...prev,
              subscribedTypes: [...prev.subscribedTypes, examData.selectedType!]
            }));
            toast.success(`Subscribed to ${examData.selectedType}!`);
            toggleModal('payment', false);
          }}
        />
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Dashboard;