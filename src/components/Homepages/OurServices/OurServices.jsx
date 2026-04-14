import React, { useState, useEffect, useMemo } from "react";
import "./OurServices.css";

const OurServices = () => {
  const [currentImage, setCurrentImage] = useState(0);

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
      setCurrentImage((prev) => (prev + 1) % images.length);
    }, 6000);

    return () => clearInterval(interval);
  }, [images.length]);

  return (
    <section id="services" className="services">
      <div className="services-container">

        {/* HEADER */}
        <div className="services-header">
          <span className="services-tag">Our Services</span>

          <h2>
            Delivery solutions for <span>every need</span>
          </h2>

          <p>
            Whether you need speed, affordability, or scale — Atua offers flexible
            delivery options designed to move anything, anywhere.
          </p>
        </div>

        {/* IMAGE */}
        <div
          className="services-image"
          style={{ backgroundImage: `url(${images[currentImage]})` }}
        />

        {/* SERVICES GRID */}
        <div className="services-grid">

          <div className="service-card">
            <h4>⚡ Micro Express</h4>
            <p>
              Fast and affordable delivery for small packages using bikes,
              scooters, or foot couriers.
            </p>
          </div>

          <div className="service-card">
            <h4>🚚 Moto Express</h4>
            <p>
              Immediate delivery using motorcycles and cars for medium-sized
              packages.
            </p>
          </div>

          <div className="service-card">
            <h4>📦 Micro Batch</h4>
            <p>
              Budget-friendly delivery where your parcel is grouped with others using bikes,
              scooters, or foot couriers..
              Ideal for flexible timing.
            </p>
          </div>

          <div className="service-card">
            <h4>📦 Moto Batch</h4>
            <p>
              Affordable grouped delivery for medium packages using motorcycles and cars. Save more while
              staying efficient.
            </p>
          </div>

          <div className="service-card highlight">
            <h4>🏗 Bulk & Heavy Loads</h4>
            <p>
              Move large shipments with vans, trucks, and specialized vehicles
              built for scale.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default OurServices;