import React from "react";
import Navbar from "../../components/Navbar";
import CommonEntrance from "../../components/exams/CommonEntrance";
import Footer from "../../components/Footer";


const Centrancepage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <CommonEntrance/>
      <Footer />
    </div>
  );
};

export default Centrancepage;