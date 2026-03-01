import React from "react";
import Navbar from "../../../components/Navbar";
import Footer from "../../../components/Footer";
import CreateExam from "../../../components/schools/exams/CreateExam";

const CreatesExam: React.FC = () => {
  return (
    <div>
      <Navbar />
      <CreateExam
        onClose={() => {}}
        onCreate={() => {}}
        token=""
        schoolId=""
      />
      <Footer />
    </div>
  );
};

export default CreatesExam;
