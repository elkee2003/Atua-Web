import React from "react";

import {
  FaBox,
  FaCalendarAlt,
  FaCheckCircle,
  FaCommentAlt,
  FaEllipsisV,
  FaFlag,
  FaMapMarkerAlt,
  FaStar,
  FaTimes,
  FaTrash,
  FaUser,
} from "react-icons/fa";

import "./CourierReviewCard.css";

function CourierReviewCard({
  review,
  onViewOrder,
  onViewCustomer,
  onRespond,
  onFlag,
  onRemove,
}) {
  /*
  ==========================================================
  SAFETY
  ==========================================================
  */

  if (!review) {
    return null;
  }

  /*
  ==========================================================
  CUSTOMER INFORMATION
  ==========================================================
  */

  const firstName =
    review.firstName ||
    review.customerFirstName ||
    review.user?.firstName ||
    review.customer?.firstName ||
    "";

  const lastName =
    review.lastName ||
    review.customerLastName ||
    review.user?.lastName ||
    review.customer?.lastName ||
    "";

  const customerName =
    review.customerName ||
    review.userName ||
    review.customer?.name ||
    review.user?.name ||
    [firstName, lastName].filter(Boolean).join(" ") ||
    "Customer";

  /*
  ==========================================================
  CUSTOMER AVATAR
  ==========================================================
  */

  const customerAvatar =
    review.customerAvatar ||
    review.userAvatar ||
    review.customer?.avatar ||
    review.user?.avatar ||
    null;

  const customerInitial = customerName?.charAt(0)?.toUpperCase() || "C";

  /*
  ==========================================================
  RATING
  ==========================================================
  */

  const rating = Math.max(
    0,
    Math.min(5, Number(review.rating ?? review.stars ?? 0)),
  );

  /*
  ==========================================================
  REVIEW TEXT
  ==========================================================
  */

  const reviewText =
    review.comment ||
    review.review ||
    review.reviewText ||
    review.feedback ||
    "";

  const hasComment = String(reviewText).trim().length > 0;

  /*
  ==========================================================
  ORDER INFORMATION
  ==========================================================
  */

  const orderId =
    review.orderId ||
    review.order?.id ||
    review.orderReference ||
    review.orderNumber ||
    null;

  /*
  ==========================================================
  DATE
  ==========================================================
  */

  const rawDate =
    review.createdAt ||
    review.reviewDate ||
    review.date ||
    review.updatedAt ||
    null;

  const formatDate = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const formatDateTime = (dateValue) => {
    if (!dateValue) {
      return "Date unavailable";
    }

    const date = new Date(dateValue);

    if (Number.isNaN(date.getTime())) {
      return "Date unavailable";
    }

    return date.toLocaleDateString("en-NG", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  /*
  ==========================================================
  LOCATION
  ==========================================================
  */

  const location =
    review.customerLocation ||
    review.location ||
    review.customer?.location ||
    null;

  /*
  ==========================================================
  RESPONSE STATUS
  ==========================================================
  */

  const hasResponse = Boolean(
    review.response || review.adminResponse || review.courierResponse,
  );

  /*
  ==========================================================
  FLAG STATUS
  ==========================================================
  */

  const isFlagged = Boolean(review.isFlagged || review.flagged);

  /*
  ==========================================================
  RATING LABEL
  ==========================================================
  */

  const getRatingLabel = () => {
    if (rating >= 5) {
      return "Excellent";
    }

    if (rating >= 4) {
      return "Very Good";
    }

    if (rating >= 3) {
      return "Good";
    }

    if (rating >= 2) {
      return "Needs Improvement";
    }

    if (rating > 0) {
      return "Poor";
    }

    return "No Rating";
  };

  const ratingLabel = getRatingLabel();

  /*
  ==========================================================
  ACTION HANDLERS
  ==========================================================
  */

  const handleViewOrder = () => {
    if (typeof onViewOrder !== "function") {
      return;
    }

    onViewOrder(review);
  };

  const handleViewCustomer = () => {
    if (typeof onViewCustomer !== "function") {
      return;
    }

    onViewCustomer(review);
  };

  const handleRespond = () => {
    if (typeof onRespond !== "function") {
      return;
    }

    onRespond(review);
  };

  const handleFlag = () => {
    if (typeof onFlag !== "function") {
      return;
    }

    onFlag(review);
  };

  const handleRemove = () => {
    if (typeof onRemove !== "function") {
      return;
    }

    onRemove(review);
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <article
      className={`
        courierReviewCard
        ${isFlagged ? "courierReviewCard-flagged" : ""}
      `}
    >
      {/* ==================================================
          TOP SECTION
      ================================================== */}

      <div className="courierReviewCard-top">
        {/* ==================================================
            CUSTOMER
        ================================================== */}

        <div className="courierReviewCard-customer">
          <button
            type="button"
            className="courierReviewCard-avatar"
            onClick={
              typeof onViewCustomer === "function"
                ? handleViewCustomer
                : undefined
            }
            disabled={typeof onViewCustomer !== "function"}
            title={
              typeof onViewCustomer === "function" ? "View customer" : undefined
            }
          >
            {customerAvatar ? (
              <img
                src={customerAvatar}
                alt={customerName}
                onError={(event) => {
                  event.currentTarget.style.display = "none";
                }}
              />
            ) : (
              <span>{customerInitial}</span>
            )}
          </button>

          <div className="courierReviewCard-customerInfo">
            <div className="courierReviewCard-nameRow">
              <button
                type="button"
                className="courierReviewCard-customerName"
                onClick={
                  typeof onViewCustomer === "function"
                    ? handleViewCustomer
                    : undefined
                }
                disabled={typeof onViewCustomer !== "function"}
              >
                {customerName}
              </button>

              {review.isVerified && (
                <FaCheckCircle
                  className="courierReviewCard-verified"
                  title="Verified review"
                />
              )}
            </div>

            <div className="courierReviewCard-meta">
              <span>
                <FaCalendarAlt />

                {formatDateTime(rawDate)}
              </span>

              {location && (
                <span>
                  <FaMapMarkerAlt />

                  {location}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ==================================================
            RATING
        ================================================== */}

        <div className="courierReviewCard-rating">
          <div className="courierReviewCard-stars">
            {[1, 2, 3, 4, 5].map((star) => (
              <FaStar
                key={star}
                className={
                  star <= rating
                    ? "courierReviewCard-starFilled"
                    : "courierReviewCard-starEmpty"
                }
              />
            ))}
          </div>

          <div className="courierReviewCard-ratingInfo">
            <strong>{rating > 0 ? rating.toFixed(1) : "—"}</strong>

            <span>{ratingLabel}</span>
          </div>
        </div>
      </div>

      {/* ==================================================
          REVIEW BODY
      ================================================== */}

      <div className="courierReviewCard-body">
        <div className="courierReviewCard-reviewIcon">
          <FaCommentAlt />
        </div>

        <div className="courierReviewCard-reviewContent">
          <span className="courierReviewCard-reviewLabel">Customer Review</span>

          {hasComment ? (
            <p className="courierReviewCard-reviewText">{reviewText}</p>
          ) : (
            <p className="courierReviewCard-noComment">
              This customer left a rating without written feedback.
            </p>
          )}
        </div>
      </div>

      {/* ==================================================
          ORDER INFORMATION
      ================================================== */}

      {orderId && (
        <div className="courierReviewCard-order">
          <div className="courierReviewCard-orderIcon">
            <FaBox />
          </div>

          <div className="courierReviewCard-orderInfo">
            <span>Order</span>

            <strong>{orderId}</strong>
          </div>

          {typeof onViewOrder === "function" && (
            <button
              type="button"
              className="courierReviewCard-viewOrderButton"
              onClick={handleViewOrder}
            >
              View Order
            </button>
          )}
        </div>
      )}

      {/* ==================================================
          RESPONSE
      ================================================== */}

      {hasResponse && (
        <div className="courierReviewCard-response">
          <div className="courierReviewCard-responseHeader">
            <FaCheckCircle />

            <span>Response Added</span>
          </div>

          <p>
            {review.response || review.adminResponse || review.courierResponse}
          </p>
        </div>
      )}

      {/* ==================================================
          FLAGGED NOTICE
      ================================================== */}

      {isFlagged && (
        <div className="courierReviewCard-flagNotice">
          <FaFlag />

          <span>
            This review has been flagged for administrative attention.
          </span>
        </div>
      )}

      {/* ==================================================
          FOOTER ACTIONS
      ================================================== */}

      <div className="courierReviewCard-footer">
        <div className="courierReviewCard-footerInfo">
          <FaUser />

          <span>Customer feedback</span>
        </div>

        <div className="courierReviewCard-actions">
          {/* ==================================================
              VIEW CUSTOMER
          ================================================== */}

          {typeof onViewCustomer === "function" && (
            <button
              type="button"
              className="courierReviewCard-actionButton"
              onClick={handleViewCustomer}
            >
              <FaUser />

              <span>Customer</span>
            </button>
          )}

          {/* ==================================================
              RESPOND
          ================================================== */}

          {typeof onRespond === "function" && (
            <button
              type="button"
              className="courierReviewCard-actionButton courierReviewCard-respondButton"
              onClick={handleRespond}
            >
              <FaCommentAlt />

              <span>{hasResponse ? "View Response" : "Respond"}</span>
            </button>
          )}

          {/* ==================================================
              FLAG
          ================================================== */}

          {typeof onFlag === "function" && (
            <button
              type="button"
              className={`
                courierReviewCard-actionButton
                courierReviewCard-flagButton
                ${isFlagged ? "active" : ""}
              `}
              onClick={handleFlag}
            >
              {isFlagged ? <FaTimes /> : <FaFlag />}

              <span>{isFlagged ? "Unflag" : "Flag"}</span>
            </button>
          )}

          {/* ==================================================
              REMOVE
          ================================================== */}

          {typeof onRemove === "function" && (
            <button
              type="button"
              className="courierReviewCard-actionButton courierReviewCard-removeButton"
              onClick={handleRemove}
            >
              <FaTrash />

              <span>Remove</span>
            </button>
          )}
        </div>
      </div>
    </article>
  );
}

export default CourierReviewCard;
