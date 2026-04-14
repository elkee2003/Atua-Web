import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./Hero.css";

const Hero = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);

  const images = useMemo(
    () => ["/image1.jpeg", "/image2.png"],
    []
  );

  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section
      className="hero"
      style={{ backgroundImage: `url(${images[index]})` }}
    >
      <div className="hero-overlay" />

      <div className="hero-container">
        {/* LEFT */}
        <div className="hero-text">
          <p className="hero-tag">Logistics made simple</p>

          <h1>
            Deliver <span>Anything</span> <br />
            Across <span>Any City</span>
          </h1>

          <p className="hero-subtext">
            Fast, reliable and secure delivery at your fingertips.
            From small packages to bulk shipments — we move it all.
          </p>

          <div className="hero-actions">
            <button
              className="btn-primary"
              onClick={() => navigate("/send/home")}
            >
              Send a Package →
            </button>
          </div>
        </div>

        {/* RIGHT CARD */}
        <div className="hero-card">
          <h3>Start in seconds</h3>

          <div className="step">
            <span>📍</span>
            <p>Set pickup & destination</p>
          </div>

          <div className="step">
            <span>🚚</span>
            <p>Select delivery option</p>
          </div>

          <div className="step">
            <span>💳</span>
            <p>Checkout securely</p>
          </div>

          <button
            className="card-btn"
            onClick={() => navigate("/send/home")}
          >
            Continue →
          </button>
        </div>
      </div>
    </section>
  );
};

export default Hero;