import React from "react";
import aboutimg from "../assets/images/aboutimg.jpg";

const AboutPage: React.FC = () => {
  // Features list for better maintenance
  const features = [
    "Pass your JAMB, WAEC, NECO, and GCE in one sitting.",
    "Well-explained solutions with clear illustrations.",
    "Diagrams, tables, and graphs included for visual learners.",
    "Access over 10,000 offline past exam questions with detailed solutions.",
    "Standard calculators for JAMB CBT, WAEC, and NECO.",
    "Realistic JAMB CBT simulation environment.",
    "Extensive subjects and multiple years of past questions.",
    "Latest news about examinations and your preferred institutions.",
    "Visual explanations of complex concepts."
  ];
  
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-12">About Edumart</h1>
        
        <div className="bg-white shadow-lg rounded-xl overflow-hidden">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            <div className="md:w-1/2 relative">
              <img
                src={aboutimg}
                alt="Edumart Learning Platform"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent flex items-end p-6">
                <div className="bg-[#66934e] text-white px-6 py-3 rounded-lg shadow-lg text-center font-medium">
                  🚀 Our Mobile App Coming Soon!
                </div>
              </div>
            </div>
            
            {/* Content Section */}
            <div className="md:w-1/2 p-8">
              <div className="mb-6">
                <h2 className="text-3xl font-bold text-gray-800 mb-4">What is Edumart?</h2>
                <p className="text-gray-700 text-lg leading-relaxed">
                  Edumart is a comprehensive examination preparation platform that helps students 
                  excel in JAMB, WAEC, NECO, and GCE exams to pass in one sitting with excellent grades.
                </p>
              </div>
              
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 mb-4 flex items-center">
                  <span className="text-[#66934e] mr-2">✓</span> Why Choose Edumart?
                </h3>
                
                <ul className="space-y-3">
                  {features.map((feature, index) => (
                    <li key={index} className="flex items-start">
                      <span className="text-[#66934e] font-bold mr-2">•</span>
                      <span className="text-gray-700">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="mt-8 bg-[#f8faf5] border-l-4 border-[#66934e] p-4 rounded">
                <p className="text-gray-700 italic">
                  "Practicing properly with the Edumart CBT app ensures you pass with
                  good grades in your JAMB, NECO, WAEC (SSCE/GCE) exams."
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Additional Testimonial or CTA section could go here */}
      </div>
    </div>
  );
};

export default AboutPage;