import React from "react";
import Navbar from "../../components/Navbar";
import Footer from "../../components/Footer";
import AdminLogin from "../../components/admin/AdminLogin";


const Adminlogin: React.FC = () => {
  return (
    <div>
      <Navbar />
      <AdminLogin/>
      <Footer />
    </div>
  );
};

export default Adminlogin;
