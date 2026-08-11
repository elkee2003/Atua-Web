import React from "react";

import { FaChartBar, FaCheckCircle, FaStar } from "react-icons/fa";

import "./CourierReviewsSummary.css";

function CourierReviewsSummary({
  totalReviews = 0,
  averageRating = 0,
  fiveStarReviews = 0,
  fourStarReviews = 0,
  threeStarReviews = 0,
  twoStarReviews = 0,
  oneStarReviews = 0,
  loading = false,
}) {
  /*
  ==========================================================
  SAFE VALUES
  ==========================================================
  */

  const safeTotalReviews = Number(totalReviews ?? 0);

  const safeAverageRating = Number(averageRating ?? 0);

  const ratingBreakdown = [
    {
      rating: 5,
      count: Number(fiveStarReviews ?? 0),
    },
    {
      rating: 4,
      count: Number(fourStarReviews ?? 0),
    },
    {
      rating: 3,
      count: Number(threeStarReviews ?? 0),
    },
    {
      rating: 2,
      count: Number(twoStarReviews ?? 0),
    },
    {
      rating: 1,
      count: Number(oneStarReviews ?? 0),
    },
  ];

  /*
  ==========================================================
  FORMAT NUMBER
  ==========================================================
  */

  const formatNumber = (value) => {
    return Number(value || 0).toLocaleString("en-NG");
  };

  /*
  ==========================================================
  PERCENTAGE
  ==========================================================
  */

  const getPercentage = (count) => {
    if (safeTotalReviews <= 0) {
      return 0;
    }

    return Math.round((Number(count || 0) / safeTotalReviews) * 100);
  };

  /*
  ==========================================================
  POSITIVE REVIEWS
  ==========================================================
  */

  const positiveReviews = ratingBreakdown
    .filter((item) => item.rating === 4 || item.rating === 5)
    .reduce((total, item) => total + item.count, 0);

  const positivePercentage =
    safeTotalReviews > 0
      ? Math.round((positiveReviews / safeTotalReviews) * 100)
      : 0;

  /*
  ==========================================================
  LOW REVIEWS
  ==========================================================
  */

  const lowReviews = ratingBreakdown
    .filter((item) => item.rating === 1 || item.rating === 2)
    .reduce((total, item) => total + item.count, 0);

  const lowPercentage =
    safeTotalReviews > 0
      ? Math.round((lowReviews / safeTotalReviews) * 100)
      : 0;

  /*
  ==========================================================
  RATING QUALITY
  ==========================================================
  */

  const getRatingQuality = () => {
    if (safeTotalReviews === 0) {
      return {
        title: "No Reviews Yet",
        description:
          "There is not enough customer feedback to evaluate this courier yet.",
      };
    }

    if (safeAverageRating >= 4.5) {
      return {
        title: "Excellent",
        description: "Customers consistently rate this courier very highly.",
      };
    }

    if (safeAverageRating >= 4) {
      return {
        title: "Very Good",
        description: "The courier is receiving strong customer feedback.",
      };
    }

    if (safeAverageRating >= 3) {
      return {
        title: "Good",
        description:
          "Customer feedback is generally positive, with room for improvement.",
      };
    }

    if (safeAverageRating >= 2) {
      return {
        title: "Needs Improvement",
        description:
          "Recent customer feedback suggests areas that may need attention.",
      };
    }

    return {
      title: "Poor",
      description:
        "Customer feedback indicates significant areas requiring attention.",
    };
  };

  const ratingQuality = getRatingQuality();

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierReviewsSummary">
        <div className="courierReviewsSummary-loading">
          <div className="courierReviewsSummary-loadingHeader">
            <div className="courierReviewsSummary-loadingIcon" />

            <div className="courierReviewsSummary-loadingTitle" />
          </div>

          <div className="courierReviewsSummary-loadingBody">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="courierReviewsSummary-loadingRow">
                <div className="courierReviewsSummary-loadingSmall" />

                <div className="courierReviewsSummary-loadingBar" />

                <div className="courierReviewsSummary-loadingCount" />
              </div>
            ))}
          </div>
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
    <section className="courierReviewsSummary">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierReviewsSummary-header">
        <div className="courierReviewsSummary-headerIcon">
          <FaChartBar />
        </div>

        <div>
          <h2>Rating Summary</h2>

          <p>Breakdown of customer ratings received by this courier.</p>
        </div>
      </div>

      {/* ==================================================
          CONTENT
      ================================================== */}

      <div className="courierReviewsSummary-content">
        {/* ==================================================
            RATING BREAKDOWN
        ================================================== */}

        <div className="courierReviewsSummary-breakdown">
          <div className="courierReviewsSummary-breakdownHeader">
            <h3>Rating Breakdown</h3>

            <span>
              {formatNumber(safeTotalReviews)}{" "}
              {safeTotalReviews === 1 ? "review" : "reviews"}
            </span>
          </div>

          <div className="courierReviewsSummary-ratingList">
            {ratingBreakdown.map((item) => {
              const percentage = getPercentage(item.count);

              return (
                <div
                  key={item.rating}
                  className="courierReviewsSummary-ratingRow"
                >
                  {/* RATING LABEL */}

                  <div className="courierReviewsSummary-ratingLabel">
                    <strong>{item.rating}</strong>

                    <FaStar />
                  </div>

                  {/* PROGRESS */}

                  <div className="courierReviewsSummary-barContainer">
                    <div className="courierReviewsSummary-barTrack">
                      <div
                        className={`
                            courierReviewsSummary-barFill
                            courierReviewsSummary-barFill-${item.rating}
                          `}
                        style={{
                          width: `${percentage}%`,
                        }}
                      />
                    </div>
                  </div>

                  {/* COUNT */}

                  <div className="courierReviewsSummary-ratingCount">
                    <strong>{formatNumber(item.count)}</strong>

                    <span>{percentage}%</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* ==================================================
            QUALITY SUMMARY
        ================================================== */}

        <div className="courierReviewsSummary-quality">
          <div className="courierReviewsSummary-qualityHeader">
            <span>Overall Customer Sentiment</span>

            <FaCheckCircle />
          </div>

          <div className="courierReviewsSummary-qualityRating">
            <div className="courierReviewsSummary-qualityStars">
              {[1, 2, 3, 4, 5].map((star) => (
                <FaStar
                  key={star}
                  className={
                    star <= Math.round(safeAverageRating)
                      ? "courierReviewsSummary-starFilled"
                      : "courierReviewsSummary-starEmpty"
                  }
                />
              ))}
            </div>

            <strong>
              {safeAverageRating > 0 ? safeAverageRating.toFixed(1) : "0.0"}
            </strong>

            <span>out of 5</span>
          </div>

          <div className="courierReviewsSummary-qualityStatus">
            <strong>{ratingQuality.title}</strong>

            <p>{ratingQuality.description}</p>
          </div>

          {/* ==================================================
              POSITIVE / LOW SUMMARY
          ================================================== */}

          <div className="courierReviewsSummary-sentimentStats">
            <div className="courierReviewsSummary-sentimentItem">
              <span>Positive Ratings</span>

              <strong>{positivePercentage}%</strong>
            </div>

            <div className="courierReviewsSummary-sentimentDivider" />

            <div className="courierReviewsSummary-sentimentItem">
              <span>1–2 Star Ratings</span>

              <strong>{lowPercentage}%</strong>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierReviewsSummary;
