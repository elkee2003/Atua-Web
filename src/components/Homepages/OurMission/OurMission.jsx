import React from "react";
import "./OurMission.css";

const OurMission = () => {
  return (
    <section id="mission" className="mission">
      <div className="mission-container">

        {/* HEADER */}
        <div className="mission-header">
          <span className="mission-tag">Our Mission</span>

          <h2>
            Building the future of <span>logistics</span>
          </h2>

          <p>
            At Atua, our mission goes beyond delivery. We are building a smarter,
            faster, and more reliable logistics network designed to empower
            individuals, businesses, and entire economies.
          </p>
        </div>

        {/* CORE STATEMENT */}
        <div className="mission-core">
          <p>
            To make delivery <strong>faster</strong>, <strong>safer</strong>, and{" "}
            <strong>more accessible</strong> — while creating opportunities and
            powering growth across Africa and beyond.
          </p>
        </div>

        {/* PILLARS */}
        <div className="mission-grid">

          <div className="mission-card">
            <h4>⚡ Speed & Efficiency</h4>
            <p>
              We leverage smart routing and real-time systems to ensure every
              delivery happens as fast and efficiently as possible.
            </p>
          </div>

          <div className="mission-card">
            <h4>🔒 Trust & Reliability</h4>
            <p>
              Every package matters. We are committed to secure handling,
              verified couriers, and consistent delivery performance.
            </p>
          </div>

          <div className="mission-card">
            <h4>🌍 Economic Empowerment</h4>
            <p>
              We create earning opportunities for couriers and enable businesses
              to scale through accessible logistics.
            </p>
          </div>

          <div className="mission-card highlight">
            <h4>🚀 Global Vision</h4>
            <p>
              Our goal is to build Africa’s most reliable logistics network —
              and expand it across borders to power global commerce.
            </p>
          </div>

        </div>

      </div>
    </section>
  );
};

export default OurMission;