import React from 'react';
import '../styles/HeroSection.css';
import heroImage from "../assets/heroimage.png";


function HeroSection() {
  return (
    <section className="hero-section text-white text-center py-5">
      <div className="container">
        <h1 className="display-4 fw-bold">
          TRANSFORM YOUR <span className="highlight-orange">TAX</span> PRACTICE
        </h1>
        <p className="lead mt-3">
          The all-in-one platform with AI-powered tools to streamline client management, automate workflows,<br />
          and scale your practice.
        </p>

        <div className="d-flex justify-content-center gap-3 mt-4">
          <button className="btn btn-light px-4 py-2 fw-semibold">Request Demo</button>
          <button className="btn take-tour-btn px-4 py-2 fw-semibold">Take a Tour</button>
        </div>

        <div className="video-preview mt-5">
          <img
            src="/images/hero-video-preview.jpg"
            alt="Video Preview"
            className="img-fluid rounded video-image"
          />
          <div className="play-button">
            <i className="bi bi-play-circle-fill"></i>
          </div>
        </div>



        <p className="trusted-text mt-5">
          <span className="text-orange fw-bold">Trusted</span> by leading tax firms worldwide
        </p>

        <div className="d-flex flex-wrap justify-content-center align-items-center gap-4 mt-3 logos">
          <img src="/images/logos/accurrant.png" alt="Accurrant" />
          <img src="/images/logos/foundation.png" alt="Foundation" />
          <img src="/images/logos/padgett.png" alt="Padgett" />
          <img src="/images/logos/fintrix.png" alt="AG Fintrix" />
          <img src="/images/logos/trowbridge.png" alt="Trowbridge" />
          <img src="/images/logos/truebooks.png" alt="Truebooks" />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
