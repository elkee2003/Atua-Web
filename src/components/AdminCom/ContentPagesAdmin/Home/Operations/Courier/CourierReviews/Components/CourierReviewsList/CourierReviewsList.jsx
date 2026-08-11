import React from "react";

import { FaCommentAlt, FaRedo } from "react-icons/fa";

import CourierReviewCard from "../CourierReviewCard/CourierReviewCard";
import CourierReviewsEmptyState from "../CourierReviewsEmptyState/CourierReviewsEmptyState";

import "./CourierReviewsList.css";

function CourierReviewsList({
  reviews = [],
  loading = false,
  refreshing = false,
  searchValue = "",
  hasActiveFilters = false,
  onRefresh,
  onViewOrder,
  onViewCustomer,
  onRespond,
  onFlag,
  onRemove,
  onLoadMore,
  hasMore = false,
  loadingMore = false,
}) {
  /*
  ==========================================================
  SAFE REVIEWS
  ==========================================================
  */

  const safeReviews = Array.isArray(reviews) ? reviews : [];

  /*
  ==========================================================
  SEARCH STATE
  ==========================================================
  */

  const hasSearch = String(searchValue || "").trim().length > 0;

  /*
  ==========================================================
  FILTER STATE
  ==========================================================
  */

  const hasFilters = Boolean(hasActiveFilters);

  const hasQuery = hasSearch || hasFilters;

  /*
  ==========================================================
  RESULT COUNT
  ==========================================================
  */

  const reviewCount = safeReviews.length;

  /*
  ==========================================================
  HANDLERS
  ==========================================================
  */

  const handleRefresh = () => {
    if (typeof onRefresh !== "function" || refreshing || loading) {
      return;
    }

    onRefresh();
  };

  const handleLoadMore = () => {
    if (typeof onLoadMore !== "function" || loadingMore || !hasMore) {
      return;
    }

    onLoadMore();
  };

  /*
  ==========================================================
  LOADING STATE
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierReviewsList">
        {/* ==================================================
            LIST HEADER
        ================================================== */}

        <div className="courierReviewsList-header">
          <div className="courierReviewsList-title">
            <div className="courierReviewsList-titleIcon">
              <FaCommentAlt />
            </div>

            <div>
              <h2>Customer Reviews</h2>

              <p>Loading courier reviews...</p>
            </div>
          </div>
        </div>

        {/* ==================================================
            SKELETON LIST
        ================================================== */}

        <div className="courierReviewsList-loadingList">
          {[1, 2, 3].map((item) => (
            <div key={item} className="courierReviewsList-loadingCard">
              <div className="courierReviewsList-loadingTop">
                <div className="courierReviewsList-loadingAvatar" />

                <div className="courierReviewsList-loadingIdentity">
                  <div className="courierReviewsList-loadingName" />

                  <div className="courierReviewsList-loadingDate" />
                </div>

                <div className="courierReviewsList-loadingRating" />
              </div>

              <div className="courierReviewsList-loadingText large" />

              <div className="courierReviewsList-loadingText medium" />

              <div className="courierReviewsList-loadingBottom">
                <div className="courierReviewsList-loadingSmall" />

                <div className="courierReviewsList-loadingSmall short" />
              </div>
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
    <section className="courierReviewsList">
      {/* ==================================================
          LIST HEADER
      ================================================== */}

      <div className="courierReviewsList-header">
        <div className="courierReviewsList-title">
          <div className="courierReviewsList-titleIcon">
            <FaCommentAlt />
          </div>

          <div>
            <h2>Customer Reviews</h2>

            <p>Review feedback received for this courier.</p>
          </div>
        </div>

        {/* ==================================================
            REFRESH
        ================================================== */}

        {typeof onRefresh === "function" && (
          <button
            type="button"
            className="courierReviewsList-refreshButton"
            onClick={handleRefresh}
            disabled={refreshing || loading}
            aria-label="Refresh reviews"
            title="Refresh reviews"
          >
            <FaRedo
              className={refreshing ? "courierReviewsList-refreshSpinning" : ""}
            />

            <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
          </button>
        )}
      </div>

      {/* ==================================================
          RESULT SUMMARY
      ================================================== */}

      <div className="courierReviewsList-resultBar">
        <div className="courierReviewsList-resultCount">
          <strong>{reviewCount.toLocaleString("en-NG")}</strong>

          <span>{reviewCount === 1 ? "review" : "reviews"}</span>
        </div>

        {hasQuery && (
          <span className="courierReviewsList-resultContext">
            {hasSearch ? `Results for "${searchValue}"` : "Filtered results"}
          </span>
        )}
      </div>

      {/* ==================================================
          EMPTY STATE
      ================================================== */}

      {reviewCount === 0 ? (
        <CourierReviewsEmptyState
          searchValue={searchValue}
          hasActiveFilters={hasFilters}
        />
      ) : (
        <>
          {/* ==================================================
              REVIEW CARDS
          ================================================== */}

          <div className="courierReviewsList-items">
            {safeReviews.map((review, index) => (
              <CourierReviewCard
                key={
                  review?.id || review?.reviewId || `courier-review-${index}`
                }
                review={review}
                onViewOrder={onViewOrder}
                onViewCustomer={onViewCustomer}
                onRespond={onRespond}
                onFlag={onFlag}
                onRemove={onRemove}
              />
            ))}
          </div>

          {/* ==================================================
              LOAD MORE
          ================================================== */}

          {hasMore && (
            <div className="courierReviewsList-loadMore">
              <button
                type="button"
                className="courierReviewsList-loadMoreButton"
                onClick={handleLoadMore}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <>
                    <span className="courierReviewsList-loadMoreSpinner" />

                    <span>Loading more...</span>
                  </>
                ) : (
                  <span>Load More Reviews</span>
                )}
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default CourierReviewsList;
