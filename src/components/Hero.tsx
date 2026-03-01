import React, { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

// Slide configuration - easily manageable
const SLIDES = [
  {
    id: 1,
    image: "https://images.pexels.com/photos/5905492/pexels-photo-5905492.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Edumart CBT",
    subtitle: "Practice ahead for your upcoming exams.",
    tagline: "Pass in one sitting"
  },
  {
    id: 2,
    image: "https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Smart Learning",
    subtitle: "Master your subjects with our adaptive system.",
    tagline: "Learn smarter, not harder"
  },
  {
    id: 3,
    image: "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Track Progress",
    subtitle: "Monitor your improvement in real-time.",
    tagline: "Success through consistency"
  },
  {
    id: 4,
    image: "https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Exam Ready",
    subtitle: "Build confidence with comprehensive practice.",
    tagline: "Prepare with precision"
  }
];

const SLIDE_INTERVAL = 5000; // 5 seconds per slide
const TYPING_SPEED = 50;

const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [titleIndex, setTitleIndex] = useState(0);
  const [subtitleIndex, setSubtitleIndex] = useState(0);
  const [taglineIndex, setTaglineIndex] = useState(0);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [showTagline, setShowTagline] = useState(false);
  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const slide = SLIDES[currentSlide];

  // Reset animations when slide changes
  useEffect(() => {
    setTitleIndex(0);
    setSubtitleIndex(0);
    setTaglineIndex(0);
    setShowSubtitle(false);
    setShowTagline(false);
    setIsImageLoaded(false);
    
    // Preload current image
    const img = new Image();
    img.src = slide.image;
    img.onload = () => setIsImageLoaded(true);
  }, [currentSlide, slide.image]);

  // Typing animation for title
  useEffect(() => {
    if (titleIndex < slide.title.length) {
      const timer = setTimeout(() => {
        setTitleIndex(titleIndex + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    } else {
      setShowSubtitle(true);
    }
  }, [titleIndex, slide.title]);

  // Typing animation for subtitle
  useEffect(() => {
    if (showSubtitle && subtitleIndex < slide.subtitle.length) {
      const timer = setTimeout(() => {
        setSubtitleIndex(subtitleIndex + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    } else if (showSubtitle && subtitleIndex === slide.subtitle.length) {
      setShowTagline(true);
    }
  }, [showSubtitle, subtitleIndex, slide.subtitle]);

  // Typing animation for tagline
  useEffect(() => {
    if (showTagline && taglineIndex < slide.tagline.length) {
      const timer = setTimeout(() => {
        setTaglineIndex(taglineIndex + 1);
      }, TYPING_SPEED);
      return () => clearTimeout(timer);
    }
  }, [showTagline, taglineIndex, slide.tagline]);

  // Navigate to next slide
  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev + 1) % SLIDES.length);
  }, []);

  // Navigate to previous slide
  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => (prev - 1 + SLIDES.length) % SLIDES.length);
  }, []);

  // Go to specific slide
  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  // Auto-advance slides
  useEffect(() => {
    if (!isPaused) {
      const timer = setInterval(nextSlide, SLIDE_INTERVAL);
      return () => clearInterval(timer);
    }
  }, [nextSlide, isPaused]);

  return (
    <section
      className={`relative h-[85vh] flex items-center justify-center bg-cover bg-center transition-opacity duration-700 ${
        isImageLoaded ? "opacity-100" : "opacity-0"
      }`}
      style={{ backgroundImage: `url(${slide.image})` }}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#1e2a17]/40 via-[#a4b394]/50 to-[#1e2a17]/60"></div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
        aria-label="Previous slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/30 hover:bg-black/50 text-white p-3 rounded-full transition-all duration-300 backdrop-blur-sm"
        aria-label="Next slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Content container */}
      <div className="relative z-10 text-center text-white p-6 max-w-3xl mx-auto">
        <div className="backdrop-blur-sm bg-black/10 p-8 rounded-xl shadow-2xl">
          <h1 className="text-3xl md:text-6xl font-bold mb-6 text-white drop-shadow-lg min-h-[4rem] flex items-center justify-center">
            {slide.title.substring(0, titleIndex)}
            {titleIndex < slide.title.length && <span className="animate-pulse">|</span>}
          </h1>

          {showSubtitle && (
            <p className="text-xl md:text-2xl font-bold mb-6 drop-shadow-md min-h-[3rem] flex items-center justify-center">
              {slide.subtitle.substring(0, subtitleIndex)}
              {subtitleIndex < slide.subtitle.length && <span className="animate-pulse">|</span>}
            </p>
          )}

          {showTagline && (
            <h6 className="text-lg sm:text-xl font-bold text-white/90 drop-shadow-md min-h-[2rem] flex items-center justify-center">
              {slide.tagline.substring(0, taglineIndex)}
              {taglineIndex < slide.tagline.length && <span className="animate-pulse">|</span>}
            </h6>
          )}

          <a href="/register">
            <button className="bg-[#66934e] hover:bg-[#557b41] rounded-full text-white px-8 py-4 mt-8 font-semibold transition-all duration-300 transform hover:scale-105 shadow-lg">
              Sign Up Now
            </button>
          </a>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex gap-3">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === currentSlide
                ? "bg-white w-8"
                : "bg-white/50 hover:bg-white/75"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default Hero;