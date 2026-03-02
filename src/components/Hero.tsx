import React, { useState, useEffect, useCallback, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const SLIDES = [
  {
    id: 1,
    image:
      "https://images.pexels.com/photos/5905492/pexels-photo-5905492.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Edumart CBT",
    subtitle: "Practice ahead for your upcoming exams.",
    tagline: "Pass in one sitting",
  },
  {
    id: 2,
    image:
      "https://images.pexels.com/photos/4144923/pexels-photo-4144923.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Smart Learning",
    subtitle: "Master your subjects with our adaptive system.",
    tagline: "Learn smarter, not harder",
  },
  {
    id: 3,
    image:
      "https://images.pexels.com/photos/5212317/pexels-photo-5212317.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Track Progress",
    subtitle: "Monitor your improvement in real-time.",
    tagline: "Success through consistency",
  },
  {
    id: 4,
    image:
      "https://images.pexels.com/photos/4145354/pexels-photo-4145354.jpeg?auto=compress&cs=tinysrgb&w=1920",
    title: "Exam Ready",
    subtitle: "Build confidence with comprehensive practice.",
    tagline: "Prepare with precision",
  },
];

const SLIDE_INTERVAL = 6000;

const Hero: React.FC = () => {
  const [current, setCurrent] = useState(0);
  const [previous, setPrevious] = useState<number | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const nextSlide = useCallback(() => {
    setPrevious(current);
    setCurrent((prev) => (prev + 1) % SLIDES.length);
  }, [current]);

  const prevSlide = useCallback(() => {
    setPrevious(current);
    setCurrent((prev) =>
      prev === 0 ? SLIDES.length - 1 : prev - 1
    );
  }, [current]);

  // Auto-slide
  useEffect(() => {
    if (isPaused) return;

    intervalRef.current = setInterval(() => {
      nextSlide();
    }, SLIDE_INTERVAL);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [nextSlide, isPaused]);

  // Preload next image
  useEffect(() => {
    const nextIndex = (current + 1) % SLIDES.length;
    const img = new Image();
    img.src = SLIDES[nextIndex].image;
  }, [current]);

  const slide = SLIDES[current];

  return (
    <section
      className="relative h-[85vh] w-full overflow-hidden"
      onMouseEnter={() => window.innerWidth > 768 && setIsPaused(true)}
      onMouseLeave={() => window.innerWidth > 768 && setIsPaused(false)}
    >
      {/* Previous Image Layer */}
      {previous !== null && (
        <img
          src={SLIDES[previous].image}
          alt=""
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-0"
          style={{ willChange: "opacity" }}
          loading="lazy"
        />
      )}

      {/* Current Image Layer */}
      <img
        src={slide.image}
        alt={slide.title}
        className="absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 opacity-100"
        style={{ willChange: "opacity" }}
        loading={current === 0 ? "eager" : "lazy"}
      />

      {/* Overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/50 to-black/60" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full text-center text-white px-6">
        <div className="max-w-3xl backdrop-blur-md bg-black/20 p-6 sm:p-10 rounded-xl shadow-xl">
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold mb-4">
            {slide.title}
          </h1>

          <p className="text-lg sm:text-xl md:text-2xl font-semibold mb-4">
            {slide.subtitle}
          </p>

          <p className="text-sm sm:text-lg text-white/90 mb-6">
            {slide.tagline}
          </p>

          <a href="/register">
            <button className="bg-[#66934e] hover:bg-[#557b41] transition-all duration-300 px-8 py-3 rounded-full font-semibold shadow-lg hover:scale-105">
              Sign Up Now
            </button>
          </a>
        </div>
      </div>

      {/* Navigation */}
      <button
        onClick={prevSlide}
        className="absolute left-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white"
        aria-label="Previous Slide"
      >
        <ChevronLeft size={24} />
      </button>

      <button
        onClick={nextSlide}
        className="absolute right-4 top-1/2 -translate-y-1/2 z-20 bg-black/40 hover:bg-black/60 p-3 rounded-full text-white"
        aria-label="Next Slide"
      >
        <ChevronRight size={24} />
      </button>

      {/* Indicators */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {SLIDES.map((_, index) => (
          <button
            key={index}
            onClick={() => {
              setPrevious(current);
              setCurrent(index);
            }}
            className={`h-3 rounded-full transition-all duration-300 ${
              index === current
                ? "bg-white w-8"
                : "bg-white/50 w-3 hover:bg-white/80"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
};

export default React.memo(Hero);