import React, { useRef, useState, useEffect } from "react";
import type { Testimonial } from "../types/testimonial";

interface TestimonialProps {
  testimonials: Testimonial[];
}

const Testimonials: React.FC<TestimonialProps> = ({ testimonials }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const testimonialsRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile and set up resize listener
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkIfMobile();
    
    // Add event listener for window resize
    window.addEventListener('resize', checkIfMobile);
    
    // Clean up
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  // Handle auto-scrolling through testimonials on larger screens
  useEffect(() => {
    // Only auto-scroll if not on mobile
    if (!isMobile) {
      const interval = setInterval(() => {
        setActiveIndex((prevIndex) => 
          prevIndex === testimonials.length - 1 ? 0 : prevIndex + 1
        );
      }, 5000);
      
      return () => clearInterval(interval);
    }
  }, [testimonials.length, isMobile]);

  // Add intersection observer for animation on scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (testimonialsRef.current) {
      observer.observe(testimonialsRef.current);
    }

    return () => {
      if (testimonialsRef.current) {
        observer.unobserve(testimonialsRef.current);
      }
    };
  }, []);

  return (
    <div className="bg-gray-50 py-16 px-4 sm:px-6 lg:px-8" ref={testimonialsRef}>
      <div 
        className={`max-w-7xl mx-auto text-center transition-all duration-1000 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
        }`}
      >
        <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
          What Our Users Say
        </h2>
        <div className="mt-3 mx-auto w-24 h-1 bg-[#66934e]"></div>
        <p className="mt-4 text-lg text-gray-600">
          Students, teachers and parents have good things to say about Edumart.
        </p>
      </div>

      {/* Desktop view: Grid layout */}
      <div className={`${isMobile ? 'hidden' : 'hidden md:grid'} mt-12 grid-cols-1 lg:grid-cols-3 gap-8 max-w-7xl mx-auto`}>
        {testimonials.map((testimonial, index) => (
          <div
            key={testimonial.id}
            className={`bg-white p-8 rounded-lg shadow-lg text-center transform transition-all duration-500 ${
              isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
            }`}
            style={{ transitionDelay: `${index * 150}ms` }}
          >
            <div className="relative">
              <img
                className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-[#66934e]"
                src={testimonial.image}
                alt={testimonial.name}
                loading="lazy"
              />
              <div className="absolute -bottom-2 -right-2 bg-[#66934e] text-white p-1 rounded-full">
                "
              </div>
            </div>
            <h3 className="mt-4 text-xl font-semibold text-gray-900">
              {testimonial.name}
            </h3>
            <p className="text-sm text-[#66934e] font-medium">{testimonial.role}</p>
            <p className="mt-4 text-gray-600 italic">
              "{testimonial.message}"
            </p>
          </div>
        ))}
      </div>

      {/* Mobile view: Carousel */}
      <div className={`${isMobile ? 'block' : 'md:hidden'} mt-12 max-w-md mx-auto`}>
        <div 
          className="bg-white p-6 rounded-lg shadow-lg text-center transition-all duration-500"
        >
          <div className="relative">
            <img
              className="mx-auto h-20 w-20 rounded-full object-cover border-4 border-[#66934e]"
              src={testimonials[activeIndex].image}
              alt={testimonials[activeIndex].name}
              loading="lazy"
            />
            <div className="absolute -bottom-2 -right-2 bg-[#66934e] text-white p-1 rounded-full">
              "
            </div>
          </div>
          <h3 className="mt-4 text-xl font-semibold text-gray-900">
            {testimonials[activeIndex].name}
          </h3>
          <p className="text-sm text-[#66934e] font-medium">{testimonials[activeIndex].role}</p>
          <p className="mt-4 text-gray-600 italic">
            "{testimonials[activeIndex].message}"
          </p>
        </div>
        
        {/* Pagination dots */}
        <div className="flex justify-center mt-6 space-x-2">
          {testimonials.map((_, index) => (
            <button
              key={index}
              className={`w-3 h-3 rounded-full ${
                activeIndex === index ? "bg-[#66934e]" : "bg-gray-300"
              }`}
              onClick={() => setActiveIndex(index)}
              aria-label={`View testimonial ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default Testimonials;