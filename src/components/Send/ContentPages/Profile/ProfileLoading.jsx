import React from "react";
import "./Profile.css";

const ProfileLoading = () => {
  return (
    <div className="profileLoading-container">
      {/* HEADER */}
      <div className="profileLoading-header shimmer" />

      {/* CONTENT */}
      <div className="profileLoading-content">
        {/* AVATAR */}
        <div className="profileLoading-avatar shimmer" />

        {/* NAME */}
        <div className="profileLoading-name shimmer" />

        {/* INFO CARD */}
        <div className="profileLoading-card">
          <div className="profileLoading-row shimmer" />
          <div className="profileLoading-row shimmer" />
        </div>

        {/* BUTTONS */}
        <div className="profileLoading-btn shimmer" />
        <div className="profileLoading-btn outline shimmer" />
      </div>
    </div>
  );
};

export default ProfileLoading;