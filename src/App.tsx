 import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from "./pages/Home";
import About from "./pages/About";
import Exams from "./pages/Exams";
import Myleaderboard from "./pages/Myleaderboard";
import Register from "./pages/Register";
import Login from "./pages/Login";
import Contact from "./pages/Contact";
import Pricing from "./pages/Pricing";
import Dashboard from "./pages/Dashboard";
import Myprofile from "./pages/Myprofile";
import Myperfomance from "./pages/Myperfomance";
import MyexamHistory from "./pages/MyexamHistory";
import MyuserLeaderboard from "./pages/MyuserLeaderboard";
import Mysetting from "./pages/Mysetting";
import Admin from "./pages/Admin";
import OTPVerificationPage from "./pages/OTPVerificationPage";
import Adminlogin from "./pages/admin/Adminlogin";
import AdminDashboard from "./pages/admin/AdminDashboard";
//import Sidebar from "./components/Sidebar";
import Sidebar from "./pages/admin/Sidebar";
import UsersTable from "./pages/admin/UsersTable";
import UploadQuestions from "./pages/admin/UploadQuestions";
import CreateAdmin from "./pages/admin/CreateAdmin";
import AdminLogout from "./pages/admin/AdminLogout";
//import Logout from "./pages/Logout";
import Protected from "./components/Protected";
import ProtectedRoute from "./components/ProtectedRoute";
import Forgotpassword from "./pages/Forgotpassword";
import QuizPage from "./pages/QuizPage";
import { AuthProvider } from "./context/AuthContext";
import Jambpage from "./pages/exams/Jamb";
import UniExamPage from "./pages/exams/uniexam";
import IcanPage from "./pages/exams/ican";
import Adminregister from "./pages/admin/Adminregister";
import Olevelpage from "./pages/exams/Olevelpage";
import FreePractice from "./pages/exams/FreePractice";
import Putmepage from "./pages/exams/postutm";
import Centrancepage from "./pages/exams/Centrance";
import Pexamspage from "./pages/exams/Pexams";
import Jwaecpage from "./pages/exams/Jwaec";
import Resetpassword from "./pages/Resetpassword";
import Schoolpage from "./pages/schools/Schoolpage";
import SchoolLoginpage from "./pages/schools/SchoolLoginpage";
import SchoolRegistrationpage from "./pages/schools/SchoolRegistrationpage";
import Otpverificationform from "./pages/schools/Otpverificationform";
import Passwordforgetform from "./pages/schools/Passwordforgetform";
import PasswordReset from "./pages/schools/Passwordreset";
import Schooldashboardpage from "./pages/schools/Schoolsdashboard";
import CreatesExam from "./pages/schools/exams/CreateExamPage";

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/about" element={<About />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/leaderboard" element={<Myleaderboard />} />
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/jamb" element={<Jambpage />} />
        <Route path="/uexam" element={<UniExamPage />} />
        <Route path="/ican" element={<IcanPage />} />
        <Route path="/olevel" element={<Olevelpage />} />
        <Route path="/commonentrance" element={<Centrancepage />} />
        <Route path="/Jwaec" element={<Jwaecpage />} />
        <Route path="/proffesionalexams" element={<Pexamspage />} />
        <Route path="/schools" element={<Schoolpage />} />
        <Route path="/schools/login" element={<SchoolLoginpage />} />
        <Route path="/schools/register" element={<SchoolRegistrationpage />} />
        <Route path="/schools/otpverify" element={<Otpverificationform />} />
        <Route path="/schools/forgotpassword" element={<Passwordforgetform />} />
        <Route path="/schools/passwordreset" element={<PasswordReset />} />
        <Route path="/schools/dashboard" element={<Schooldashboardpage />} />
        <Route path="/schools/exams/create" element={<CreatesExam />} />
        <Route path="/postutme" element={<Putmepage />} />
        <Route path="/:examType/practice" element={<FreePractice />} />
        <Route path="/forgotpassword" element={<Forgotpassword />} />
        <Route path="/reset-password" element={<Resetpassword />} />
        <Route path="/contact" element={<Contact />} />
        <Route element={<Protected />}>
          <Route path="/exams" element={<Exams />} />
          <Route path="/quiz" element={<QuizPage />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/dashboard/profile" element={<Myprofile />} />
          <Route path="/dashboard/performance" element={<Myperfomance />} />
          <Route path="/dashboard/exam-history" element={<MyexamHistory />} />
          <Route path="/user-leaderboard" element={<MyuserLeaderboard />} />
          <Route path="/settings" element={<Mysetting />} />
        </Route>
        <Route path="/otp-verification" element={<OTPVerificationPage />} />
        <Route path="/admin/logout" element={<AdminLogout />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/admin/register" element={<Adminregister />} />
        <Route path="/admin/adminlogin" element={<Adminlogin />} />
        <Route element={<ProtectedRoute />}>
          <Route
            path="/admin/sidebar"
            element={
              <Sidebar
                openUsersTableModal={() => {}}
                openQuestionEditorModal={() => {}}
                openCreateAdminModal={() => {}}
              />
            }
          />
          <Route path="/admin/users" element={<UsersTable />} />
          <Route path="/admin/upload" element={<UploadQuestions />} />
          <Route path="/admin/createadmin" element={<CreateAdmin />} />
          <Route path="/admin/admindashboard" element={<AdminDashboard />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
};

export default App;
