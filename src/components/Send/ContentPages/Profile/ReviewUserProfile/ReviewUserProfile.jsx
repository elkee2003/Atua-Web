import React from "react";
import { useNavigate } from "react-router-dom";
import {
  FaArrowLeft,
  FaEdit,
  FaUser,
  FaPhone,
  FaCheckCircle,
} from "react-icons/fa";

import { useProfileContext } from "../../../../../../Providers/ClientProvider/ProfileProvider";
import "./ReviewUserProfile.css";

const ReviewUser = () => {
  const navigate = useNavigate();

  const {
    firstName,
    lastName,
    profilePic,
    exactAddress,
    address,
    phoneNumber,
  } = useProfileContext();

  return (
    <div className="reviewUserCom-container">
      {/* ================= HEADER ================= */}
      <header className="reviewUserCom-header">
        <button
          type="button"
          className="reviewUserCom-headerIconButton"
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FaArrowLeft />
        </button>

        <div className="reviewUserCom-headerCenter">
          <h1 className="reviewUserCom-title">Profile Review</h1>
          <p className="reviewUserCom-headerSubtitle">
            Review your profile information
          </p>
        </div>

        <button
          type="button"
          className="reviewUserCom-headerIconButton"
          onClick={() => navigate("/send/edit_profile")}
          aria-label="Edit profile"
        >
          <FaEdit />
        </button>
      </header>

      {/* ================= CONTENT ================= */}
      <main className="reviewUserCom-content">
        {/* PROFILE HERO */}
        <section className="reviewUserCom-photoCard">
          <div className="reviewUserCom-photoCardBody">
            <div className="reviewUserCom-reviewProfilePicContainer">
              {profilePic ? (
                <img
                  src={profilePic}
                  alt="Profile"
                  className="reviewUserCom-img"
                />
              ) : (
                <div className="reviewUserCom-reviewPlaceholder">
                  <div className="reviewUserCom-reviewPlaceholderIcon">
                    <FaUser className="reviewUserCom-reviewPlaceholderGlyph" />
                  </div>
                </div>
              )}
            </div>

            <div className="reviewUserCom-photoCardHeader">
              <h2 className="reviewUserCom-photoCardTitle">
                {[firstName, lastName].filter(Boolean).join(" ") ||
                  "Your Profile"}
              </h2>
            </div>
          </div>
        </section>

        {/* CONTACT SECTION */}
        <section className="reviewUserCom-infoCard">
          <div className="reviewUserCom-cardHeader">
            <div className="reviewUserCom-cardHeaderIcon">
              <FaPhone className="reviewUserCom-cardHeaderIconGlyph" />
            </div>

            <div>
              <h2 className="reviewUserCom-cardTitle">Contact Information</h2>
              <p className="reviewUserCom-cardSubtitle">Your contact details</p>
            </div>
          </div>

          <div className="reviewUserCom-infoList">
            <div className="reviewUserCom-infoRow reviewUserCom-infoRowLast">
              <div className="reviewUserCom-infoIconContainer">
                <FaPhone className="reviewUserCom-infoIcon" />
              </div>

              <div className="reviewUserCom-infoContent">
                <span className="reviewUserCom-infoLabel">Phone Number</span>
                <p className="reviewUserCom-infoValue">
                  {phoneNumber || "Not provided"}
                </p>
              </div>

              {phoneNumber && (
                <FaCheckCircle className="reviewUserCom-infoCheck" />
              )}
            </div>
          </div>
        </section>

        {/* ADDRESS SECTION */}
        <section className="reviewUserCom-infoCard">
          <div className="reviewUserCom-cardHeader">
            <div className="reviewUserCom-cardHeaderIcon">
              <FaUser className="reviewUserCom-cardHeaderIconGlyph" />
            </div>

            <div>
              <h2 className="reviewUserCom-cardTitle">Address Details</h2>
              <p className="reviewUserCom-cardSubtitle">
                Your address and selected location
              </p>
            </div>
          </div>

          <div className="reviewUserCom-infoList">
            <div className="reviewUserCom-infoRow">
              <div className="reviewUserCom-infoIconContainer">
                <FaUser className="reviewUserCom-infoIcon" />
              </div>

              <div className="reviewUserCom-infoContent">
                <span className="reviewUserCom-infoLabel">Exact Address</span>
                <p className="reviewUserCom-infoValue">
                  {exactAddress || "Not provided"}
                </p>
              </div>

              {exactAddress && (
                <FaCheckCircle className="reviewUserCom-infoCheck" />
              )}
            </div>

            <div className="reviewUserCom-infoRow reviewUserCom-infoRowLast">
              <div className="reviewUserCom-infoIconContainer">
                <FaUser className="reviewUserCom-infoIcon" />
              </div>

              <div className="reviewUserCom-infoContent">
                <span className="reviewUserCom-infoLabel">
                  Selected Location
                </span>
                <p className="reviewUserCom-infoValue">
                  {address || "Not provided"}
                </p>
              </div>

              {address && <FaCheckCircle className="reviewUserCom-infoCheck" />}
            </div>
          </div>
        </section>

        {/* LOCATION CONFIRMATION */}
        <div className="reviewUserCom-locationConfirmation">
          <div className="reviewUserCom-locationConfirmationIcon">
            <FaCheckCircle className="reviewUserCom-locationConfirmationGlyph" />
          </div>

          <div className="reviewUserCom-locationConfirmationContent">
            <h3 className="reviewUserCom-locationConfirmationTitle">
              Profile information review
            </h3>
            <p className="reviewUserCom-locationConfirmationText">
              Please confirm that your contact information and address are
              correct before continuing.
            </p>
          </div>
        </div>

        {/* SPACING FOR FIXED FOOTER */}
        <div className="reviewUserCom-bottomSpacer" />
      </main>

      {/* ================= BOTTOM CTA ================= */}
      <footer className="reviewUserCom-footer">
        <button
          type="button"
          className="reviewUserCom-saveButton"
          onClick={() => navigate("/send/profile")}
        >
          <div className="reviewUserCom-saveButtonTextContainer">
            <span className="reviewUserCom-saveButtonLabel">
              Confirm Profile
            </span>
            <span className="reviewUserCom-saveButtonSubLabel">
              Complete your profile
            </span>
          </div>

          <div className="reviewUserCom-saveButtonIconContainer">
            <FaCheckCircle className="reviewUserCom-saveButtonIcon" />
          </div>
        </button>
      </footer>
    </div>
  );
};

export default ReviewUser;
