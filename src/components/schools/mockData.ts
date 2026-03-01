// mockData.ts

// Type for exams
type Exam = {
    id: number;
    name: string;
    subject: string;
    class: string;
    status: "Active" | "Scheduled" | "Completed";
    date: string; // ISO date string, e.g., "2023-05-15"
    duration: string; // e.g., "2 hours"
    questions: number;
    createdBy: string; // Name of the creator (e.g., "School Admin" or "Teacher User")
  };
  
  // Type for subjects
 export type Subject = {
    id: number;
    name: string;
  };
  
  // Type for classes
  type Class = {
    id: number;
    name: string;
  };
  
  // Type for students
  type Student = {
    id: number;
    name: string;
    class: string;
    results?: { examId: number; score: number }[]; //Optional exam results
  };
  
  // Type for teachers
  type Teacher = {
    id: number;
    name: string;
    subjects: string[]; // Array of subjects they teach
  };
  
  // Type for recent activities
  type RecentActivity = {
    type: "exam" | "user" | "result" | "other";
    message: string;
    time: string; // Relative time, e.g., "2 hours ago"
  };
  
  // Mock Subjects
  export const mockSubjects: Subject[] = [
    { id: 1, name: "Mathematics" },
    { id: 2, name: "Science" },
    { id: 3, name: "History" },
    { id: 4, name: "English" },
    { id: 5, name: "Geography" },
    { id: 6, name: "Physics" },
    { id: 7, name: "Chemistry" },
    { id: 8, name: "Biology" },
  ];
  
  // Mock Classes
  export const mockClasses: Class[] = [
    { id: 1, name: "JSS 1" },
    { id: 2, name: "JSS 2" },
    { id: 3, name: "JSS 3" },
    { id: 4, name: "SSS 1" },
  ];
  
  // Mock Exams
  export const mockExams: Exam[] = [
    {
      id: 1,
      name: "Math Midterm",
      subject: "Mathematics",
      class: "Grade 10",
      status: "Active",
      date: "2023-05-15",
      duration: "2 hours",
      questions: 50,
      createdBy: "School Admin",
    },
    {
      id: 2,
      name: "Science Quiz",
      subject: "Science",
      class: "Grade 9",
      status: "Scheduled",
      date: "2023-05-20",
      duration: "1 hour",
      questions: 30,
      createdBy: "Teacher User",
    },
    {
      id: 3,
      name: "History Final",
      subject: "History",
      class: "Grade 11",
      status: "Completed",
      date: "2023-05-10",
      duration: "3 hours",
      questions: 100,
      createdBy: "School Admin",
    },
    {
      id: 4,
      name: "English Essay",
      subject: "English",
      class: "Grade 12",
      status: "Active",
      date: "2023-05-18",
      duration: "1.5 hours",
      questions: 1,
      createdBy: "Teacher User",
    },
    {
      id: 5,
      name: "Geography Test",
      subject: "Geography",
      class: "Grade 10",
      status: "Scheduled",
      date: "2023-05-25",
      duration: "1 hour",
      questions: 40,
      createdBy: "School Admin",
    },
    {
      id: 6,
      name: "Physics Exam",
      subject: "Physics",
      class: "Grade 11",
      status: "Completed",
      date: "2023-05-12",
      duration: "2 hours",
      questions: 60,
      createdBy: "Teacher User",
    },
    {
      id: 7,
      name: "Chemistry Lab",
      subject: "Chemistry",
      class: "Grade 12",
      status: "Active",
      date: "2023-05-16",
      duration: "3 hours",
      questions: 20,
      createdBy: "School Admin",
    },
    {
      id: 8,
      name: "Biology Quiz",
      subject: "Biology",
      class: "Grade 9",
      status: "Scheduled",
      date: "2023-05-22",
      duration: "45 minutes",
      questions: 25,
      createdBy: "Teacher User",
    },
    {
      id: 9,
      name: "Math Final",
      subject: "Mathematics",
      class: "Grade 12",
      status: "Completed",
      date: "2023-05-05",
      duration: "2.5 hours",
      questions: 70,
      createdBy: "School Admin",
    },
    {
      id: 10,
      name: "Science Project",
      subject: "Science",
      class: "Grade 11",
      status: "Active",
      date: "2023-05-19",
      duration: "4 hours",
      questions: 1,
      createdBy: "Teacher User",
    },
  ];
  
  // Mock Students
  export const mockStudents: Student[] = [
    {
      id: 1,
      name: "John Doe",
      class: "Grade 10",
      results: [
        { examId: 1, score: 90 },
        { examId: 5, score: 85 },
      ],
    },
    {
      id: 2,
      name: "Jane Smith",
      class: "Grade 9",
      results: [
        { examId: 2, score: 92 },
        { examId: 8, score: 88 },
      ],
    },
    {
      id: 3,
      name: "Alice Johnson",
      class: "Grade 11",
      results: [
        { examId: 3, score: 78 },
        { examId: 6, score: 82 },
      ],
    },
    {
      id: 4,
      name: "Bob Brown",
      class: "Grade 12",
      results: [
        { examId: 4, score: 95 },
        { examId: 7, score: 89 },
      ],
    },
    {
      id: 5,
      name: "Charlie Davis",
      class: "Grade 10",
      results: [
        { examId: 1, score: 88 },
        { examId: 5, score: 90 },
      ],
    },
    // Add more students as needed for a fuller dataset
  ];
  
  // Mock Teachers
  export const mockTeachers: Teacher[] = [
    { id: 1, name: "Mr. Brown", subjects: ["Mathematics", "Science"] },
    { id: 2, name: "Ms. Green", subjects: ["History", "English"] },
    { id: 3, name: "Dr. White", subjects: ["Physics", "Chemistry"] },
    { id: 4, name: "Mrs. Black", subjects: ["Biology", "Geography"] },
  ];
  
  // Mock Recent Activities
  export const mockRecentActivities: RecentActivity[] = [
    {
      type: "exam",
      message: "New exam 'Math Midterm' created by School Admin",
      time: "2 hours ago",
    },
    {
      type: "user",
      message: "Teacher Ms. Green logged in",
      time: "1 hour ago",
    },
    {
      type: "result",
      message: "Student John Doe completed 'Science Quiz'",
      time: "30 minutes ago",
    },
    {
      type: "exam",
      message: "Exam 'History Final' completed",
      time: "1 day ago",
    },
    {
      type: "user",
      message: "Student Alice Johnson registered",
      time: "2 days ago",
    },
    {
      type: "result",
      message: "Results for 'Physics Exam' published",
      time: "3 days ago",
    },
    // Add more activities as needed
  ];