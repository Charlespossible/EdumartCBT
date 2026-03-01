import express  from "express";
import multer from "multer";
import * as authController from '../controllers/auth';
import * as otpController from '../controllers/otpController';
import { loginController } from "../controllers/admin/loginControler";
import { adminRegister } from "../controllers/admin/registerController";
import { getBestPerformers } from "../controllers/leaderboard";
import { submitContactForm } from "../controllers/contact";
import { forgotPassword, resetPassword, Rpassword} from "../controllers/forgotPwd";
import uploadQuestions from "../controllers/Uploadquestions";
import { examTypes, subjects, years, Questions, validateAnswer, submitExam, getUserStats } from "../controllers/exams";
import { submitExamResult } from "../controllers/examResultController";
import { authenticate , adminAuth } from "../middleware/auth";
import { getUsers,
         deleteUser, 
         updateUsers,
         getQuestions, 
         updateQuestion, 
         deleteQuestion, 
         createAdmin, 
         uploadQuestionImage,
         deleteQuestionImage,
         searchQuestionByText,
         createQuestion,     
         getCategories,
         upload as questionImageUpload, // ✅ Import the properly configured multer instance
        } from "../controllers/admin/adminController";
import { getPerformance } from "../controllers/performanceController";
import { getStats } from "../controllers/referral";
import { getExamHistory } from "../controllers/examHistory";
import { verify } from "../controllers/payment/Payment";
import { status } from "../controllers/payment/Subscription";
import { sendResultEmail } from "../controllers/send_Exam_Email";
import { Practicetest, PracticetestYear , getRandomQ , CheckAnswer} from "../controllers/Practicetest";
import * as schoolController from "../controllers/school/auth/auth";
import * as subjectController from "../controllers/school/subjects/SubjectController";
import * as classController from "../controllers/school/class/ClassController";
import { verifyToken } from "../controllers/school/middleware/auth";
import * as studentController from "../controllers/school/students/studentController";
import * as teacherController from "../controllers/school/teachers/TeacherController";

const router = express.Router();
// ✅ This upload is ONLY for the bulk question upload feature
const bulkUpload = multer({ dest: "uploads/" });

router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/refresh-token', authController.refreshToken);
router.post('/logout', authController.logout);
router.post('/verifyOTP', otpController.verifyOTP);
router.post('/resendOTP', otpController.resendOTP);
router.get("/leaderboard", getBestPerformers);
router.post("/contact", submitContactForm);
router.post("/forgot-password", forgotPassword);
router.post("/resetpassword", resetPassword);
router.post("/upload-questions", bulkUpload.array("files"), uploadQuestions); // ✅ Use bulkUpload for this
router.post("/admin-register", adminRegister);
router.get('/profile', authController.getProfile);
router.get("/exam-types", examTypes);
router.get("/subjects", subjects);
router.get("/years", years);
router.get("/questions", Questions);
router.get("/subjects/:examType", Practicetest);
router.get("/years/:examType/:subjectName", PracticetestYear);
router.get("/questions/:examType/:subjectName/:year", getRandomQ);
router.post('/check-answer', CheckAnswer)
// DEPRECATED — returns 410 Gone. Answers are now validated locally on the
// client using the correctAnswer field returned by GET /exam/questions.
// Kept registered so old clients receive a clear deprecation response
// rather than a 404.
router.post("/validate-answer", validateAnswer);
router.post("/submit-result", submitExamResult);
// Authoritative server-side scoring — replaces the per-answer validate-answer
// round-trip. Called ONCE when the user finishes or time expires.
// Payload: { answers: Record<questionId, selectedOptionText>, subjectName, year, examType, timeTakenSeconds }
router.post("/submit", authenticate, submitExam);
router.post("/create-admin", adminAuth, createAdmin);

// ✅ FIXED: Use the properly configured multer from adminController
router.post("/upload-question-image", adminAuth, questionImageUpload.single("image"), uploadQuestionImage);

router.delete("/delete-question-image/:filename", adminAuth, deleteQuestionImage);
router.post("/verify-payment" , authenticate , verify);
router.post("/send-result-email" , sendResultEmail);
router.get("/payment-status", authenticate,  status);
router.get('/get-user/:id', authController.getUser);
router.get("/performance", authenticate, getPerformance);
router.get("/referral-stats", authenticate, getStats);
router.get("/exam-history", authenticate, getExamHistory);
router.get("/stats", authenticate, getUserStats);
router.get("/users", adminAuth, getUsers);
router.get("/reset-password", Rpassword );
router.delete("/delete-users/:id", adminAuth, deleteUser);
router.post("/admin-login", loginController);
router.get('/settings/:userId', authController.getUserSettings);
router.put('/update-user/:id', authenticate, authController.updateUser);
router.put("/edit-users/:id", adminAuth , updateUsers);
router.get("/search-question", adminAuth, searchQuestionByText);
router.get("/get-categories", adminAuth, getCategories);     
router.post("/create-question", adminAuth, createQuestion);
router.get("/get-questions", adminAuth, getQuestions);
router.put("/update-questions/:id", adminAuth, updateQuestion);
router.delete("/del-questions/:id", adminAuth, deleteQuestion);

// School Routes
router.post('/school-register', schoolController.validateRegistrationData, schoolController.schoolRegister);
router.post('/school-Login', schoolController.schoolLogin);
router.post('/School-forgot-password', schoolController.schoolforgotPassword);

// All protected routes
router.use(verifyToken);
router.post('/add-subjects',  subjectController.createSubject);
router.put('/edit-subjects/:id' , subjectController.updateSubject);
router.get('/get-subjects', subjectController.getSubjects);
router.delete('/delete-subjects/:id', subjectController.deleteSubject);
router.post('/School-reset-password', schoolController.SchoolresetPassword);
router.post('/add-classes', classController.createClass);
router.delete('/delete-classes/:id', classController.deleteClass);
router.get('/get-classes', classController.getClasses);
router.put('/edit-classes/:id', classController.updateClass);
router.post('/create-students', studentController.CreateStudent); 
router.get('/get-students', studentController.getStudents);
router.post('/create-teachers' , teacherController.CreateTeacher );
router.get('/get-teachers' , teacherController.getTeachers );

export default router;