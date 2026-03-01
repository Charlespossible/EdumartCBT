import React, { useState, useEffect, useContext, useCallback } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import EdumartLogo from "../assets/images/EdumartLogo.png";
import { AuthContext } from "../context/AuthContext";

// Type definition for navigation items
interface NavItem {
  name: string;
  path: string;
  disabled?: boolean;
  highlight?: boolean;
}

const Navbar: React.FC = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [userFirstName, setUserFirstName] = useState("");
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const authContext = useContext(AuthContext);

  if (!authContext) {
    throw new Error("Navbar must be used within an AuthProvider");
  }

  const { user, logout } = authContext;

  // Main navigation items
  const navItems: NavItem[] = [
    { name: "Home", path: "/" },
    { name: "Common Entrance", path: "/commonentrance" },
    { name: "JAMB/POST-UTME", path: "/uexam" },
    { name: "WAEC/NECO", path: "/olevel" },
    { name: "Junior WAEC", path: "/Jwaec" },
    { name: "Professional Exams", path: "/proffesionalexams" },
    { name: "Blog", path: "https://blog.edumartcbt.com" },
    { name: "For Schools", path: "/schools", highlight: true },
  ];

  // Memoize user data retrieval
  useEffect(() => {
    const getUserData = () => {
      const userData = localStorage.getItem("user");
      
      if (userData && userData !== "undefined") { 
        try {
          const parsedUser = JSON.parse(userData);
          setUserFirstName(parsedUser.firstName || "User");
          setIsLoggedIn(true);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          setIsLoggedIn(false);
          setUserFirstName("");
        }
      } else {
        setIsLoggedIn(false);
        setUserFirstName("");
      }
    };
  
    getUserData();
  }, [user]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setIsUserMenuOpen(false);
    };

    setIsMenuOpen(false);

    document.addEventListener("click", handleClickOutside);
    return () => {
      document.removeEventListener("click", handleClickOutside);
    };
  }, [location.pathname]);

  const handleLogout = useCallback(async () => {
    try {
      await logout();
      setIsUserMenuOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  }, [logout, navigate]);

  const handleUserMenuToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsUserMenuOpen(!isUserMenuOpen);
  };

  return (
    <nav className="bg-[#66934e] shadow-md sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0">
            <NavLink to="/" className="flex items-center">
              <img
                src={EdumartLogo}
                alt="Edumart Logo"
                className="h-10 w-auto object-contain"
              />
            </NavLink>
          </div>

          {/* Desktop Menu - Adjusted spacing and text size */}
          <div className="hidden lg:flex space-x-3 xl:space-x-5 items-center">
            {navItems.map((item) => (
              item.path.startsWith("http") ? (
                <a
                  key={item.path}
                  href={item.path}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`text-sm xl:text-base font-medium text-white transition-colors duration-200 hover:text-gray-200 whitespace-nowrap ${
                    item.highlight
                      ? "bg-yellow-400 text-[#557a40] px-3 py-1.5 rounded-xl font-bold hover:bg-yellow-300 hover:text-[#557a40] shadow-md transform hover:-translate-y-1 transition-all"
                      : ""
                  }`}
                >
                  {item.name}
                </a>
              ) : (
                <NavLink
                  key={item.path}
                  to={item.disabled ? "#" : item.path}
                  onClick={(e) => item.disabled && e.preventDefault()}
                  className={({ isActive }) =>
                    `text-sm xl:text-base font-medium text-white transition-colors duration-200 hover:text-gray-200 whitespace-nowrap ${
                      isActive ? "border-b-2 border-white pb-1" : ""
                    } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${
                      item.highlight
                        ? "bg-yellow-400 text-[#557a40] px-3 py-1.5 rounded-xl font-bold hover:bg-yellow-300 hover:text-[#557a40] shadow-md transform hover:-translate-y-1 transition-all"
                        : ""
                    }`
                  }
                  aria-disabled={item.disabled}
                >
                  {item.name}
                </NavLink>
              )
            ))}

            {/* User section */}
            {isLoggedIn ? (
              <div className="relative ml-2" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={handleUserMenuToggle}
                  className="flex items-center space-x-2 text-white focus:outline-none"
                  aria-expanded={isUserMenuOpen}
                  aria-haspopup="true"
                >
                  <div className="h-8 w-8 rounded-full bg-white text-[#66934e] flex items-center justify-center font-semibold">
                    {userFirstName.charAt(0).toUpperCase()}
                  </div>
                  <span className="font-medium hidden xl:block text-sm">{userFirstName}</span>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className={`h-4 w-4 transition-transform duration-200 ${isUserMenuOpen ? "rotate-180" : ""}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
                    <div className="py-1">
                      <NavLink
                        to="/dashboard"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Dashboard
                      </NavLink>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate("/login")}
                className="bg-white text-[#66934e] text-sm xl:text-base font-semibold px-4 xl:px-6 py-2 rounded-lg hover:bg-gray-100 transition duration-300 whitespace-nowrap"
              >
                Get Started
              </button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="lg:hidden">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="text-white focus:outline-none"
              aria-expanded={isMenuOpen}
            >
              {isMenuOpen ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="lg:hidden bg-[#66934e] py-4 divide-y divide-white/10">
            <div className="flex flex-col space-y-3 pb-4">
              {navItems.map((item) =>
                item.path.startsWith("http") ? (
                  <a
                    key={item.path}
                    href={item.path}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => setIsMenuOpen(false)}
                    className={`px-4 py-2 font-medium text-white hover:bg-[#557a40] rounded-md transition-colors ${
                      item.highlight
                        ? "bg-yellow-400 text-[#557a40] mx-4 my-2 rounded-xl font-bold shadow-md flex justify-center hover:bg-yellow-300"
                        : ""
                    }`}
                  >
                    {item.name}
                  </a>
                ) : (
                  <NavLink
                    key={item.path}
                    to={item.disabled ? "#" : item.path}
                    onClick={(e) => {
                      if (item.disabled) e.preventDefault();
                      else setIsMenuOpen(false);
                    }}
                    className={({ isActive }) =>
                      `px-4 py-2 font-medium text-white hover:bg-[#557a40] rounded-md transition-colors ${
                        isActive ? "bg-[#557a40]" : ""
                      } ${item.disabled ? "opacity-60 cursor-not-allowed" : ""} ${
                        item.highlight
                          ? "bg-yellow-400 text-[#557a40] mx-4 my-2 rounded-xl font-bold shadow-md flex justify-center hover:bg-yellow-300"
                          : ""
                      }`
                    }
                  >
                    {item.name}
                  </NavLink>
                )
              )}
            </div>

            {/* Mobile user section */}
            <div className="pt-4 px-4">
              {isLoggedIn ? (
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 rounded-full bg-white text-[#66934e] flex items-center justify-center font-semibold text-lg">
                      {userFirstName.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-white font-medium">{userFirstName}</span>
                  </div>
                  <NavLink
                    to="/dashboard"
                    onClick={() => setIsMenuOpen(false)}
                    className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors"
                  >
                    Dashboard
                  </NavLink>
                  <button
                    onClick={handleLogout}
                    className="px-4 py-2 bg-white/10 text-white rounded-md hover:bg-white/20 transition-colors text-left"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => {
                    navigate("/login");
                    setIsMenuOpen(false);
                  }}
                  className="w-full bg-white text-[#66934e] font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition duration-300"
                >
                  Get Started
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navbar;