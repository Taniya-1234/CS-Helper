import React from "react";

const AboutPage = () => {
  return (
    <div className="container py-5" style={{ paddingTop: "7rem" }}>
      {/* Page Heading */}
      <div className="text-center mb-5">
        <h1 className="display-5 fw-bold text-dark dark-mode-light">
          About CSHelper
        </h1>
        <p className="lead text-secondary dark-mode-muted">
          Your AI-powered computer science learning companion.
        </p>
      </div>

      {/* What is CSHelper */}
      <section className="mb-5">
        <h2 className="fw-bold mb-3 text-dark dark-mode-text">
          What is CSHelper?
        </h2>
        <p className="text-secondary dark-mode-muted fs-5">
          CSHelper is an intelligent computer science learning platform designed
          to help students understand concepts quickly. Upload a question image
          and instantly receive an accurate, step-by-step solution.
        </p>
      </section>

      {/* How It Works */}
      <section className="mb-5">
        <h2 className="fw-bold mb-4 text-dark dark-mode-text">
          How It Works
        </h2>

        <div className="row gy-4">
          {/* Step 1 */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100 dark-mode-card">
              <div className="card-body">
                <h5 className="card-title fw-bold text-primary">
                  1. Upload Your Question
                </h5>
                <p className="card-text text-secondary dark-mode-muted">
                  Upload an image of your CS question. Supported formats: JPG,
                  PNG, JPEG.
                </p>
              </div>
            </div>
          </div>

          {/* Step 2 */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100 dark-mode-card">
              <div className="card-body">
                <h5 className="card-title fw-bold text-primary">
                  2. Choose Your Mode
                </h5>
                <p className="card-text text-secondary dark-mode-muted">
                  Select: direct answer, concept explanation, or downloadable
                  study notes.
                </p>
              </div>
            </div>
          </div>

          {/* Step 3 */}
          <div className="col-md-4">
            <div className="card shadow-sm border-0 h-100 dark-mode-card">
              <div className="card-body">
                <h5 className="card-title fw-bold text-primary">
                  3. Get Detailed Solutions
                </h5>
                <p className="card-text text-secondary dark-mode-muted">
                  Receive instant, accurate, and well-explained solutions based
                  on your preferred learning style.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="mb-5">
        <h2 className="fw-bold mb-3 text-dark dark-mode-text">Features</h2>
        <ul className="list-group list-group-flush shadow-sm rounded dark-mode-list">
          <li className="list-group-item dark-mode-list-item">
            Instant solutions to CS questions
          </li>
          <li className="list-group-item dark-mode-list-item">
            Detailed concept explanations
          </li>
          <li className="list-group-item dark-mode-list-item">
            Downloadable topic notes
          </li>
          <li className="list-group-item dark-mode-list-item">
            Covers various CS subjects
          </li>
          <li className="list-group-item dark-mode-list-item">
            Simple and user-friendly interface
          </li>
        </ul>
      </section>

      {/* Mission */}
      <section className="mt-5">
        <h2 className="fw-bold mb-3 text-dark dark-mode-text">Our Mission</h2>
        <p className="text-secondary dark-mode-muted fs-5">
          We believe every student deserves access to high-quality computer
          science learning. CSHelper bridges the gap between confusion and
          clarity by offering clean, accurate solutions and conceptual
          understanding — instantly.
        </p>
      </section>
    </div>
  );
};

export default AboutPage;
