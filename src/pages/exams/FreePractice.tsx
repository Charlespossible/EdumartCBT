import React from "react";
import Navbar from "../../components/Navbar";
import PracticeTest from "../../components/exams/PracticeTest";
import Footer from "../../components/Footer";


const FreePractice: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PracticeTest />
      <Footer />
    </div>
  );
};

export default FreePractice;