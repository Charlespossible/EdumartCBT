import React from "react";
import Navbar from "../../components/Navbar";
import UniEntranceExams from "../../components/exams/Uniexams";
import Footer from "../../components/Footer";


const UniExamPage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <UniEntranceExams />
      <Footer />
    </div>
  );
};

export default UniExamPage;
