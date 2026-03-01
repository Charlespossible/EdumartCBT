import React from "react";
import Navbar from "../../components/Navbar";
import PostUtme from "../../components/exams/postUtme";
import Footer from "../../components/Footer";


const Putmepage: React.FC = () => {
  return (
    <div>
      <Navbar />
      <PostUtme />
      <Footer />
    </div>
  );
};

export default Putmepage;
