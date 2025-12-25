import React, { useState } from "react";
import { Moon, Sun } from "lucide-react";

const Navbar = ({ onNavigate }) => {
  const [isDark, setIsDark] = useState(false);

  const toggleTheme = () => {
    const newTheme = !isDark;      // FIX 1: use the new state
    setIsDark(newTheme);

    // FIX 2: apply correct theme to body
    document.body.dataset.bsTheme = newTheme ? "dark" : "light";
  };

  return (
    <nav
      className="navbar navbar-expand-lg navbar-dark shadow-sm fixed-top"
      style={{ backgroundColor: "#4338CA" }} // Deep Indigo
    >
      <div className="container">
        
        {/* Brand */}
        <a className="navbar-brand d-flex align-items-center" href="home">
          <img
            src="/logo_final.png"
            alt="logo"
            style={{
              width: "38px",
              height: "38px",
              marginRight: "10px",
              borderRadius: "6px",
            }}
          />
          <span className="fw-bold fs-5">CS Helper</span>
        </a>

        {/* Mobile-toggler */}
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navContent"
          aria-controls="navContent"
        >
          <span className="navbar-toggler-icon"></span>
        </button>

        {/* Menu */}
        <div className="collapse navbar-collapse" id="navContent">
          <ul className="navbar-nav ms-auto mb-2 mb-lg-0">

            <li className="nav-item me-3">
              <button
                className="nav-link text-white bg-transparent border-0"
                onClick={() => onNavigate("about")}
              >
                About
              </button>
            </li>

            <li className="nav-item me-3">
              <button
                className="nav-link text-white bg-transparent border-0"
                onClick={() => onNavigate("contact")}
              >
                Contact
              </button>
            </li>

            {/* Theme Switcher */}
            <li className="nav-item d-flex align-items-center">
              <span
                onClick={toggleTheme}
                className="text-white d-flex align-items-center"
                style={{ cursor: "pointer" }}
              >
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </span>
            </li>

          </ul>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
