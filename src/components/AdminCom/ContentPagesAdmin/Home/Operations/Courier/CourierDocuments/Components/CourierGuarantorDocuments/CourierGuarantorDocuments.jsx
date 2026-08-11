import React, { useEffect, useState } from "react";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaImage,
  FaIdCard,
  FaMapMarkerAlt,
  FaPhone,
  FaBriefcase,
  FaEnvelope,
  FaUserShield,
  FaTimes,
} from "react-icons/fa";

import { getUrl } from "aws-amplify/storage";

import "./CourierGuarantorDocuments.css";

function CourierGuarantorDocuments({ courier, onViewDocument }) {
  /*
  ==========================================================
  GUARANTOR NAME
  ==========================================================
  */

  const guarantorName =
    [courier?.guarantorName, courier?.guarantorLastName]
      .filter(Boolean)
      .join(" ")
      .trim() || "Guarantor";

  /*
  ==========================================================
  GUARANTOR NIN IMAGE
  ==========================================================
  */

  const [ninImageUrl, setNinImageUrl] = useState(null);

  const [ninImageLoading, setNinImageLoading] = useState(false);

  const [ninImageError, setNinImageError] = useState(false);

  /*
  ==========================================================
  LOAD GUARANTOR NIN IMAGE
  ==========================================================
  */

  useEffect(() => {
    let mounted = true;

    const loadNINImage = async () => {
      if (!courier?.guarantorNINImage) {
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
        const result = await getUrl({
          path: courier.guarantorNINImage,

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
        console.error("Error loading guarantor NIN image:", error);

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
  }, [courier?.guarantorNINImage]);

  /*
  ==========================================================
  FIELD AVAILABILITY
  ==========================================================
  */

  const hasName = Boolean(courier?.guarantorName || courier?.guarantorLastName);

  const hasProfession = Boolean(courier?.guarantorProfession);

  const hasPhone = Boolean(courier?.guarantorNumber);

  const hasRelationship = Boolean(courier?.guarantorRelationship);

  const hasAddress = Boolean(courier?.guarantorAddress);

  const hasEmail = Boolean(courier?.guarantorEmail);

  const hasNIN = Boolean(courier?.guarantorNIN);

  const hasNINImage = Boolean(courier?.guarantorNINImage);

  /*
  ==========================================================
  COMPLETION STATUS
  ==========================================================
  */

  const guarantorComplete =
    hasName &&
    hasProfession &&
    hasPhone &&
    hasRelationship &&
    hasAddress &&
    hasNIN &&
    hasNINImage &&
    !ninImageError;

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
  IMAGE ERROR
  ==========================================================
  */

  const handleImageError = () => {
    setNinImageError(true);
    setNinImageUrl(null);
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierGuarantorDocuments">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierGuarantorDocuments-header">
        <div className="courierGuarantorDocuments-headerIcon">
          <FaUserShield />
        </div>

        <div className="courierGuarantorDocuments-headerContent">
          <h2>Guarantor Documents</h2>

          <p>
            Guarantor information and identification documentation submitted for
            this courier.
          </p>
        </div>

        <div
          className={`courierGuarantorDocuments-status ${
            guarantorComplete ? "complete" : "incomplete"
          }`}
        >
          {guarantorComplete ? <FaCheckCircle /> : <FaExclamationTriangle />}

          <span>{guarantorComplete ? "Complete" : "Incomplete"}</span>
        </div>
      </div>

      {/* ==================================================
          GUARANTOR INFORMATION
      ================================================== */}

      <div className="courierGuarantorDocuments-content">
        <div className="courierGuarantorDocuments-information">
          {/* ==================================================
              NAME
          ================================================== */}

          <div className="courierGuarantorDocuments-nameCard">
            <div className="courierGuarantorDocuments-nameIcon">
              <FaUserShield />
            </div>

            <div>
              <span>Guarantor</span>

              <h3>{guarantorName}</h3>
            </div>
          </div>

          {/* ==================================================
              INFORMATION GRID
          ================================================== */}

          <div className="courierGuarantorDocuments-details">
            {/* ==================================================
                PROFESSION
            ================================================== */}

            <div className="courierGuarantorDocuments-detail">
              <div className="courierGuarantorDocuments-detailIcon">
                <FaBriefcase />
              </div>

              <div>
                <span>Profession</span>

                <strong className={hasProfession ? "available" : "missing"}>
                  {courier?.guarantorProfession || "Not provided"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                PHONE
            ================================================== */}

            <div className="courierGuarantorDocuments-detail">
              <div className="courierGuarantorDocuments-detailIcon">
                <FaPhone />
              </div>

              <div>
                <span>Phone Number</span>

                <strong className={hasPhone ? "available" : "missing"}>
                  {courier?.guarantorNumber || "Not provided"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                RELATIONSHIP
            ================================================== */}

            <div className="courierGuarantorDocuments-detail">
              <div className="courierGuarantorDocuments-detailIcon">
                <FaUserShield />
              </div>

              <div>
                <span>Relationship</span>

                <strong className={hasRelationship ? "available" : "missing"}>
                  {courier?.guarantorRelationship || "Not provided"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                EMAIL
            ================================================== */}

            <div className="courierGuarantorDocuments-detail">
              <div className="courierGuarantorDocuments-detailIcon">
                <FaEnvelope />
              </div>

              <div>
                <span>Email</span>

                <strong className={hasEmail ? "available" : "missing"}>
                  {courier?.guarantorEmail || "Not provided"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                ADDRESS
            ================================================== */}

            <div className="courierGuarantorDocuments-detail full">
              <div className="courierGuarantorDocuments-detailIcon">
                <FaMapMarkerAlt />
              </div>

              <div>
                <span>Address</span>

                <strong className={hasAddress ? "available" : "missing"}>
                  {courier?.guarantorAddress || "Not provided"}
                </strong>
              </div>
            </div>
          </div>
        </div>

        {/* ==================================================
            GUARANTOR NIN
        ================================================== */}

        <div className="courierGuarantorDocuments-ninSection">
          <div className="courierGuarantorDocuments-sectionHeader">
            <div className="courierGuarantorDocuments-sectionIcon">
              <FaIdCard />
            </div>

            <div>
              <h3>Guarantor NIN</h3>

              <p>National Identification Number submitted by the guarantor.</p>
            </div>
          </div>

          {/* ==================================================
              NIN NUMBER
          ================================================== */}

          <div className="courierGuarantorDocuments-ninValue">
            <span>NIN Number</span>

            <strong className={hasNIN ? "provided" : "missing"}>
              {courier?.guarantorNIN || "Not provided"}
            </strong>
          </div>

          {/* ==================================================
              NIN IMAGE
          ================================================== */}

          <div className="courierGuarantorDocuments-imageSection">
            <div className="courierGuarantorDocuments-imageHeader">
              <div>
                <h4>Guarantor NIN Photo</h4>

                <p>Uploaded image of the guarantor's NIN documentation.</p>
              </div>

              {ninImageUrl && (
                <button
                  type="button"
                  className="courierGuarantorDocuments-viewButton"
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

            <div className="courierGuarantorDocuments-imageContainer">
              {ninImageLoading ? (
                <div className="courierGuarantorDocuments-imageLoading">
                  <div className="courierGuarantorDocuments-spinner" />

                  <span>Loading guarantor NIN photo...</span>
                </div>
              ) : ninImageUrl && !ninImageError ? (
                <div className="courierGuarantorDocuments-imageWrapper">
                  <img
                    src={ninImageUrl}
                    alt={`${guarantorName} NIN`}
                    onError={handleImageError}
                  />
                </div>
              ) : (
                <div className="courierGuarantorDocuments-noImage">
                  <div className="courierGuarantorDocuments-noImageIcon">
                    <FaImage />
                  </div>

                  <h4>No Photo Available</h4>

                  <p>
                    {hasNINImage
                      ? "The guarantor NIN photo could not be loaded."
                      : "The guarantor has not uploaded a NIN photo."}
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

export default CourierGuarantorDocuments;
