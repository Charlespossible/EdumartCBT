import React, { useState, useCallback } from "react";
import axios from "axios";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import baseApi from "../utils/baseApi";

type FormData = {
  name: string;
  email: string;
  message: string;
};

const ContactCard = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div className="bg-white shadow-lg rounded-lg p-6 flex flex-col items-center justify-center text-center transition-transform hover:scale-105">
    <h2 className="text-xl font-bold text-gray-800 mb-2">{title}</h2>
    <hr className="border-b-2 border-[#66934e] mt-2 mb-5 w-4 mx-auto" />
    {children}
  </div>
);

const ContactUs: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Memoized input change handler
  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const { name, value } = e.target;
      setFormData((prev) => ({ ...prev, [name]: value }));
    },
    []
  );

  // Memoized form submission handler
  const handleSubmit = useCallback(
    async (e: React.FormEvent<HTMLFormElement>) => {
      e.preventDefault();
      setIsSubmitting(true);

      try {
        const response = await axios.post(`${baseApi}/auth/contact`, formData);
        toast.success(response.data.message);
        setFormData({ name: "", email: "", message: "" });
      } catch (error) {
        toast.error("Failed to send message. Please try again.");
        console.error("Error submitting form:", error);
      } finally {
        setIsSubmitting(false);
      }
    },
    [formData]
  );

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 md:p-6">
      <div className="w-full max-w-5xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-6 text-center">
          Contact Us
        </h1>
        <hr className="border-b-2 border-[#66934e] mt-2 mb-10 w-24 mx-auto" />

        {/* Contact Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <ContactCard title="Phone Numbers">
            <p className="text-gray-600">+234 080 507 02008</p>
            <p className="text-gray-600">+234 090 7946 0958</p>
          </ContactCard>

          <ContactCard title="Email">
            <p className="text-gray-600">contact@edumart.com</p>
            <p className="text-gray-600">support@edumart.com</p>
          </ContactCard>

          <ContactCard title="Social Media">
            <p className="text-gray-600">@Edumart (Twitter)</p>
            <p className="text-gray-600">/Edumart (Facebook)</p>
            <p className="text-gray-600">@Edumart (Instagram)</p>
          </ContactCard>
        </div>

        <hr className="border-b-2 border-[#66934e] mt-2 mb-10 w-full max-w-md mx-auto" />

        {/* Contact Form */}
        <div className="bg-white shadow-lg rounded-lg p-6 md:p-8 w-full max-w-2xl mx-auto transition-shadow hover:shadow-xl">
          <h3 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            We would love to hear from you.
          </h3>
          <hr className="border-b-2 border-[#66934e] mt-2 mb-5 w-10 mx-auto" />
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-gray-600 font-medium">
                Name
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-[#66934e] focus:ring-[#66934e] transition-all"
                placeholder="Your Name"
                required
                aria-label="Your Name"
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-gray-600 font-medium">
                Email
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-[#66934e] focus:ring-[#66934e] transition-all"
                placeholder="Your Email"
                required
                aria-label="Your Email"
              />
            </div>

            <div>
              <label htmlFor="message" className="block text-gray-600 font-medium">
                Message
              </label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                className="mt-1 block w-full border-gray-300 px-4 py-4 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:border-[#66934e] focus:ring-[#66934e] transition-all"
                rows={5}
                placeholder="Your Message"
                required
                aria-label="Your Message"
              />
            </div>

            <div className="text-center">
              <button
                type="submit"
                disabled={isSubmitting}
                className="bg-[#66934e] text-white px-6 py-3 rounded-md shadow-md hover:bg-green-600 transition duration-300 disabled:opacity-50 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#66934e]"
                aria-label={isSubmitting ? "Sending..." : "Send Message"}
              >
                {isSubmitting ? "Sending..." : "Send Message"}
              </button>
            </div>
          </form>
        </div>
      </div>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={true}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default React.memo(ContactUs);