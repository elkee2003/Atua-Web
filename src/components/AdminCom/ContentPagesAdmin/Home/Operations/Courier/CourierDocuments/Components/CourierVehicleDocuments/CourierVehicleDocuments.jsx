import React, { useEffect, useState } from "react";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaImage,
  FaMotorcycle,
  FaCar,
  FaTruck,
  FaPalette,
  FaHashtag,
  FaInfoCircle,
} from "react-icons/fa";

import { getUrl } from "aws-amplify/storage";

import "./CourierVehicleDocuments.css";

function CourierVehicleDocuments({ courier, onViewImage }) {
  /*
  ==========================================================
  VEHICLE VALUES
  ==========================================================
  */

  const transportationType = courier?.transportationType || null;

  const vehicleClass = courier?.vehicleClass || null;

  const model = courier?.model || null;

  const vehicleColour = courier?.vehicleColour || null;

  const plateNumber = courier?.plateNumber || null;

  const maxiDescription = courier?.maxiDescription || null;

  const maxiImages = Array.isArray(courier?.maxiImages)
    ? courier.maxiImages.filter(Boolean)
    : [];

  /*
  ==========================================================
  VEHICLE TYPE ICON
  ==========================================================
  */

  const getVehicleIcon = () => {
    const value = `${transportationType || ""} ${
      vehicleClass || ""
    }`.toLowerCase();

    if (
      value.includes("maxi") ||
      value.includes("truck") ||
      value.includes("tipper") ||
      value.includes("flatbed")
    ) {
      return <FaTruck />;
    }

    if (
      value.includes("moto") ||
      value.includes("motorcycle") ||
      value.includes("bike")
    ) {
      return <FaMotorcycle />;
    }

    return <FaCar />;
  };

  /*
  ==========================================================
  IMAGE STATE
  ==========================================================
  */

  const [imageUrls, setImageUrls] = useState([]);

  const [imagesLoading, setImagesLoading] = useState(false);

  /*
  ==========================================================
  IMAGE LOADING
  ==========================================================
  */

  useEffect(() => {
    let mounted = true;

    const loadVehicleImages = async () => {
      if (maxiImages.length === 0) {
        if (mounted) {
          setImageUrls([]);
          setImagesLoading(false);
        }

        return;
      }

      setImagesLoading(true);

      try {
        const resolvedImages = await Promise.all(
          maxiImages.map(async (path) => {
            try {
              const result = await getUrl({
                path,

                options: {
                  validateObjectExistence: true,
                },
              });

              if (result?.url) {
                return {
                  path,
                  url: result.url.toString(),
                };
              }

              return null;
            } catch (error) {
              console.error("Error loading vehicle image:", error);

              return null;
            }
          }),
        );

        if (mounted) {
          setImageUrls(resolvedImages.filter(Boolean));
        }
      } catch (error) {
        console.error("Error resolving vehicle images:", error);

        if (mounted) {
          setImageUrls([]);
        }
      } finally {
        if (mounted) {
          setImagesLoading(false);
        }
      }
    };

    loadVehicleImages();

    return () => {
      mounted = false;
    };
  }, [courier?.maxiImages]);

  /*
  ==========================================================
  AVAILABILITY
  ==========================================================
  */

  const hasVehicleInformation = Boolean(
    transportationType || vehicleClass || model || vehicleColour || plateNumber,
  );

  const hasVehicleImages = imageUrls.length > 0;

  const isComplete = hasVehicleInformation;

  /*
  ==========================================================
  VIEW IMAGE
  ==========================================================
  */

  const handleViewImage = (url) => {
    if (!url) {
      return;
    }

    if (typeof onViewImage === "function") {
      onViewImage(url);

      return;
    }

    window.open(url, "_blank", "noopener,noreferrer");
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierVehicleDocuments">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierVehicleDocuments-header">
        <div className="courierVehicleDocuments-headerIcon">
          {getVehicleIcon()}
        </div>

        <div className="courierVehicleDocuments-headerContent">
          <h2>Vehicle Documents</h2>

          <p>Vehicle information and photos submitted by the courier.</p>
        </div>

        <div
          className={`courierVehicleDocuments-status ${
            isComplete ? "complete" : "incomplete"
          }`}
        >
          {isComplete ? <FaCheckCircle /> : <FaExclamationTriangle />}

          <span>{isComplete ? "Information Available" : "Incomplete"}</span>
        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="courierVehicleDocuments-content">
        {/* ==================================================
            VEHICLE INFORMATION
        ================================================== */}

        <div className="courierVehicleDocuments-information">
          {/* ==================================================
              VEHICLE TYPE CARD
          ================================================== */}

          <div className="courierVehicleDocuments-typeCard">
            <div className="courierVehicleDocuments-typeIcon">
              {getVehicleIcon()}
            </div>

            <div className="courierVehicleDocuments-typeContent">
              <span>Transportation</span>

              <h3>{transportationType || "Not specified"}</h3>

              {vehicleClass && <p>{vehicleClass}</p>}
            </div>
          </div>

          {/* ==================================================
              VEHICLE DETAILS
          ================================================== */}

          <div className="courierVehicleDocuments-details">
            {/* ==================================================
                VEHICLE CLASS
            ================================================== */}

            <div className="courierVehicleDocuments-detail">
              <div className="courierVehicleDocuments-detailIcon">
                {getVehicleIcon()}
              </div>

              <div>
                <span>Vehicle Class</span>

                <strong className={vehicleClass ? "available" : "missing"}>
                  {vehicleClass || "Not specified"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                MODEL
            ================================================== */}

            <div className="courierVehicleDocuments-detail">
              <div className="courierVehicleDocuments-detailIcon">
                <FaCar />
              </div>

              <div>
                <span>Model</span>

                <strong className={model ? "available" : "missing"}>
                  {model || "Not specified"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                COLOUR
            ================================================== */}

            <div className="courierVehicleDocuments-detail">
              <div className="courierVehicleDocuments-detailIcon">
                <FaPalette />
              </div>

              <div>
                <span>Vehicle Colour</span>

                <strong className={vehicleColour ? "available" : "missing"}>
                  {vehicleColour || "Not specified"}
                </strong>
              </div>
            </div>

            {/* ==================================================
                PLATE NUMBER
            ================================================== */}

            <div className="courierVehicleDocuments-detail">
              <div className="courierVehicleDocuments-detailIcon">
                <FaHashtag />
              </div>

              <div>
                <span>Plate Number</span>

                <strong className={plateNumber ? "available" : "missing"}>
                  {plateNumber || "Not provided"}
                </strong>
              </div>
            </div>
          </div>

          {/* ==================================================
              MAXI DESCRIPTION
          ================================================== */}

          {maxiDescription && (
            <div className="courierVehicleDocuments-description">
              <div className="courierVehicleDocuments-descriptionIcon">
                <FaInfoCircle />
              </div>

              <div>
                <span>Vehicle Description</span>

                <p>{maxiDescription}</p>
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            VEHICLE PHOTOS
        ================================================== */}

        <div className="courierVehicleDocuments-photosSection">
          <div className="courierVehicleDocuments-photosHeader">
            <div>
              <h3>Vehicle Photos</h3>

              <p>Photos submitted for vehicle verification.</p>
            </div>

            <div className="courierVehicleDocuments-photoCount">
              <FaImage />

              <span>{imageUrls.length}</span>
            </div>
          </div>

          {/* ==================================================
              PHOTO CONTENT
          ================================================== */}

          <div className="courierVehicleDocuments-photoContainer">
            {imagesLoading ? (
              <div className="courierVehicleDocuments-loading">
                <div className="courierVehicleDocuments-spinner" />

                <span>Loading vehicle photos...</span>
              </div>
            ) : hasVehicleImages ? (
              <div className="courierVehicleDocuments-photoGrid">
                {imageUrls.map((image, index) => (
                  <button
                    key={image.path || index}
                    type="button"
                    className="courierVehicleDocuments-photoCard"
                    onClick={() => handleViewImage(image.url)}
                  >
                    <img
                      src={image.url}
                      alt={`Vehicle ${index + 1}`}
                      onError={(event) => {
                        event.currentTarget.style.display = "none";
                      }}
                    />

                    <div className="courierVehicleDocuments-photoOverlay">
                      <FaImage />

                      <span>View Photo</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="courierVehicleDocuments-noPhotos">
                <div className="courierVehicleDocuments-noPhotosIcon">
                  <FaImage />
                </div>

                <h4>No Photos Available</h4>

                <p>
                  {maxiImages.length > 0
                    ? "The submitted vehicle photos could not be loaded."
                    : "The courier has not uploaded vehicle photos."}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierVehicleDocuments;
