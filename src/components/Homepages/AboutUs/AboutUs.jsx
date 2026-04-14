import React, { useState, useEffect, useMemo } from "react";
import "./AboutUs.css";

const AboutUs = () => {
  const [currentImage, setCurrentImage] = useState(0);

  const images = useMemo(
    () => ["/image1.jpeg", "/image2.png"],
    []
  );

  // Preload images
  useEffect(() => {
    images.forEach((src) => {
      const img = new Image();
      img.src = src;
    });
  }, [images]);

  // Slider
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section id="aboutUs" className="about">
      <div className="about-container">

        {/* HEADER */}
        <div className="about-header">
          <span className="about-tag">About Atua</span>

          <h2>
            Powering the future of <span>delivery</span>
          </h2>

          <p>
            Atua is redefining logistics across Africa and beyond — connecting people, 
            businesses, and couriers through a fast, reliable, and intelligent delivery network.
          </p>
        </div>

        {/* MAIN CONTENT */}
        <div className="about-grid">

          {/* IMAGE SIDE */}
          <div
            className="about-image"
            style={{
              backgroundImage: `url(${images[currentImage]})`,
            }}
          />

          {/* TEXT SIDE */}
          <div className="about-content">

            <div className="about-item">
              <h4>⚡ Speed & Efficiency</h4>
              <p>
                From instant dispatch to optimized routing, Atua ensures your deliveries 
                move faster than traditional logistics systems.
              </p>
            </div>

            <div className="about-item">
              <h4>🔒 Secure & Reliable</h4>
              <p>
                Every delivery is backed by a trusted network of verified couriers and 
                secure payment systems.
              </p>
            </div>

            <div className="about-item">
              <h4>🌍 Built for Scale</h4>
              <p>
                Whether it’s a single package or enterprise logistics, Atua is designed 
                to scale across cities, countries, and continents.
              </p>
            </div>

          </div>
        </div>

        {/* METRICS (adds credibility) */}
        {/* <div className="about-stats">
          <div>
            <h3>10K+</h3>
            <p>Deliveries Completed</p>
          </div>

          <div>
            <h3>500+</h3>
            <p>Active Couriers</p>
          </div>

          <div>
            <h3>99%</h3>
            <p>On-time Rate</p>
          </div>

          <div>
            <h3>24/7</h3>
            <p>Support</p>
          </div>
        </div> */}

      </div>
    </section>
  );
};

export default AboutUs;