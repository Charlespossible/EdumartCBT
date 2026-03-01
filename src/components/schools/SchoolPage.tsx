import React from "react";
import { Link } from "react-router-dom";
import { FaChalkboardTeacher, FaFileUpload, FaChartBar, FaUserGraduate, FaLaptop, FaLock } from "react-icons/fa";
//import { HiOutlineCheckCircle } from "react-icons/hi";
import school from "../../assets/images/school.svg";

const SchoolsPage: React.FC = () => {
  const features = [
    {
      icon: <FaFileUpload className="text-3xl text-[#66934e]" />,
      title: "Custom Exam Creation",
      description: "Upload your own questions or use our extensive question bank to create custom exams tailored to your curriculum."
    },
    {
      icon: <FaLaptop className="text-3xl text-[#66934e]" />,
      title: "Real-time Assessment",
      description: "Administer exams in real-time with automated grading and instant feedback for students."
    },
    {
      icon: <FaChartBar className="text-3xl text-[#66934e]" />,
      title: "Performance Analytics",
      description: "Access detailed analytics and reports to track student performance and identify areas for improvement."
    },
    {
      icon: <FaUserGraduate className="text-3xl text-[#66934e]" />,
      title: "Student Management",
      description: "Easily manage student accounts, assign exams, and track progress through a simple dashboard."
    },
    {
      icon: <FaLock className="text-3xl text-[#66934e]" />,
      title: "Secure Environment",
      description: "Ensure exam integrity with our secure testing environment designed to prevent cheating."
    },
    {
      icon: <FaChalkboardTeacher className="text-3xl text-[#66934e]" />,
      title: "Teacher Tools",
      description: "Empower teachers with tools to create, manage, and analyze assessments efficiently."
    }
  ];

  const testimonials = [
    {
      name: "Dr. Adebayo Johnson",
      position: "Principal, Excellence Academy",
      content: "Edumart CBT has revolutionized how we conduct assessments. Our teachers save countless hours on grading, and the analytics help us identify struggling students early."
    },
    {
      name: "Mrs. Folake Ogunleye",
      position: "ICT Coordinator, Pinnacle High School",
      content: "The ability to upload our own questions while maintaining the familiar JAMB format gives our students the perfect preparation for their exams."
    },
    {
      name: "Mr. Gabriel Nwachukwu",
      position: "Vice Principal, Cornerstone College",
      content: "Since implementing Edumart CBT, we've seen a 15% improvement in our students' external exam results. The platform is intuitive and reliable."
    }
  ];

  const faqItems = [
    {
      question: "How do I get started with Edumart CBT for my school?",
      answer: "Getting started is easy! Simply click the 'Register School' button, complete the registration form, and our team will reach out to help you set up your school account within 24 hours."
    },
    {
      question: "Can we upload our own questions?",
      answer: "Yes! You can upload your own questions in various formats including multiple choice, theory, and even image-based questions. Our platform also supports uploading questions in bulk via Excel templates."
    },
    {
      question: "How secure is the platform for exams?",
      answer: "Very secure. Our platform includes features like browser lockdown, randomized questions, time limits, and session monitoring to prevent cheating and ensure exam integrity."
    },
    {
      question: "Can we customize the platform to match our school branding?",
      answer: "Yes, with our Professional and Enterprise packages, you can customize the platform with your school logo, colors, and even use your own domain for the exam portal."
    }
  ];

  return (
    <div className="bg-gray-50">
      {/* Hero Section */}
      <section className="bg-[#66934e] text-white py-16 md:py-24">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center">
            <div className="md:w-1/2 mb-10 md:mb-0">
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-6">
                Transform Your School's Assessment Process
              </h1>
              <p className="text-lg md:text-xl mb-8">
                Empower your institution with our comprehensive CBT platform designed specifically for schools. Manage exams, create custom questions, and track student performance all in one place.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/schools/register"
                  className="bg-yellow-400 text-[#557a40] px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-colors duration-300 text-center shadow-md"
                >
                  Register School
                </Link>
                <Link
                  to="/schools/login"
                  className="bg-white text-[#66934e] px-8 py-3 rounded-xl font-bold hover:bg-gray-100 transition-colors duration-300 text-center shadow-md"
                >
                  School Login
                </Link>
              </div>
            </div>
            <div className="md:w-1/2 flex justify-center">
              <img
                src={school}
                alt="School Management Dashboard"
                className="rounded-lg shadow-xl"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Powerful Features for Schools</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Our platform provides everything your school needs to create, administer, and analyze assessments effectively.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-gray-50 p-6 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300">
                <div className="mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-800 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">How It Works</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Get your school up and running on our platform in just a few simple steps.
            </p>
          </div>

          <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-12">
            {/* Step 1 */}
            <div className="bg-white p-6 rounded-xl shadow-md max-w-xs w-full">
              <div className="h-12 w-12 rounded-full bg-[#66934e] text-white flex items-center justify-center font-bold text-xl mb-4">1</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Register Your School</h3>
              <p className="text-gray-600">Complete our simple registration process to create your school account.</p>
            </div>

            {/* Step 2 */}
            <div className="bg-white p-6 rounded-xl shadow-md max-w-xs w-full">
              <div className="h-12 w-12 rounded-full bg-[#66934e] text-white flex items-center justify-center font-bold text-xl mb-4">2</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Set Up Classes & Subjects</h3>
              <p className="text-gray-600">Configure your school structure by adding classes, subjects, and teachers.</p>
            </div>

            {/* Step 3 */}
            <div className="bg-white p-6 rounded-xl shadow-md max-w-xs w-full">
              <div className="h-12 w-12 rounded-full bg-[#66934e] text-white flex items-center justify-center font-bold text-xl mb-4">3</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Create & Assign Exams</h3>
              <p className="text-gray-600">Upload questions or use our question bank to create exams for your students.</p>
            </div>

            {/* Step 4 */}
            <div className="bg-white p-6 rounded-xl shadow-md max-w-xs w-full">
              <div className="h-12 w-12 rounded-full bg-[#66934e] text-white flex items-center justify-center font-bold text-xl mb-4">4</div>
              <h3 className="text-xl font-semibold text-gray-800 mb-2">Monitor & Analyze</h3>
              <p className="text-gray-600">Track student performance and generate comprehensive reports and analytics.</p>
            </div>
          </div>

          <div className="text-center">
            <Link
              to="/schools/demo"
              className="bg-[#66934e] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#557a40] transition-colors duration-300 inline-block shadow-md"
            >
              Request a Demo
            </Link>
          </div>
        </div>
      </section>

      {/* Pricing Section - REPLACED with Contact Us for Pricing */}
      <section className="py-16 bg-yellow-400">
        <div className="container mx-auto px-6">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-[#557a40] mb-4">Contact Us for Pricing</h2>
            <p className="text-lg text-[#557a40] max-w-3xl mx-auto">
              We offer customized pricing packages tailored to your school's specific needs and size. 
              Get in touch with our team to discuss the perfect solution for your institution.
            </p>
          </div>
          
          <div className="flex justify-center">
            <div className="bg-white p-8 rounded-xl shadow-lg max-w-2xl w-full">
              <div className="flex flex-col items-center text-center">
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Find the Perfect Plan for Your School</h3>
                <p className="text-gray-600 mb-6">
                  Our specialists will work with you to understand your requirements and recommend 
                  the best pricing option based on your student population, features needed, and budget.
                </p>
                <Link
                  to="/contact"
                  className="bg-[#66934e] text-white px-8 py-3 rounded-xl font-bold hover:bg-[#557a40] transition-colors duration-300 inline-block shadow-md"
                >
                  Contact Our Team
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">What Schools Say About Us</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Hear from educational institutions already using our platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="bg-white p-6 rounded-xl shadow-md">
                <div className="mb-4">
                  <svg className="h-8 w-8 text-[#66934e]" fill="currentColor" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <path d="M10 8v6c0 5.52-4.48 10-10 10v-2c4.41 0 8-3.59 8-8v-6h-8v-8h10v8zM30 8v6c0 5.52-4.48 10-10 10v-2c4.41 0 8-3.59 8-8v-6h-8v-8h10v8z"></path>
                  </svg>
                </div>
                <p className="text-gray-600 mb-4">{testimonial.content}</p>
                <div>
                  <p className="font-semibold text-gray-800">{testimonial.name}</p>
                  <p className="text-gray-500 text-sm">{testimonial.position}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Frequently Asked Questions</h2>
            <p className="text-lg text-gray-600 max-w-3xl mx-auto">
              Find answers to common questions about our school platform.
            </p>
          </div>

          <div className="max-w-3xl mx-auto">
            {faqItems.map((item, index) => (
              <div key={index} className="mb-6 border-b border-gray-200 pb-6 last:border-b-0">
                <h3 className="text-xl font-semibold text-gray-800 mb-3">{item.question}</h3>
                <p className="text-gray-600">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-[#66934e] text-white py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-8 md:mb-0 md:w-2/3">
              <h2 className="text-3xl font-bold mb-4">Ready to transform your school's assessment process?</h2>
              <p className="text-lg">
                Join hundreds of schools across Nigeria that are already using Edumart CBT to improve their examination process and student outcomes.
              </p>
            </div>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                to="/schools/register"
                className="bg-yellow-400 text-[#557a40] px-8 py-3 rounded-xl font-bold hover:bg-yellow-300 transition-colors duration-300 text-center shadow-md"
              >
                Register Now
              </Link>
              <Link
                to="/contact"
                className="bg-transparent border-2 border-white text-white px-8 py-3 rounded-xl font-bold hover:bg-white/10 transition-colors duration-300 text-center"
              >
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SchoolsPage;