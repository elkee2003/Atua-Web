import React from "react";

import {
  FaArrowDown,
  FaArrowUp,
  FaCommentAlt,
  FaStar,
  FaStarHalfAlt,
  FaUsers,
} from "react-icons/fa";

import "./CourierReviewsStats.css";

function CourierReviewsStats({
  courier,
  totalReviews = 0,
  averageRating = 0,
  fiveStarReviews = 0,
  oneStarReviews = 0,
  previousAverageRating = null,
  loading = false,
}) {
  /*
  ==========================================================
  SAFE VALUES
  ==========================================================
  */

  const safeTotalReviews = Number(totalReviews ?? 0);

  const safeAverageRating = Number(averageRating ?? 0);

  const safeFiveStarReviews = Number(fiveStarReviews ?? 0);

  const safeOneStarReviews = Number(oneStarReviews ?? 0);

  /*
  ==========================================================
  RATING CHANGE
  ==========================================================
  */

  const hasPreviousRating =
    previousAverageRating !== null &&
    previousAverageRating !== undefined &&
    !Number.isNaN(Number(previousAverageRating));

  const ratingDifference = hasPreviousRating
    ? safeAverageRating - Number(previousAverageRating)
    : 0;

  const ratingImproved = ratingDifference > 0;

  const ratingDeclined = ratingDifference < 0;

  const ratingUnchanged = ratingDifference === 0;

  /*
  ==========================================================
  FIVE STAR PERCENTAGE
  ==========================================================
  */

  const fiveStarPercentage =
    safeTotalReviews > 0
      ? Math.round((safeFiveStarReviews / safeTotalReviews) * 100)
      : 0;

  /*
  ==========================================================
  ONE STAR PERCENTAGE
  ==========================================================
  */

  const oneStarPercentage =
    safeTotalReviews > 0
      ? Math.round((safeOneStarReviews / safeTotalReviews) * 100)
      : 0;

  /*
  ==========================================================
  COURIER NAME
  ==========================================================
  */

  const courierName =
    [courier?.firstName, courier?.lastName].filter(Boolean).join(" ").trim() ||
    "This courier";

  /*
  ==========================================================
  CURRENCY / NUMBER FORMAT
  ==========================================================
  */

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-NG");
  };

  /*
  ==========================================================
  RATING DISPLAY
  ==========================================================
  */

  const renderRatingStars = () => {
    const roundedRating = Math.round(safeAverageRating);

    return (
      <div className="courierReviewsStats-ratingStars">
        {[1, 2, 3, 4, 5].map((star) => (
          <FaStar
            key={star}
            className={
              star <= roundedRating
                ? "courierReviewsStats-starFilled"
                : "courierReviewsStats-starEmpty"
            }
          />
        ))}
      </div>
    );
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierReviewsStats">
        <div className="courierReviewsStats-grid">
          {[1, 2, 3, 4].map((item) => (
            <div
              key={item}
              className="courierReviewsStats-card courierReviewsStats-loadingCard"
            >
              <div className="courierReviewsStats-loadingTop">
                <div className="courierReviewsStats-loadingIcon" />

                <div className="courierReviewsStats-loadingTitle" />
              </div>

              <div className="courierReviewsStats-loadingValue" />

              <div className="courierReviewsStats-loadingDescription" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierReviewsStats">
      {/* ==================================================
          SECTION HEADER
      ================================================== */}

      <div className="courierReviewsStats-header">
        <div>
          <h2>Review Performance</h2>

          <p>Customer feedback and rating performance for {courierName}.</p>
        </div>
      </div>

      {/* ==================================================
          STATS GRID
      ================================================== */}

      <div className="courierReviewsStats-grid">
        {/* ==================================================
            OVERALL RATING
        ================================================== */}

        <article
          className="
            courierReviewsStats-card
            courierReviewsStats-ratingCard
          "
        >
          <div className="courierReviewsStats-cardTop">
            <div className="courierReviewsStats-icon courierReviewsStats-ratingIcon">
              <FaStar />
            </div>

            <span>Overall Rating</span>
          </div>

          <div className="courierReviewsStats-ratingMain">
            <strong>
              {safeAverageRating > 0 ? safeAverageRating.toFixed(1) : "0.0"}
            </strong>

            <span>/ 5.0</span>
          </div>

          {renderRatingStars()}

          <div className="courierReviewsStats-ratingChange">
            {hasPreviousRating ? (
              <>
                {ratingImproved && (
                  <FaArrowUp className="courierReviewsStats-positiveIcon" />
                )}

                {ratingDeclined && (
                  <FaArrowDown className="courierReviewsStats-negativeIcon" />
                )}

                {ratingUnchanged && (
                  <span className="courierReviewsStats-neutralDash">—</span>
                )}

                <span
                  className={
                    ratingImproved
                      ? "courierReviewsStats-positive"
                      : ratingDeclined
                        ? "courierReviewsStats-negative"
                        : "courierReviewsStats-neutral"
                  }
                >
                  {Math.abs(ratingDifference).toFixed(1)}{" "}
                  {ratingImproved
                    ? "increase"
                    : ratingDeclined
                      ? "decrease"
                      : "no change"}
                </span>
              </>
            ) : (
              <span className="courierReviewsStats-neutral">
                Current average rating
              </span>
            )}
          </div>
        </article>

        {/* ==================================================
            TOTAL REVIEWS
        ================================================== */}

        <article
          className="
            courierReviewsStats-card
            courierReviewsStats-reviewsCard
          "
        >
          <div className="courierReviewsStats-cardTop">
            <div className="courierReviewsStats-icon courierReviewsStats-reviewsIcon">
              <FaCommentAlt />
            </div>

            <span>Total Reviews</span>
          </div>

          <div className="courierReviewsStats-mainValue">
            <strong>{formatNumber(safeTotalReviews)}</strong>
          </div>

          <div className="courierReviewsStats-description">
            <FaUsers />

            <span>Customer reviews received</span>
          </div>
        </article>

        {/* ==================================================
            FIVE STAR
        ================================================== */}

        <article
          className="
            courierReviewsStats-card
            courierReviewsStats-fiveStarCard
          "
        >
          <div className="courierReviewsStats-cardTop">
            <div className="courierReviewsStats-icon courierReviewsStats-fiveStarIcon">
              <FaStar />
            </div>

            <span>5-Star Reviews</span>
          </div>

          <div className="courierReviewsStats-mainValue">
            <strong>{formatNumber(safeFiveStarReviews)}</strong>
          </div>

          <div className="courierReviewsStats-progress">
            <div className="courierReviewsStats-progressTrack">
              <div
                className="courierReviewsStats-progressFill courierReviewsStats-fiveStarFill"
                style={{
                  width: `${fiveStarPercentage}%`,
                }}
              />
            </div>

            <span>{fiveStarPercentage}% of reviews</span>
          </div>
        </article>

        {/* ==================================================
            ONE STAR
        ================================================== */}

        <article
          className="
            courierReviewsStats-card
            courierReviewsStats-oneStarCard
          "
        >
          <div className="courierReviewsStats-cardTop">
            <div className="courierReviewsStats-icon courierReviewsStats-oneStarIcon">
              <FaStar />
            </div>

            <span>1-Star Reviews</span>
          </div>

          <div className="courierReviewsStats-mainValue">
            <strong>{formatNumber(safeOneStarReviews)}</strong>
          </div>

          <div className="courierReviewsStats-progress">
            <div className="courierReviewsStats-progressTrack">
              <div
                className="courierReviewsStats-progressFill courierReviewsStats-oneStarFill"
                style={{
                  width: `${oneStarPercentage}%`,
                }}
              />
            </div>

            <span>{oneStarPercentage}% of reviews</span>
          </div>
        </article>
      </div>
    </section>
  );
}

export default CourierReviewsStats;
