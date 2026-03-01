import React from "react";
import { NavLink } from "react-router-dom";
import { FaFacebook, FaTwitter, FaLinkedin, FaInstagram, FaYoutube } from "react-icons/fa";
import { HiMail, HiPhone, HiLocationMarker } from "react-icons/hi";
import EdumartLogo from "../assets/images/EdumartLogo.png";

interface FooterLink {
  label: string;
  href: string;
  isExternal?: boolean;
  disabled?: boolean;
  highlight?: boolean;
}

interface SocialLink {
  icon: React.ReactNode;
  href: string;
  label: string;
}

const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();
  
  // Organized footer links by category
  const quickLinks: FooterLink[] = [
    { label: "Home", href: "/" },
    { label: "About Us", href: "/about" },
    { label: "Pricing", href: "/pricing" },
    { label: "LeaderBoard", href: "/leaderboard" },
    { label: "Contact", href: "/contact" },
    // Added the For Schools link with highlight property
    { label: "For Schools", href: "/schools", highlight: true },
  ];
  
  const examLinks: FooterLink[] = [
    { label: "O'Level Exams", href: "/olevel" },
    { label: "JAMB", href: "/jamb" },
    { label: "Post UTME", href: "/postUtme" },
    { label: "Common Entrance", href: "/commonentrance" },
    { label: "Professional Exams", href: "/proffesionalexams" },
  ];
  
  const resourceLinks: FooterLink[] = [
    { label: "FAQ", href: "/faq", disabled: true },
    { label: "Study Tips", href: "/study-tips", disabled: true },
    { label: "Blog", href: "/blog", disabled: true },
    { label: "Privacy Policy", href: "/privacy", disabled: true },
    { label: "Terms of Use", href: "/terms", disabled: true },
  ];

  const socialLinks: SocialLink[] = [
    { icon: <FaFacebook size={20} />, href: "https://facebook.com", label: "Facebook" },
    { icon: <FaTwitter size={20} />, href: "https://twitter.com", label: "Twitter" },
    { icon: <FaLinkedin size={20} />, href: "https://linkedin.com", label: "LinkedIn" },
    { icon: <FaInstagram size={20} />, href: "https://instagram.com", label: "Instagram" },
    { icon: <FaYoutube size={20} />, href: "https://youtube.com", label: "YouTube" },
  ];

  const contactInfo = [
    { icon: <HiMail className="text-xl" />, text: "support@edumartcbt.com" },
    { icon: <HiPhone className="text-xl" />, text: "+234 805 070 2008" },
    { icon: <HiLocationMarker className="text-xl" />, text: "Lagos, Nigeria" },
  ];

  const renderFooterLinks = (links: FooterLink[]) => (
    <ul className="space-y-2">
      {links.map((link) => (
        <li key={link.label} className={link.highlight ? "my-3" : ""}>
          {link.disabled ? (
            <span
              className="text-gray-200 cursor-default opacity-80"
              onClick={(e) => e.preventDefault()}
            >
              {link.label}
            </span>
          ) : link.isExternal ? (
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className={`text-gray-200 hover:text-white transition-colors duration-200 ${
                link.highlight 
                  ? "bg-yellow-400 text-[#557a40] px-4 py-2 rounded-xl font-bold hover:bg-yellow-300 hover:text-[#557a40] shadow-md inline-flex items-center"
                  : ""
              }`}
            >
              {link.highlight && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              )}
              {link.label}
            </a>
          ) : (
            <NavLink
              to={link.href}
              className={({ isActive }) =>
                `text-gray-200 transition-colors duration-200 ${
                  isActive ? "text-white font-medium" : "hover:text-white"
                } ${
                  link.highlight 
                    ? "bg-yellow-400 text-[#557a40] px-4 py-2 rounded-xl font-bold hover:bg-yellow-300 hover:text-[#557a40] shadow-md inline-flex items-center"
                    : ""
                }`
              }
            >
              {link.highlight && (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
              )}
              {link.label}
            </NavLink>
          )}
        </li>
      ))}
    </ul>
  );

  return (
    <footer className="bg-[#66934e] text-white">
      <div className="container mx-auto px-6 py-12">
        {/* For Schools Banner - Added at the top of the footer */}
        <div className="mb-10 bg-yellow-400 rounded-xl p-4 shadow-lg">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center mb-4 md:mb-0">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mr-4 text-[#557a40]" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
              </svg>
              <div>
                <h3 className="text-xl font-bold text-[#557a40]">For Schools</h3>
                <p className="text-[#557a40]">Special packages for educational institutions</p>
              </div>
            </div>
            <NavLink
              to="/schools"
              className="bg-[#557a40] text-white px-6 py-3 rounded-lg font-bold hover:bg-[#4a6c38] transition-colors duration-200 shadow-md"
            >
              Learn More
            </NavLink>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Brand and About */}
          <div className="lg:col-span-2">
            <NavLink to="/" className="inline-block mb-4">
              <img
                src={EdumartLogo}
                alt="Edumart Logo"
                className="h-12 w-auto object-contain"
              />
            </NavLink>
            <h2 className="text-xl font-bold mb-3">EDUMARTCBT PREEXAM HALL</h2>
            <p className="text-gray-200 mb-4 max-w-md">
              Helping students prepare for exams with comprehensive practice tests, 
              study materials, and performance analytics to ensure success.
            </p>
            
            {/* Contact Information */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-3">Contact Us</h3>
              <ul className="space-y-3">
                {contactInfo.map((item, index) => (
                  <li key={index} className="flex items-center space-x-3">
                    <span className="text-white/80">{item.icon}</span>
                    <span className="text-gray-200">{item.text}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-white/20 pb-2">Quick Links</h3>
            {renderFooterLinks(quickLinks)}
          </div>

          {/* Exam Links */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-white/20 pb-2">Our Exams</h3>
            {renderFooterLinks(examLinks)}
          </div>

          {/* Resources and Social */}
          <div>
            <h3 className="text-lg font-semibold mb-4 border-b border-white/20 pb-2">Resources</h3>
            {renderFooterLinks(resourceLinks)}
            
            {/* Social Links */}
            <div className="mt-6">
              <h3 className="text-lg font-semibold mb-4 border-b border-white/20 pb-2">Connect With Us</h3>
              <ul className="flex flex-wrap gap-4">
                {socialLinks.map((social, index) => (
                  <li key={index}>
                    <a
                      href={social.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white/80 hover:text-white transition-colors duration-200"
                      aria-label={social.label}
                    >
                      {social.icon}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>

        {/* Newsletter Subscription */}
        <div className="mt-12 border-t border-white/20 pt-8">
          <div className="max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-3 text-center">Subscribe to Our Newsletter</h3>
            <form className="flex">
              <input
                type="email"
                placeholder="Your email address"
                className="flex-1 px-4 py-2 rounded-l-lg text-gray-800 focus:outline-none"
              />
              <button
                type="submit"
                className="bg-[#4a6c38] px-4 py-2 rounded-r-lg hover:bg-[#3d5a2e] transition-colors duration-200"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        {/* Copyright */}
        <div className="border-t border-white/20 mt-10 pt-6 text-center">
          <p className="text-gray-200">
            &copy; {currentYear} Edumart CBT Nigeria Ltd. All rights reserved.
          </p>
          <p className="text-sm text-gray-300 mt-2">
            Preparing students for academic excellence and success in examinations.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;