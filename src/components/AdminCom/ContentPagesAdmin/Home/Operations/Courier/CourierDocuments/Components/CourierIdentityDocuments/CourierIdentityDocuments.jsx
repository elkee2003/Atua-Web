import React, { useEffect, useState } from "react";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaIdCard,
  FaImage,
  FaUser,
  FaTimes,
} from "react-icons/fa";

import { getUrl } from "aws-amplify/storage";

import "./CourierIdentityDocuments.css";

function CourierIdentityDocuments({ courier, profileUrl, onViewDocument }) {
  /*
  ==========================================================
  COURIER NAME
  ==========================================================
  */

  const courierName =
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ").trim() ||
    "Courier";

  /*
  ==========================================================
  NIN IMAGE URL
  ==========================================================
  */

  const [ninImageUrl, setNinImageUrl] = useState(null);

  const [ninImageLoading, setNinImageLoading] = useState(false);

  const [ninImageError, setNinImageError] = useState(false);

  /*
  ==========================================================
  LOAD NIN IMAGE
  ==========================================================
  */

  useEffect(() => {
    let mounted = true;

    const loadNINImage = async () => {
      if (!courier?.courierNINImage) {
        if (mounted) {
          setNinImageUrl(null);
          setNinImageLoading(false);
          setNinImageError(false);
        }

        return;
      }

      setNinImageLoading(true);
      setNinImageError(false);

      try {
        /*
          ----------------------------------------------------
          If the schema contains a storage path, resolve it
          into a usable URL.
          ----------------------------------------------------
          */

        const result = await getUrl({
          path: courier.courierNINImage,

          options: {
            validateObjectExistence: true,
          },
        });

        if (mounted && result?.url) {
          setNinImageUrl(result.url.toString());
        } else if (mounted) {
          setNinImageUrl(null);
          setNinImageError(true);
        }
      } catch (error) {
        console.error("Error loading courier NIN image:", error);

        if (mounted) {
          setNinImageUrl(null);
          setNinImageError(true);
        }
      } finally {
        if (mounted) {
          setNinImageLoading(false);
        }
      }
    };

    loadNINImage();

    return () => {
      mounted = false;
    };
  }, [courier?.courierNINImage]);

  /*
  ==========================================================
  VALUES
  ==========================================================
  */

  const hasProfilePhoto = Boolean(profileUrl || courier?.profilePic);

  const hasNIN = Boolean(courier?.courierNIN);

  const hasNINImage = Boolean(courier?.courierNINImage);

  const ninComplete = hasNIN && hasNINImage && !ninImageError;

  /*
  ==========================================================
  MASK NIN
  ==========================================================
  
  We display the full NIN because this is an authenticated
  admin courier-document page.
  
  ==========================================================
  */

  const formatNIN = (value) => {
    if (!value) {
      return "Not provided";
    }

    return String(value);
  };

  /*
  ==========================================================
  IMAGE ERROR
  ==========================================================
  */

  const handleNINImageError = () => {
    setNinImageError(true);
    setNinImageUrl(null);
  };

  /*
  ==========================================================
  VIEW DOCUMENT
  ==========================================================
  */

  const handleViewDocument = () => {
    if (!ninImageUrl) {
      return;
    }

    if (typeof onViewDocument === "function") {
      onViewDocument(ninImageUrl);

      return;
    }

    window.open(ninImageUrl, "_blank", "noopener,noreferrer");
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierIdentityDocuments">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierIdentityDocuments-header">
        <div className="courierIdentityDocuments-headerIcon">
          <FaIdCard />
        </div>

        <div className="courierIdentityDocuments-headerContent">
          <h2>Courier Identity</h2>

          <p>
            Identity information and NIN documentation submitted by the courier.
          </p>
        </div>

        <div
          className={`courierIdentityDocuments-status ${
            ninComplete ? "complete" : "incomplete"
          }`}
        >
          {ninComplete ? <FaCheckCircle /> : <FaExclamationTriangle />}

          <span>{ninComplete ? "Complete" : "Incomplete"}</span>
        </div>
      </div>

      {/* ==================================================
          IDENTITY CONTENT
      ================================================== */}

      <div className="courierIdentityDocuments-content">
        {/* ==================================================
            COURIER PROFILE
        ================================================== */}

        <div className="courierIdentityDocuments-profileCard">
          <div className="courierIdentityDocuments-profilePhoto">
            {profileUrl ? (
              <img src={profileUrl} alt={courierName} />
            ) : (
              <div className="courierIdentityDocuments-noProfilePhoto">
                <FaUser />

                <span>No Photo</span>
              </div>
            )}
          </div>

          <div className="courierIdentityDocuments-profileInfo">
            <span>Courier</span>

            <h3>{courierName}</h3>

            <p>Identity Profile</p>
          </div>
        </div>

        {/* ==================================================
            NIN INFORMATION
        ================================================== */}

        <div className="courierIdentityDocuments-ninSection">
          <div className="courierIdentityDocuments-sectionTitle">
            <div>
              <FaIdCard />
            </div>

            <div>
              <h3>National Identification Number</h3>

              <p>Courier NIN submitted during registration.</p>
            </div>
          </div>

          {/* ==================================================
              NIN NUMBER
          ================================================== */}

          <div className="courierIdentityDocuments-ninValue">
            <span>NIN Number</span>

            <strong className={hasNIN ? "provided" : "missing"}>
              {formatNIN(courier?.courierNIN)}
            </strong>
          </div>

          {/* ==================================================
              NIN PHOTO
          ================================================== */}

          <div className="courierIdentityDocuments-documentSection">
            <div className="courierIdentityDocuments-documentHeader">
              <div>
                <h4>NIN Document Photo</h4>

                <p>Uploaded image of the courier's NIN documentation.</p>
              </div>

              {ninImageUrl && (
                <button
                  type="button"
                  className="courierIdentityDocuments-viewButton"
                  onClick={handleViewDocument}
                >
                  <FaImage />

                  <span>View Full Image</span>
                </button>
              )}
            </div>

            {/* ==================================================
                IMAGE
            ================================================== */}

            <div className="courierIdentityDocuments-imageContainer">
              {ninImageLoading ? (
                <div className="courierIdentityDocuments-imageLoading">
                  <div className="courierIdentityDocuments-spinner" />

                  <span>Loading NIN photo...</span>
                </div>
              ) : ninImageUrl && !ninImageError ? (
                <div className="courierIdentityDocuments-imageWrapper">
                  <img
                    src={ninImageUrl}
                    alt={`${courierName} NIN`}
                    onError={handleNINImageError}
                  />
                </div>
              ) : (
                <div className="courierIdentityDocuments-noImage">
                  <div className="courierIdentityDocuments-noImageIcon">
                    <FaImage />
                  </div>

                  <h4>No Photo Available</h4>

                  <p>
                    {hasNINImage
                      ? "The NIN photo could not be loaded."
                      : "The courier has not uploaded a NIN photo."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierIdentityDocuments;
