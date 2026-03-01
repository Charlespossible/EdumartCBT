import React, { useState, useEffect } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";

interface UserProfile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  createdAt: string;
}

const Profile: React.FC = () => {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const accessToken = localStorage.getItem("accessToken");
        if (!accessToken) {
          throw new Error("No access token found");
        }


        const response = await axios.get(`${baseApi}/auth/profile`, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast.error("Failed to fetch profile data");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);


  if (loading) {
    return <div className="p-6 bg-white shadow-md rounded-md">Loading...</div>;
  }

  if (!profile) {
    return <div className="p-6 bg-white shadow-md rounded-md">No profile data available.</div>;
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
      <div className="space-y-4">
        <p>
          <strong>Name:</strong> {profile?.firstName} {profile?.lastName}
        </p>
        <p>
          <strong>Email:</strong> {profile?.email}
        </p>
        <p>
          <strong>Enrolled Since:</strong> {profile && new Date(profile.createdAt).toLocaleDateString()}
        </p>
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default Profile;