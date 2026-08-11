import React, { useCallback, useEffect, useMemo, useState } from "react";

import { FaArrowLeft, FaExclamationTriangle, FaSyncAlt } from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import { Courier, CourierReview } from "../../../../../../../models";

import CourierReviewsHeader from "./Components/CourierReviewsHeader/CourierReviewsHeader";

import CourierReviewsStats from "./Components/CourierReviewsStats/CourierReviewsStats";

import CourierReviewsSummary from "./Components/CourierReviewsSummary/CourierReviewsSummary";

import CourierReviewsSearch from "./Components/CourierReviewsSearch/CourierReviewsSearch";

import CourierReviewsFilters from "./Components/CourierReviewsFilters/CourierReviewsFilters";

import CourierReviewsList from "./Components/CourierReviewsList/CourierReviewsList";

import "./CourierReviews.css";

function CourierReviews() {
  /*
  ==========================================================
  ROUTING
  ==========================================================
  */

  const navigate = useNavigate();

  const { id } = useParams();

  /*
  ==========================================================
  COURIER
  ==========================================================
  */

  const [courier, setCourier] = useState(null);

  /*
  ==========================================================
  REVIEWS
  ==========================================================
  */

  const [reviews, setReviews] = useState([]);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  const [error, setError] = useState(null);

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const [searchValue, setSearchValue] = useState("");

  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [ratingFilter, setRatingFilter] = useState("ALL");

  const [periodFilter, setPeriodFilter] = useState("ALL");

  const [statusFilter, setStatusFilter] = useState("ALL");

  /*
  ==========================================================
  PROFILE IMAGE
  ==========================================================
  */

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const [hasMore, setHasMore] = useState(false);

  /*
  ==========================================================
  RESOLVE PROFILE IMAGE
  ==========================================================
  */

  const resolveProfileImage = useCallback(async (courierData) => {
    /*
        ------------------------------------------------------
        RESET IMAGE
        ------------------------------------------------------
        */

    setProfileUrl(null);

    /*
        ------------------------------------------------------
        NO COURIER
        ------------------------------------------------------
        */

    if (!courierData) {
      return;
    }

    /*
        ------------------------------------------------------
        GET PROFILE IMAGE PATH
        ------------------------------------------------------
        */

    const profilePath =
      courierData.profilePic ||
      courierData.profilePhoto ||
      courierData.profileUrl ||
      null;

    /*
        ------------------------------------------------------
        NO PROFILE IMAGE
        ------------------------------------------------------
        */

    if (!profilePath) {
      return;
    }

    /*
        ------------------------------------------------------
        ALREADY A FULL URL
        ------------------------------------------------------
        */

    if (
      typeof profilePath === "string" &&
      (profilePath.startsWith("http://") ||
        profilePath.startsWith("https://") ||
        profilePath.startsWith("blob:"))
    ) {
      setProfileUrl(profilePath);

      return;
    }

    /*
        ------------------------------------------------------
        AMPLIFY STORAGE URL
        ------------------------------------------------------
        */

    try {
      const result = await getUrl({
        path: profilePath,

        options: {
          validateObjectExistence: true,
        },
      });

      if (result?.url) {
        setProfileUrl(result.url.toString());
      } else {
        setProfileUrl(null);
      }
    } catch (imageError) {
      console.error("Error loading courier profile image:", imageError);

      setProfileUrl(null);
    }
  }, []);

  /*
  ==========================================================
  LOAD COURIER
  ==========================================================
  */

  const loadCourier = useCallback(async () => {
    if (!id) {
      throw new Error("Courier ID is missing from the URL.");
    }

    const result = await DataStore.query(Courier, id);

    if (!result) {
      throw new Error("Courier could not be found.");
    }

    /*
        ------------------------------------------------------
        SAVE COURIER
        ------------------------------------------------------
        */

    setCourier(result);

    /*
        ------------------------------------------------------
        LOAD PROFILE IMAGE
        ------------------------------------------------------
        */

    await resolveProfileImage(result);

    return result;
  }, [id, resolveProfileImage]);

  /*
  ==========================================================
  LOAD COURIER REVIEWS
  ==========================================================
  */

  const loadReviews = useCallback(async () => {
    if (!id) {
      throw new Error("Courier ID is missing from the URL.");
    }

    /*
        ------------------------------------------------------
        IMPORTANT

        THIS IS COURIER REVIEW.

        NOT Review.
        ------------------------------------------------------
        */

    const result = await DataStore.query(CourierReview);

    /*
        ------------------------------------------------------
        FIND REVIEWS BELONGING TO THIS COURIER
        ------------------------------------------------------
        */

    const courierReviews = result.filter((review) => {
      const reviewCourierId =
        review?.courierId || review?.courierID || review?.courier?.id || null;

      return reviewCourierId === id;
    });

    /*
        ------------------------------------------------------
        SORT NEWEST FIRST
        ------------------------------------------------------
        */

    const sortedReviews = [...courierReviews].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
    );

    setReviews(sortedReviews);

    /*
        ------------------------------------------------------
        NO SERVER PAGINATION CURRENTLY
        ------------------------------------------------------
        */

    setHasMore(false);

    return sortedReviews;
  }, [id]);

  /*
  ==========================================================
  LOAD PAGE
  ==========================================================
  */

  const loadPage = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        await Promise.all([loadCourier(), loadReviews()]);
      } catch (err) {
        console.error("Error loading courier reviews:", err);

        setError(err?.message || "Unable to load courier reviews.");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [loadCourier, loadReviews],
  );

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    loadPage(true);
  }, [loadPage]);

  /*
  ==========================================================
  REAL-TIME OBSERVATION
  ==========================================================
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    /*
      --------------------------------------------------------
      COURIER OBSERVER
      --------------------------------------------------------
      */

    const courierSubscription = DataStore.observe(Courier, id).subscribe(
      ({ element }) => {
        if (!element) {
          return;
        }

        setCourier(element);

        /*
            --------------------------------------------------
            RELOAD PROFILE IMAGE
            --------------------------------------------------
            */

        resolveProfileImage(element);
      },
    );

    /*
      --------------------------------------------------------
      COURIER REVIEW OBSERVER
      --------------------------------------------------------
      */

    const reviewSubscription = DataStore.observe(CourierReview).subscribe(
      ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          loadReviews();
        }
      },
    );

    /*
      --------------------------------------------------------
      CLEANUP
      --------------------------------------------------------
      */

    return () => {
      courierSubscription.unsubscribe();

      reviewSubscription.unsubscribe();
    };
  }, [id, resolveProfileImage, loadReviews]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);

      setError(null);

      await Promise.all([loadCourier(), loadReviews()]);
    } catch (err) {
      console.error("Error refreshing courier reviews:", err);

      setError(err?.message || "Unable to refresh courier reviews.");
    } finally {
      setRefreshing(false);
    }
  };

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const handleSearchChange = (value) => {
    setSearchValue(value || "");
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  /*
  ==========================================================
  RATING FILTER
  ==========================================================
  */

  const handleRatingChange = (value) => {
    setRatingFilter(value || "ALL");
  };

  /*
  ==========================================================
  PERIOD FILTER
  ==========================================================
  */

  const handlePeriodChange = (value) => {
    setPeriodFilter(value || "ALL");
  };

  /*
  ==========================================================
  STATUS FILTER
  ==========================================================
  */

  const handleStatusChange = (value) => {
    setStatusFilter(value || "ALL");
  };

  /*
  ==========================================================
  CLEAR FILTERS
  ==========================================================
  */

  const handleClearFilters = () => {
    setRatingFilter("ALL");

    setPeriodFilter("ALL");

    setStatusFilter("ALL");
  };

  /*
  ==========================================================
  ACTIVE FILTERS
  ==========================================================
  */

  const hasActiveFilters =
    ratingFilter !== "ALL" || periodFilter !== "ALL" || statusFilter !== "ALL";

  /*
  ==========================================================
  PERIOD FILTER HELPER
  ==========================================================
  */

  const isWithinPeriod = useCallback((dateValue, period) => {
    if (period === "ALL") {
      return true;
    }

    if (!dateValue) {
      return false;
    }

    const reviewDate = new Date(dateValue);

    if (Number.isNaN(reviewDate.getTime())) {
      return false;
    }

    const now = new Date();

    /*
        ------------------------------------------------------
        TODAY
        ------------------------------------------------------
        */

    if (period === "TODAY") {
      return reviewDate.toDateString() === now.toDateString();
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const difference = now.getTime() - reviewDate.getTime();

    /*
        ------------------------------------------------------
        7 DAYS
        ------------------------------------------------------
        */

    if (period === "7_DAYS") {
      return difference >= 0 && difference <= 7 * millisecondsPerDay;
    }

    /*
        ------------------------------------------------------
        30 DAYS
        ------------------------------------------------------
        */

    if (period === "30_DAYS") {
      return difference >= 0 && difference <= 30 * millisecondsPerDay;
    }

    /*
        ------------------------------------------------------
        90 DAYS
        ------------------------------------------------------
        */

    if (period === "90_DAYS") {
      return difference >= 0 && difference <= 90 * millisecondsPerDay;
    }

    /*
        ------------------------------------------------------
        THIS YEAR
        ------------------------------------------------------
        */

    if (period === "THIS_YEAR") {
      return reviewDate.getFullYear() === now.getFullYear();
    }

    return true;
  }, []);

  /*
  ==========================================================
  FILTERED REVIEWS
  ==========================================================
  */

  const filteredReviews = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    return reviews.filter((review) => {
      /*
            --------------------------------------------------
            CUSTOMER INFORMATION
            --------------------------------------------------
            */

      const firstName =
        review?.firstName ||
        review?.customerFirstName ||
        review?.user?.firstName ||
        review?.customer?.firstName ||
        "";

      const lastName =
        review?.lastName ||
        review?.customerLastName ||
        review?.user?.lastName ||
        review?.customer?.lastName ||
        "";

      const customerName =
        review?.customerName ||
        review?.userName ||
        review?.customer?.name ||
        review?.user?.name ||
        `${firstName} ${lastName}`;

      /*
            --------------------------------------------------
            REVIEW TEXT
            --------------------------------------------------
            */

      const comment =
        review?.comment ||
        review?.review ||
        review?.reviewText ||
        review?.feedback ||
        "";

      /*
            --------------------------------------------------
            ORDER
            --------------------------------------------------
            */

      const orderId =
        review?.orderId ||
        review?.orderReference ||
        review?.orderNumber ||
        review?.order?.id ||
        "";

      /*
            --------------------------------------------------
            SEARCHABLE TEXT
            --------------------------------------------------
            */

      const searchableText = `
                ${customerName}
                ${comment}
                ${orderId}
              `.toLowerCase();

      if (search && !searchableText.includes(search)) {
        return false;
      }

      /*
            --------------------------------------------------
            RATING
            --------------------------------------------------
            */

      const reviewRating = Number(review?.rating ?? review?.stars ?? 0);

      if (ratingFilter !== "ALL" && reviewRating !== Number(ratingFilter)) {
        return false;
      }

      /*
            --------------------------------------------------
            DATE
            --------------------------------------------------
            */

      const reviewDate =
        review?.createdAt ||
        review?.reviewDate ||
        review?.date ||
        review?.updatedAt;

      if (!isWithinPeriod(reviewDate, periodFilter)) {
        return false;
      }

      /*
            --------------------------------------------------
            COMMENT STATUS
            --------------------------------------------------
            */

      const reviewComment = String(
        review?.comment ||
          review?.review ||
          review?.reviewText ||
          review?.feedback ||
          "",
      ).trim();

      if (statusFilter === "COMMENTED" && !reviewComment) {
        return false;
      }

      if (statusFilter === "RATING_ONLY" && reviewComment) {
        return false;
      }

      return true;
    });
  }, [
    reviews,
    searchValue,
    ratingFilter,
    periodFilter,
    statusFilter,
    isWithinPeriod,
  ]);

  /*
  ==========================================================
  REVIEW STATISTICS
  ==========================================================
  */

  const reviewStats = useMemo(() => {
    const total = reviews.length;

    const ratings = reviews
      .map((review) => Number(review?.rating ?? review?.stars ?? 0))
      .filter((rating) => rating > 0);

    const ratingTotal = ratings.reduce((sum, rating) => sum + rating, 0);

    const averageRating = ratings.length > 0 ? ratingTotal / ratings.length : 0;

    const fiveStar = ratings.filter((rating) => rating === 5).length;

    const fourStar = ratings.filter((rating) => rating === 4).length;

    const threeStar = ratings.filter((rating) => rating === 3).length;

    const twoStar = ratings.filter((rating) => rating === 2).length;

    const oneStar = ratings.filter((rating) => rating === 1).length;

    const commented = reviews.filter(
      (review) =>
        String(
          review?.comment ||
            review?.review ||
            review?.reviewText ||
            review?.feedback ||
            "",
        ).trim().length > 0,
    ).length;

    return {
      total,
      averageRating,
      fiveStar,
      fourStar,
      threeStar,
      twoStar,
      oneStar,
      commented,
      ratingCount: ratings.length,
    };
  }, [reviews]);

  /*
  ==========================================================
  RATING DISTRIBUTION
  ==========================================================
  */

  const ratingDistribution = useMemo(
    () => ({
      5: reviewStats.fiveStar,

      4: reviewStats.fourStar,

      3: reviewStats.threeStar,

      2: reviewStats.twoStar,

      1: reviewStats.oneStar,
    }),
    [reviewStats],
  );

  /*
  ==========================================================
  BACK
  ==========================================================
  */

  const handleBack = () => {
    navigate(-1);
  };

  /*
  ==========================================================
  VIEW ORDER
  ==========================================================
  */

  const handleViewOrder = (review) => {
    const orderId =
      review?.orderId ||
      review?.order?.id ||
      review?.orderReference ||
      review?.orderNumber;

    if (!orderId) {
      return;
    }

    navigate(`/order/${orderId}`);
  };

  /*
  ==========================================================
  VIEW CUSTOMER
  ==========================================================
  */

  const handleViewCustomer = (review) => {
    const customerId =
      review?.customerId ||
      review?.userId ||
      review?.customer?.id ||
      review?.user?.id;

    if (!customerId) {
      return;
    }

    navigate(`/customer/${customerId}`);
  };

  /*
  ==========================================================
  RESPOND
  ==========================================================
  */

  const handleRespond = (review) => {
    console.log("Respond to CourierReview:", review);
  };

  /*
  ==========================================================
  FLAG
  ==========================================================
  */

  const handleFlag = (review) => {
    console.log("Flag CourierReview:", review);
  };

  /*
  ==========================================================
  REMOVE REVIEW
  ==========================================================
  */

  const handleRemove = async (review) => {
    if (!review?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this review?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await DataStore.delete(CourierReview, review.id);

      setReviews((current) => current.filter((item) => item.id !== review.id));
    } catch (err) {
      console.error("Error removing courier review:", err);

      setError("Unable to remove this review.");
    }
  };

  /*
  ==========================================================
  LOAD MORE
  ==========================================================
  */

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      /*
        ------------------------------------------------------
        FUTURE PAGINATION
        ------------------------------------------------------
        */
    } finally {
      setLoadingMore(false);
    }
  };

  /*
  ==========================================================
  ERROR STATE
  ==========================================================
  */

  if (!loading && error) {
    return (
      <div className="courierReviews">
        <div className="courierReviews-error">
          <div className="courierReviews-errorIcon">
            <FaExclamationTriangle />
          </div>

          <h2>Unable to Load Reviews</h2>

          <p>{error}</p>

          <div className="courierReviews-errorActions">
            <button
              type="button"
              className="courierReviews-errorBackButton"
              onClick={handleBack}
            >
              <FaArrowLeft />

              <span>Back to Courier</span>
            </button>

            <button
              type="button"
              className="courierReviews-errorRetryButton"
              onClick={() => loadPage(true)}
            >
              <FaSyncAlt />

              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="courierReviews">
      {/* ==================================================
          HEADER
      ================================================== */}

      <CourierReviewsHeader
        courier={courier}
        profileUrl={profileUrl}
        loading={loading}
        onBack={handleBack}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="courierReviews-statsSection">
        <CourierReviewsStats
          courier={courier}
          reviews={reviews}
          totalReviews={reviewStats.total}
          averageRating={reviewStats.averageRating}
          ratingCount={reviewStats.ratingCount}
          commentedCount={reviewStats.commented}
          loading={loading}
        />
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="courierReviews-summarySection">
        <CourierReviewsSummary
          averageRating={reviewStats.averageRating}
          totalReviews={reviewStats.total}
          ratingDistribution={ratingDistribution}
          loading={loading}
        />
      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="courierReviews-searchSection">
        <CourierReviewsSearch
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          loading={loading}
        />
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="courierReviews-filterSection">
        <CourierReviewsFilters
          rating={ratingFilter}
          period={periodFilter}
          status={statusFilter}
          onRatingChange={handleRatingChange}
          onPeriodChange={handlePeriodChange}
          onStatusChange={handleStatusChange}
          onClear={handleClearFilters}
          loading={loading}
        />
      </div>

      {/* ==================================================
          REVIEWS LIST
      ================================================== */}

      <div className="courierReviews-listSection">
        <CourierReviewsList
          reviews={filteredReviews}
          loading={loading}
          refreshing={refreshing}
          searchValue={searchValue}
          hasActiveFilters={hasActiveFilters}
          onRefresh={handleRefresh}
          onViewOrder={handleViewOrder}
          onViewCustomer={handleViewCustomer}
          onRespond={handleRespond}
          onFlag={handleFlag}
          onRemove={handleRemove}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      </div>
    </div>
  );
}

export default CourierReviews;
