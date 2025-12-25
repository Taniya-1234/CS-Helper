import React from "react";

const HeroSection = ({ darkMode }) => {
  // Text color changes dynamically
  const textClass = darkMode ? "text-light" : "text-dark";

  return (
    <section>
      <div className="container">
        <div className={`text-center py-5 ${textClass}`}>
          {/* Hero Heading */}
          <h1 className="display-4 fw-bold mb-4">
            Your CS Questions, Solved Instantly
          </h1>

          {/* Hero Description */}
          <p className="lead mb-4">
            Upload any computer science question and get instant solutions,
            detailed explanations, or comprehensive notes. Learning made simple
            and effective.
          </p>
        </div>

        <div className="bg-red-500 text-white p-4">Tailwind Test</div>
      </div>
    </section>
  );
};

export default HeroSection;
