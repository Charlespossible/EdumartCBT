import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const AdminLogout: React.FC = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // Remove the token and email from the local storage
    localStorage.removeItem("adminToken");

    // Notify the user
    toast.success("You have been logged out successfully!", {
      position: "top-right",
      autoClose: 4000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });

    // Redirect to the login page
    navigate("/admin/Adminlogin");
  }, [navigate]);

  return (
    <div>
      <ToastContainer />
    </div>
  );
};

export default AdminLogout;


