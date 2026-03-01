import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import baseApi from "../utils/baseApi";

const Settings: React.FC = () => {
  const auth = useContext(AuthContext);
  const [user, setUser] = useState(auth?.user || null);
  const [formData, setFormData] = useState({
    id: "",
    firstName: "",
    lastName: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  

  useEffect(() => {
    if (auth?.user) {
      setUser(auth.user);
      setLoading(false);
    } else {
      const storedUser = localStorage.getItem("user");
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
      setLoading(false);
    }
  }, [auth?.user]);

  useEffect(() => {
    const fetchUserDetails = async () => {
      if (!user?.id) {
        return;
      }
      const Userid = user.id;
      setLoading(true);
      try {
        const response = await axios.get(`${baseApi}/auth/get-user/${Userid}`, 
            
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("accessToken")}` },
        });
        setFormData({
          id: Userid,
          firstName: response.data.firstName,
          lastName: response.data.lastName,
          phone: response.data.phone || "",
        });
      } catch (error) {
        if (axios.isAxiosError(error)) {
          console.error("Fetch error:", error.response?.status, error.response?.data || error.message);
        } else {
          console.error("Fetch error:", error);
        }
        const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Unknown error" : "Unknown error";
        setMessage("Failed to fetch user details: " + errorMessage);
      } finally {
        setLoading(false);
      }
    };

    fetchUserDetails();
  }, [user?.id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      setMessage("User authentication required");
      return;
    }

    setLoading(true);
    setMessage("");

    try {
      const response = await axios.put(
        `${baseApi}/auth/update-user/${user.id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("accessToken")}`,
          },
        }
      );

      setMessage(response.data.message);
      setFormData((prev) => ({
        ...prev,
        ...response.data.user,
      }));
    } catch (error) {
      setMessage("Update failed. Please try again.");
      console.error("Update error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md max-w-2xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Settings</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-700">First Name</label>
          <input
            type="text"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Last Name</label>
          <input
            type="text"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            required
          />
        </div>

        <div>
          <label className="block text-gray-700">Phone Number</label>
          <input
            type="text"
            name="phone"
            value={formData.phone}
            onChange={handleChange}
            className="w-full p-2 border rounded mt-1"
            /*pattern="[0-9]{10}"*/
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="bg-[#66934e] text-white px-4 py-2 rounded hover:bg-[#85b35c] transition-colors"
        >
          {loading ? "Saving..." : "Save Changes"}
        </button>

        {message && (
          <p
            className={`mt-4 text-center ${
              message.includes("success") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
};

export default Settings;