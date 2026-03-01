import React, { useRef, useState, useEffect } from 'react';
import { FaSmile, FaWifi, FaMobile, FaArrowRight } from 'react-icons/fa';
import { NavLink } from 'react-router-dom';

// Define a Feature interface for type-safety
interface Feature {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const WhyChooseUs: React.FC = () => {
  const welcomeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);
  const [welcomeVisible, setWelcomeVisible] = useState(false);
  const [featuresVisible, setFeaturesVisible] = useState(false);

  // Features data - more maintainable as a separate array
  const features: Feature[] = [
    {
      icon: <FaSmile className="text-[#66934e] text-4xl mb-4" />,
      title: "We help you to pass",
      description: "We provide you with all the explanations with the best tools that help students to pass their exams."
    },
    {
      icon: <FaWifi className="text-[#66934e] text-4xl mb-4" />,
      title: "Practice Anywhere",
      description: "You can practice the exams anywhere and anytime with our online platform."
    },
    {
      icon: <FaMobile className="text-[#66934e] text-4xl mb-4" />,
      title: "Mobile friendly",
      description: "Our platform is mobile friendly, so you can practice the exams on your mobile phone."
    }
  ];

  // Intersection observer for animation on scroll
  useEffect(() => {
    const welcomeObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setWelcomeVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    const featuresObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setFeaturesVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (welcomeRef.current) {
      welcomeObserver.observe(welcomeRef.current);
    }

    if (featuresRef.current) {
      featuresObserver.observe(featuresRef.current);
    }

    return () => {
      if (welcomeRef.current) welcomeObserver.unobserve(welcomeRef.current);
      if (featuresRef.current) featuresObserver.unobserve(featuresRef.current);
    };
  }, []);

  return (
    <section className="bg-gray-50 py-16 px-6">
      {/* Welcome Section with improved styling */}
      <div 
        ref={welcomeRef}
        className={`max-w-4xl mx-auto transition-all duration-1000 ${
          welcomeVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-[#66934e] mb-4">
            Welcome to Edumart Preexam Hall
          </h2>
          <div className="h-1 w-24 bg-[#66934e] mx-auto mb-10"></div>
          
          <div className="bg-white rounded-lg shadow-lg p-8">
            <p className="text-gray-700 text-base md:text-lg max-w-full mx-auto leading-relaxed">
              Welcome to Edumart Preexam Hall, where we redefine exam preparation with a powerful blend of innovation and expertise. As a leading educational organization, we are committed to helping students excel in a wide range of examinations, including{" "}
              <span className="font-semibold text-[#66934e]">
                WAEC, GCE, NECO, JAMB, POST UTME, JUNIOR WAEC, COMMON ENTRANCE, and various professional exams
              </span>
              .
            </p>
            
            <p className="mt-4 text-gray-700 text-base md:text-lg">
              Our approach is built on three pillars: a proven track record of success, deep educational expertise, and the strategic use of cutting-edge technology. Through our training programs, we empower students with the knowledge, skills, and confidence they need to achieve outstanding results.
            </p>
            
            <p className="mt-4 text-center text-[#66934e] font-semibold text-lg">
              Join us and unlock your full potential on your journey to academic success!
            </p>
          </div>
          
          <NavLink to="/login">
            <button className="group mt-8 bg-[#66934e] text-white font-semibold px-8 py-4 rounded-lg hover:bg-[#557b41] transition-all duration-300 transform hover:scale-105 shadow-lg flex items-center mx-auto">
              Get Started Now
              <FaArrowRight className="ml-2 group-hover:translate-x-1 transition-transform duration-300" />
            </button>
          </NavLink>
        </div>
      </div>

      <div className="max-w-6xl mx-auto">
        <hr className="border-b-1 border-[#66934e]/20 mt-8 mb-16" />
      </div>

      {/* Why Choose Us Heading */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-[#66934e]">Why Choose Us</h2>
        <div className="h-1 w-24 bg-[#66934e] mx-auto mt-4"></div>
      </div>

      {/* Features Container with animation */}
      <div 
        ref={featuresRef}
        className="max-w-6xl mx-auto"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className={`bg-white p-8 rounded-lg shadow-lg hover:shadow-xl transition-all duration-500 text-center hover:transform hover:-translate-y-2 ${
                featuresVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
              }`}
              style={{ transitionDelay: `${index * 150}ms` }}
            >
              <div className="bg-[#f1f5ee] p-4 rounded-full inline-block mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">{feature.title}</h3>
              <p className="text-gray-600">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default WhyChooseUs;