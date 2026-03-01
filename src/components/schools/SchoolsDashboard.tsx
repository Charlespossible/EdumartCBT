import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FaHome, FaChalkboardTeacher, FaBook, FaUserGraduate, FaUsers, FaClipboardList, FaChartBar, FaCog,
  FaBell, FaSignOutAlt, FaBars, FaTimes, FaSearch
} from "react-icons/fa";
import CreateExam from "./exams/CreateExam";
import { toast } from "react-toastify";
import DashboardContent from "./DashboardContent";
import ExamsContent from "../schools/ExamsContent";
import SubjectsContent from "../schools/SubjectsContent";
import ClassesContent from "../schools/ClassContent";
import StudentsContent from "../schools/StudentsContent";
import TeachersContent from "../schools/TeachersContent";
import ReportsContent from "../schools/ReportContent";
import SettingsContent from "../schools/SettingsContent";
import CreateUserModal from "../schools/CreateUsermodal";

type UserRole = "ADMIN" | "TEACHER" | "STUDENT";

interface SessionData {
  token: string;
  role: UserRole;
  userId: string;
  expiresAt: number;
}

interface Exam {
  id: string;
  name: string;
  subject: string;
  class: string;
  date: string;
  status: "Active" | "Scheduled" | "Completed" | "Pending";
  createdBy: string;
}

interface Subject {
  id: string;
  name: string;
}

interface Class {
  id: string;
  name: string;
}

interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
}

interface Teacher {
  id: string;
  name: string;
  email: string;
}

interface Report {
  id: string;
  examId: string;
  studentId: string;
  score: number;
  totalQuestions: number;
  date: string;
}

interface SchoolSettings {
  schoolName: string;
  logoUrl: string;
  contactEmail: string;
  contactPhone: string;
  defaultExamDuration: number;
  questionsPerPage: number;
  randomizeQuestions: boolean;
  passwordMinLength: number;
  sessionTimeout: number;
  emailNotifications: boolean;
  inAppNotifications: boolean;
}

const SchoolDashboardPage: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("dashboard");
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notifications, _setNotifications] = useState(0);
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateExam, setShowCreateExam] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [exams, setExams] = useState<Exam[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [reports, setReports] = useState<Report[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>({
    schoolName: "",
    logoUrl: "",
    contactEmail: "",
    contactPhone: "",
    defaultExamDuration: 60,
    questionsPerPage: 1,
    randomizeQuestions: true,
    passwordMinLength: 8,
    sessionTimeout: 30,
    emailNotifications: true,
    inAppNotifications: true,
  });

  // Session validation and token extraction - optimized with useMemo for parsing
  useEffect(() => {
    const validateSession = () => {
      const session = localStorage.getItem("edumart-session");
      if (session) {
        try {
          const sessionData: SessionData = JSON.parse(session);
          const roleMapping: { [key: string]: UserRole } = {
            'ADMIN': 'ADMIN',
            'TEACHER': 'TEACHER',
            'STUDENT': 'STUDENT'
          };
          if (sessionData.role && sessionData.token && sessionData.expiresAt > Date.now()) {
            const mappedRole = roleMapping[sessionData.role] || null;
            setUserRole(mappedRole);
            setToken(sessionData.token);
            return;
          }
        } catch (error) {
          console.error("Session validation error:", error);
        }
      }
      
      // If we reach here, session is invalid
      localStorage.removeItem("edumart-session");
      navigate("/schools/login");
    };

    validateSession();
  }, [navigate]);

  // Fetch data function with useCallback to prevent recreation on every render
  const fetchData = useCallback(async () => {
    if (!token || !userRole) return;
    
    setIsLoading(true);
    const headers = { 'Authorization': `Bearer ${token}` };
    
    try {
      // Define which endpoints to fetch based on user role
      const endpoints = [
        { url: '/api/exams', setter: setExams, roles: ['ADMIN', 'TEACHER', 'STUDENT'] },
        { url: '/school/add-subjects', setter: setSubjects, roles: ['ADMIN', 'TEACHER'] },
        { url: '/api/classes', setter: setClasses, roles: ['ADMIN', 'TEACHER'] },
        { url: '/api/students', setter: setStudents, roles: ['ADMIN', 'TEACHER'] },
        { url: '/api/teachers', setter: setTeachers, roles: ['ADMIN'] },
        { url: '/api/reports', setter: setReports, roles: ['ADMIN', 'TEACHER'] },
        { url: '/api/settings', setter: setSettings, roles: ['ADMIN'] },
      ];
      
      // Filter endpoints by user role and create fetch promises
      const promises = endpoints
        .filter(endpoint => endpoint.roles.includes(userRole))
        .map(endpoint => 
          fetch(endpoint.url, { headers })
            .then(response => {
              if (!response.ok) throw new Error(`Failed to fetch ${endpoint.url}`);
              return response.json();
            })
            .then(data => endpoint.setter(data))
            .catch(error => {
              console.error(`Error fetching ${endpoint.url}:`, error);
              return null;
            })
        );
      
      await Promise.allSettled(promises);
    } catch (error) {
      console.error('Error fetching data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  }, [token, userRole]);

  // Fetch data when token or userRole changes
  useEffect(() => {
    if (token && userRole) {
      fetchData();
    }
  }, [fetchData, token, userRole]);

  // Function to refresh exams
  const refreshExams = useCallback(async () => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/exams', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        setExams(await response.json());
        toast.success('Exams refreshed successfully');
      } else {
        throw new Error('Failed to refresh exams');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to refresh exams');
    }
  }, [token]);

  // Function to refresh users (teachers or students)
  const refreshUsers = useCallback(async (role: 'TEACHER' | 'STUDENT') => {
    if (!token) return;
    
    try {
      const fetchUrl = role === 'TEACHER' ? '/api/teachers' : '/api/students';
      const response = await fetch(fetchUrl, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        if (role === 'TEACHER') {
          setTeachers(data);
        } else {
          setStudents(data);
        }
        toast.success(`${role.toLowerCase()}s refreshed successfully`);
      } else {
        throw new Error(`Failed to refresh ${role.toLowerCase()}s`);
      }
    } catch (error) {
      console.error(error);
      toast.error(`Failed to refresh ${role.toLowerCase()}s`);
    }
  }, [token]);

  // Handle user creation with proper handling for different user roles
  const handleCreateUser = useCallback(async (userData: { name: string; email: string; role: 'TEACHER' | 'STUDENT'; classId?: string; schoolId: string }) => {
    if (!token) return;
    
    try {
      const response = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(userData),
      });
      
      if (response.ok) {
        const { tempPassword } = await response.json();
        toast.success(`User created! Email: ${userData.email}, Temporary Password: ${tempPassword}`);
        await refreshUsers(userData.role);
        return true;
      } else {
        const errorData = await response.json().catch(() => ({ message: 'Failed to create user' }));
        throw new Error(errorData.message || 'Failed to create user');
      }
    } catch (error) {
      console.error(error);
      toast.error(error instanceof Error ? error.message : 'Failed to create user');
      return false;
    }
  }, [token, refreshUsers]);

  // Memoize navigation items to prevent unnecessary re-renders
  const navigationItems = useMemo(() => {
    const allItems = [
      { id: "dashboard", label: "Dashboard", icon: <FaHome />, roles: ["ADMIN", "TEACHER", "STUDENT"] },
      { id: "exams", label: "Exams", icon: <FaClipboardList />, roles: ["ADMIN", "TEACHER", "STUDENT"] },
      { id: "subjects", label: "Subjects", icon: <FaBook />, roles: ["ADMIN", "TEACHER"] },
      { id: "classes", label: "Classes", icon: <FaChalkboardTeacher />, roles: ["ADMIN", "TEACHER"] },
      { id: "students", label: "Students", icon: <FaUserGraduate />, roles: ["ADMIN", "TEACHER"] },
      { id: "teachers", label: "Teachers", icon: <FaUsers />, roles: ["ADMIN"] },
      { id: "reports", label: "Reports", icon: <FaChartBar />, roles: ["ADMIN", "TEACHER"] },
      { id: "settings", label: "Settings", icon: <FaCog />, roles: ["ADMIN"] },
    ];
    return userRole ? allItems.filter(item => item.roles.includes(userRole)) : [];
  }, [userRole]);

  const handleLogout = useCallback(() => {
    localStorage.removeItem("edumart-session");
    navigate("/schools/login");
  }, [navigate]);

  if (!userRole) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#66934e]"></div>
      </div>
    );
  }

  // Sidebar component optimized with memo pattern
  const Sidebar = React.memo(() => (
    <div 
      className={`
        bg-[#557a40] text-white fixed lg:static inset-y-0 left-0 z-50 transform 
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
        lg:translate-x-0 transition duration-300 ease-in-out w-64 flex flex-col
      `}
    >
      <div className="p-5 border-b border-[#66934e]">
        <Link to="/" className="flex items-center space-x-3">
          <div className="font-bold text-xl text-white">Edumart CBT</div>
        </Link>
      </div>
      <div className="flex-1 overflow-y-auto py-4">
        <nav className="px-4 space-y-1">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`
                flex items-center px-4 py-3 rounded-lg w-full text-left 
                ${activeTab === item.id ? "bg-[#66934e] text-white" : "text-gray-100 hover:bg-[#66934e] hover:bg-opacity-70"}
              `}
            >
              <span className="mr-3 text-lg">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </div>
      <div className="p-4 border-t border-[#66934e]">
        <button 
          onClick={handleLogout} 
          className="flex items-center px-4 py-2 text-gray-100 hover:bg-[#66934e] hover:bg-opacity-70 rounded-lg w-full"
        >
          <FaSignOutAlt className="mr-3 text-lg" />
          <span>Log Out</span>
        </button>
      </div>
    </div>
  ));

  // Header component optimized with memo pattern
  const Header = React.memo(() => (
    <header className="bg-white shadow-sm z-10">
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center space-x-4">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)} 
            className="text-gray-600 lg:hidden"
            aria-label={sidebarOpen ? "Close sidebar" : "Open sidebar"}
          >
            {sidebarOpen ? <FaTimes size={20} /> : <FaBars size={20} />}
          </button>
          <div className="relative">
            <input
              type="text"
              placeholder="Search..."
              className="w-48 sm:w-64 md:w-80 pl-10 pr-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#66934e]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <FaSearch className="absolute left-3 top-2.5 text-gray-400" />
          </div>
        </div>
        <div className="flex items-center space-x-4">
          <div className="relative">
            <button className="text-gray-600 hover:text-gray-800" aria-label="Notifications">
              <FaBell size={20} />
              {notifications > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notifications}
                </span>
              )}
            </button>
          </div>
          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 rounded-full bg-[#66934e] flex items-center justify-center text-white">
              {userRole?.[0]}
            </div>
            <div className="hidden md:block">
              <div className="text-sm font-medium text-gray-800">{`${userRole} User`}</div>
              <div className="text-xs text-gray-500">{userRole}</div>
            </div>
          </div>
        </div>
      </div>
    </header>
  ));

  // Main content with lazy loading
  const renderMainContent = () => {
    if (isLoading) {
      return (
        <div className="flex items-center justify-center h-full">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#66934e]"></div>
        </div>
      );
    }

    switch (activeTab) {
      case "dashboard":
        return (
          <DashboardContent 
            userRole={userRole} 
            setShowCreateExam={setShowCreateExam} 
            exams={exams} 
            classes={classes}
            teachers={teachers}
            students={students}
            token={token || ""}
          />
        );
      case "exams":
        return (
          <ExamsContent 
            userRole={userRole} 
            setShowCreateExam={setShowCreateExam} 
            exams={exams} 
            subjects={subjects} 
            classes={classes} 
          />
        );
      case "subjects":
        return (
          <SubjectsContent 
            subjects={subjects} 
            setSubjects={setSubjects} 
            token={token || ""}
          />
        );
      case "classes":
        return (
          <ClassesContent 
            classes={classes} 
            setClasses={setClasses} 
            token={token || ""}
          />
        );
      case "students":
        return (
          <StudentsContent 
            students={students} 
            setStudents={setStudents} 
            token={token || ""}
            setShowCreateUser={setShowCreateUser} 
            schoolId={settings.schoolName}
          />
        );
      case "teachers":
        return (
          <TeachersContent 
            teachers={teachers} 
            setTeachers={setTeachers}
            token={token || ""} 
            setShowCreateUser={setShowCreateUser} 
            schoolId={settings.schoolName}
          />
        );
      case "reports":
        return (
          <ReportsContent 
            reports={reports} 
            exams={exams} 
            subjects={subjects}
            setSubjects={setSubjects}
            token={token || ""}
            schoolId={settings.schoolName}
          />
        );
      case "settings":
        return (
          <SettingsContent 
            settings={settings} 
            setSettings={setSettings} 
            token={token} 
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />

        <main className="flex-1 overflow-y-auto bg-gray-50 p-4 md:p-6">
          {renderMainContent()}
        </main>

        {/* Modals */}
        {showCreateExam && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <CreateExam
              onClose={() => setShowCreateExam(false)}
              onCreate={() => {
                setShowCreateExam(false);
                refreshExams();
              }}
              token={token || ""}
              schoolId={settings.schoolName} 
            />
          </div>
        )}
        {showCreateUser && (
          <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <CreateUserModal 
              onClose={() => setShowCreateUser(false)} 
              handleCreateUser={handleCreateUser}
              schoolId={settings.schoolName}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default SchoolDashboardPage;