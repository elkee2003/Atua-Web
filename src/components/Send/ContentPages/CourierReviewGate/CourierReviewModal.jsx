import React, { useEffect, useMemo, useState } from "react";

import {
  FaCheck,
  FaMapMarkerAlt,
  FaStar,
  FaRegStar,
  FaArrowRight,
  FaExclamationCircle,
  FaCircle,
} from "react-icons/fa";

import "./CourierReviewGate.css";

// =========================================================
// COURIER REVIEW MODAL
// =========================================================

const CourierReviewModal = ({
  visible,
  order,
  courier,
  courierImageUrl,
  loading = false,
  error = null,
  onSubmit,
}) => {
  // =========================================================
  // STATE
  // =========================================================

  const [rating, setRating] = useState(null);

  const [comment, setComment] = useState("");

  const [imageError, setImageError] = useState(false);

  // =========================================================
  // RESET WHEN ORDER CHANGES
  // =========================================================

  useEffect(() => {
    setRating(null);
    setComment("");
    setImageError(false);
  }, [order?.id]);

  // =========================================================
  // LOCK BODY SCROLL
  // =========================================================

  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [visible]);

  // =========================================================
  // COURIER NAME
  // =========================================================

  const courierName = useMemo(() => {
    const name = [courier?.firstName, courier?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim();

    return name || courier?.firstName || "Courier";
  }, [courier?.firstName, courier?.lastName]);

  // =========================================================
  // TRANSPORT DETAILS
  // =========================================================

  const transportDetails = useMemo(() => {
    return [courier?.transportationType, courier?.vehicleClass]
      .filter(Boolean)
      .join(" • ");
  }, [courier?.transportationType, courier?.vehicleClass]);

  // =========================================================
  // VEHICLE DETAILS
  // =========================================================

  const vehicleDetails = useMemo(() => {
    return [courier?.vehicleColour, courier?.plateNumber]
      .filter(Boolean)
      .join(" • ");
  }, [courier?.vehicleColour, courier?.plateNumber]);

  // =========================================================
  // ORDER REFERENCE
  // =========================================================

  const orderReference = useMemo(() => {
    if (!order?.id) {
      return "";
    }

    return `#${order.id.slice(-8).toUpperCase()}`;
  }, [order?.id]);

  // =========================================================
  // RATING LABEL
  // =========================================================

  const ratingLabel = useMemo(() => {
    switch (rating) {
      case 1:
        return "Poor";

      case 2:
        return "Below average";

      case 3:
        return "Good";

      case 4:
        return "Very good";

      case 5:
        return "Excellent";

      default:
        return "Tap a star to rate";
    }
  }, [rating]);

  // =========================================================
  // SUBMIT
  // =========================================================

  const handleSubmit = () => {
    // -------------------------------------------------------
    // Rating is mandatory
    // -------------------------------------------------------

    if (!rating || loading) {
      return;
    }

    // -------------------------------------------------------
    // Send to Gate
    // -------------------------------------------------------

    onSubmit?.({
      rating,
      comment,
    });
  };

  // =========================================================
  // IMAGE
  // =========================================================

  const imageSource =
    courierImageUrl && !imageError
      ? courierImageUrl
      : "/atuaImages/placeholder.png";

  // =========================================================
  // RENDER
  // =========================================================

  if (!visible) {
    return null;
  }

  return (
    <div
      className="courierReviewGateOverlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="courierReviewGateTitle"
    >
      <div className="courierReviewGateModal">
        {/* =================================================
            HEADER
        ================================================= */}

        <div className="courierReviewGateHeader">
          <div className="courierReviewGateSuccessIcon">
            <FaCheck />
          </div>

          <h2
            id="courierReviewGateTitle"
            className="courierReviewGateHeaderTitle"
          >
            Delivery completed
          </h2>

          <p className="courierReviewGateHeaderSubtitle">
            Your package was delivered successfully.
          </p>
        </div>

        {/* =================================================
            CONTENT
        ================================================= */}

        <div className="courierReviewGateScrollContent">
          {/* ===============================================
              DELIVERY REFERENCE
          =============================================== */}

          {orderReference && (
            <div className="courierReviewGateOrderReference">
              <span className="courierReviewGateOrderReferenceLabel">
                Delivery
              </span>

              <strong className="courierReviewGateOrderReferenceValue">
                {orderReference}
              </strong>
            </div>
          )}

          {/* ===============================================
              DELIVERY ROUTE
          =============================================== */}

          <section className="courierReviewGateSection">
            <h3 className="courierReviewGateSectionTitle">Your delivery</h3>

            <div className="courierReviewGateRouteContainer">
              {/* PICKUP */}

              <div className="courierReviewGateLocationRow">
                <div className="courierReviewGateLocationIcon courierReviewGatePickupIcon">
                  <FaCircle />
                </div>

                <div className="courierReviewGateLocationContent">
                  <span className="courierReviewGateLocationLabel">Pickup</span>

                  <p className="courierReviewGateLocationText">
                    {order?.originAddress || "Pickup location"}
                  </p>
                </div>
              </div>

              {/* CONNECTOR */}

              <div className="courierReviewGateRouteConnector" />

              {/* DESTINATION */}

              <div className="courierReviewGateLocationRow">
                <div className="courierReviewGateLocationIcon courierReviewGateDestinationIcon">
                  <FaMapMarkerAlt />
                </div>

                <div className="courierReviewGateLocationContent">
                  <span className="courierReviewGateLocationLabel">
                    Delivered to
                  </span>

                  <p className="courierReviewGateLocationText">
                    {order?.destinationAddress || "Destination"}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* ===============================================
              COURIER
          =============================================== */}

          <section className="courierReviewGateSection">
            <h3 className="courierReviewGateSectionTitle">Your courier</h3>

            <div className="courierReviewGateCourierCard">
              {/* IMAGE */}

              <img
                src={imageSource}
                alt={courierName}
                className="courierReviewGateCourierImage"
                onError={() => setImageError(true)}
              />

              {/* INFO */}

              <div className="courierReviewGateCourierInfo">
                <strong
                  className="courierReviewGateCourierName"
                  title={courierName}
                >
                  {courierName}
                </strong>

                {transportDetails ? (
                  <span
                    className="courierReviewGateCourierTransport"
                    title={transportDetails}
                  >
                    {transportDetails}
                  </span>
                ) : null}

                {vehicleDetails ? (
                  <span
                    className="courierReviewGateCourierVehicle"
                    title={vehicleDetails}
                  >
                    {vehicleDetails}
                  </span>
                ) : null}
              </div>
            </div>
          </section>

          {/* ===============================================
              RATING
          =============================================== */}

          <section className="courierReviewGateRatingSection">
            <h3 className="courierReviewGateRatingTitle">
              How was your delivery?
            </h3>

            <p className="courierReviewGateRatingSubtitle">
              Rate your courier's service
            </p>

            <div
              className="courierReviewGateStarsContainer"
              role="radiogroup"
              aria-label="Courier rating"
            >
              {[1, 2, 3, 4, 5].map((star) => {
                const selected = rating >= star;

                return (
                  <button
                    key={star}
                    type="button"
                    className={`courierReviewGateStarButton ${
                      selected ? "courierReviewGateStarSelected" : ""
                    }`}
                    onClick={() => setRating(star)}
                    disabled={loading}
                    aria-label={`${star} star${star > 1 ? "s" : ""}`}
                    aria-checked={rating === star}
                    role="radio"
                  >
                    {selected ? <FaStar /> : <FaRegStar />}
                  </button>
                );
              })}
            </div>

            <div className="courierReviewGateRatingValue">{ratingLabel}</div>
          </section>

          {/* ===============================================
              COMMENT
          =============================================== */}

          <section className="courierReviewGateCommentSection">
            <label
              htmlFor="courierReviewGateComment"
              className="courierReviewGateCommentLabel"
            >
              Tell us about your experience
              <span className="courierReviewGateOptionalText"> (optional)</span>
            </label>

            <textarea
              id="courierReviewGateComment"
              value={comment}
              onChange={(event) => setComment(event.target.value)}
              placeholder="Share anything about the delivery..."
              maxLength={500}
              disabled={loading}
              className="courierReviewGateCommentInput"
            />

            <div className="courierReviewGateCharacterCount">
              {comment.length}/500
            </div>
          </section>

          {/* ===============================================
              ERROR
          =============================================== */}

          {error ? (
            <div className="courierReviewGateErrorContainer">
              <FaExclamationCircle className="courierReviewGateErrorIcon" />

              <p className="courierReviewGateErrorText">{error}</p>
            </div>
          ) : null}

          {/* ===============================================
              BOTTOM SPACING
          =============================================== */}

          <div className="courierReviewGateBottomSpacing" />
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div className="courierReviewGateFooter">
          <button
            type="button"
            className={`courierReviewGateSubmitButton ${
              !rating || loading ? "courierReviewGateSubmitButtonDisabled" : ""
            }`}
            onClick={handleSubmit}
            disabled={!rating || loading}
            aria-label="Submit courier review"
            aria-disabled={!rating || loading}
          >
            {loading ? (
              <span className="courierReviewGateSpinner" />
            ) : (
              <>
                <span>Submit Review</span>

                <FaArrowRight />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CourierReviewModal;
