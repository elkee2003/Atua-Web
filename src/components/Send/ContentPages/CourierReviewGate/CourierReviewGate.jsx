import React, { useCallback, useEffect, useRef, useState } from "react";

import { DataStore } from "aws-amplify/datastore";
import { getUrl } from "aws-amplify/storage";

import { Courier, CourierReview, Order } from "../../../../models";

import { useAuthContext } from "../../../../../Providers/ClientProvider/AuthProvider";

import CourierReviewModal from "./CourierReviewModal";

import "./CourierReviewGate.css";

// =========================================================
// COURIER REVIEW GATE
// =========================================================

const CourierReviewGate = () => {
  // =========================================================
  // AUTH
  // =========================================================

  const { dbUser } = useAuthContext();

  // =========================================================
  // STATE
  // =========================================================

  const [pendingReviews, setPendingReviews] = useState([]);

  const [activeReview, setActiveReview] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  const [submitError, setSubmitError] = useState(null);

  // =========================================================
  // REFS
  // =========================================================

  // Prevent duplicate submissions.
  const submittingRef = useRef(false);

  // Orders successfully reviewed during this
  // mounted session.
  const submittedOrderIdsRef = useRef(new Set());

  // Prevent stale asynchronous requests from
  // overwriting newer results.
  const refreshSequenceRef = useRef(0);

  // Keeps track of the currently displayed order.
  const activeOrderIdRef = useRef(null);

  // =========================================================
  // RESET USER SESSION
  // =========================================================

  useEffect(() => {
    submittedOrderIdsRef.current = new Set();

    activeOrderIdRef.current = null;

    setPendingReviews([]);

    setActiveReview(null);

    setSubmitting(false);

    setSubmitError(null);

    submittingRef.current = false;
  }, [dbUser?.id]);

  // =========================================================
  // RESOLVE IMAGE URL
  // =========================================================

  const resolveImageUrl = useCallback(async (imagePath) => {
    if (!imagePath) {
      return null;
    }

    try {
      const pathValue =
        typeof imagePath === "string" ? imagePath.trim() : imagePath;

      if (!pathValue) {
        return null;
      }

      // -----------------------------------------------------
      // ALREADY A URL
      // -----------------------------------------------------

      if (
        typeof pathValue === "string" &&
        (pathValue.startsWith("http://") ||
          pathValue.startsWith("https://") ||
          pathValue.startsWith("blob:"))
      ) {
        return pathValue;
      }

      // -----------------------------------------------------
      // AMPLIFY STORAGE
      // -----------------------------------------------------

      try {
        const result = await getUrl({
          path: pathValue,
          options: {
            validateObjectExistence: true,
          },
        });

        if (result?.url) {
          return result.url.toString();
        }
      } catch (storageError) {
        console.warn("Courier review image getUrl failed:", storageError);
      }

      // No URL available.
      return null;
    } catch (error) {
      console.error("Failed to resolve courier image:", error);

      return null;
    }
  }, []);

  // =========================================================
  // LOAD PENDING REVIEWS
  // =========================================================

  const loadPendingReviews = useCallback(async () => {
    // -------------------------------------------------------
    // NO AUTHENTICATED USER
    // -------------------------------------------------------

    if (!dbUser?.id) {
      setPendingReviews([]);
      return;
    }

    // -------------------------------------------------------
    // REFRESH SEQUENCE
    // -------------------------------------------------------

    const refreshSequence = ++refreshSequenceRef.current;

    try {
      // =====================================================
      // FETCH USER ORDERS
      // =====================================================

      const orders = await DataStore.query(Order, (order) =>
        order.userID.eq(dbUser.id),
      );

      // Ignore stale request.
      if (refreshSequence !== refreshSequenceRef.current) {
        return;
      }

      // =====================================================
      // FIND DELIVERED ORDERS
      // =====================================================

      const deliveredOrders = orders.filter(
        (order) =>
          order.status === "DELIVERED" &&
          !!order.assignedCourierId &&
          !submittedOrderIdsRef.current.has(order.id),
      );

      // =====================================================
      // NO CANDIDATES
      // =====================================================

      if (deliveredOrders.length === 0) {
        setPendingReviews([]);
        return;
      }

      // =====================================================
      // FETCH USER REVIEWS
      // =====================================================

      const userReviews = await DataStore.query(CourierReview, (review) =>
        review.userID.eq(dbUser.id),
      );

      // Ignore stale request.
      if (refreshSequence !== refreshSequenceRef.current) {
        return;
      }

      // =====================================================
      // BUILD REVIEWED ORDER SET
      // =====================================================

      const reviewedOrderIds = new Set(
        userReviews.map((review) => review.orderID).filter(Boolean),
      );

      // =====================================================
      // REMOVE ALREADY REVIEWED ORDERS
      // =====================================================

      const unreviewedOrders = deliveredOrders.filter(
        (order) => !reviewedOrderIds.has(order.id),
      );

      // =====================================================
      // NOTHING TO REVIEW
      // =====================================================

      if (unreviewedOrders.length === 0) {
        setPendingReviews([]);
        return;
      }

      // =====================================================
      // OLDEST FIRST
      // =====================================================

      unreviewedOrders.sort(
        (a, b) =>
          new Date(a.createdAt ?? 0).getTime() -
          new Date(b.createdAt ?? 0).getTime(),
      );

      // =====================================================
      // ENRICH WITH COURIER
      // =====================================================

      const enrichedReviews = await Promise.all(
        unreviewedOrders.map(async (order) => {
          let courier = null;

          // ------------------------------------------------
          // TRY RELATIONSHIP FIRST
          // ------------------------------------------------

          try {
            courier = await order.assignedCourier;
          } catch (error) {
            console.log("COURIER RELATIONSHIP ERROR:", error);
          }

          // ------------------------------------------------
          // FALLBACK TO DIRECT QUERY
          // ------------------------------------------------

          if (!courier) {
            try {
              courier = await DataStore.query(Courier, order.assignedCourierId);
            } catch (error) {
              console.log("COURIER QUERY ERROR:", error);
            }
          }

          // ------------------------------------------------
          // COURIER UNAVAILABLE
          // ------------------------------------------------

          if (!courier) {
            return null;
          }

          // ------------------------------------------------
          // COURIER IMAGE
          // ------------------------------------------------

          const courierImageUrl = await resolveImageUrl(courier.profilePic);

          // ------------------------------------------------
          // RETURN ENRICHED REVIEW
          // ------------------------------------------------

          return {
            order,
            courier,
            courierImageUrl,
          };
        }),
      );

      // =====================================================
      // REMOVE FAILED ENRICHMENTS
      // =====================================================

      const validReviews = enrichedReviews.filter(Boolean);

      // Ignore stale request.
      if (refreshSequence !== refreshSequenceRef.current) {
        return;
      }

      // =====================================================
      // UPDATE QUEUE
      // =====================================================

      setPendingReviews(validReviews);
    } catch (error) {
      console.log("LOAD PENDING COURIER REVIEWS ERROR:", error);
    }
  }, [dbUser?.id, resolveImageUrl]);

  // =========================================================
  // OBSERVE USER ORDERS
  // =========================================================

  useEffect(() => {
    if (!dbUser?.id) {
      return undefined;
    }

    let subscription;

    // Initial load.
    loadPendingReviews();

    // Observe user's orders.
    subscription = DataStore.observeQuery(Order, (order) =>
      order.userID.eq(dbUser.id),
    ).subscribe({
      next: () => {
        loadPendingReviews();
      },

      error: (error) => {
        console.log("COURIER REVIEW ORDER OBSERVER ERROR:", error);
      },
    });

    return () => {
      subscription?.unsubscribe();

      refreshSequenceRef.current += 1;
    };
  }, [dbUser?.id, loadPendingReviews]);

  // =========================================================
  // ACTIVATE NEXT REVIEW
  // =========================================================

  useEffect(() => {
    // -------------------------------------------------------
    // NOTHING TO REVIEW
    // -------------------------------------------------------

    if (pendingReviews.length === 0) {
      setActiveReview(null);

      activeOrderIdRef.current = null;

      return;
    }

    // -------------------------------------------------------
    // CURRENT REVIEW STILL EXISTS
    // -------------------------------------------------------

    if (activeOrderIdRef.current) {
      const activeStillExists = pendingReviews.some(
        (item) => item.order.id === activeOrderIdRef.current,
      );

      if (activeStillExists) {
        return;
      }
    }

    // -------------------------------------------------------
    // SELECT NEXT REVIEW
    // -------------------------------------------------------

    const nextReview = pendingReviews[0];

    activeOrderIdRef.current = nextReview.order.id;

    setSubmitError(null);

    setActiveReview(nextReview);
  }, [pendingReviews]);

  // =========================================================
  // SUBMIT REVIEW
  // =========================================================

  const handleSubmitReview = async ({ rating, comment }) => {
    // -------------------------------------------------------
    // VALIDATE ACTIVE REVIEW
    // -------------------------------------------------------

    if (!activeReview) {
      return;
    }

    // -------------------------------------------------------
    // PREVENT DUPLICATE SUBMISSION
    // -------------------------------------------------------

    if (submittingRef.current) {
      return;
    }

    // -------------------------------------------------------
    // VALIDATE AUTH
    // -------------------------------------------------------

    if (!dbUser?.id) {
      setSubmitError("Your account could not be verified. Please try again.");

      return;
    }

    // -------------------------------------------------------
    // EXTRACT DATA
    // -------------------------------------------------------

    const { order, courier } = activeReview;

    // -------------------------------------------------------
    // VALIDATE ORDER
    // -------------------------------------------------------

    if (!order?.id) {
      setSubmitError("We could not identify this delivery.");

      return;
    }

    // -------------------------------------------------------
    // VALIDATE COURIER
    // -------------------------------------------------------

    if (!courier?.id) {
      setSubmitError("We could not identify the courier for this delivery.");

      return;
    }

    // -------------------------------------------------------
    // VALIDATE RATING
    // -------------------------------------------------------

    const numericRating = Number(rating);

    if (
      !Number.isInteger(numericRating) ||
      numericRating < 1 ||
      numericRating > 5
    ) {
      setSubmitError("Please select a rating from 1 to 5 stars.");

      return;
    }

    // -------------------------------------------------------
    // LOCK SUBMISSION
    // -------------------------------------------------------

    submittingRef.current = true;

    setSubmitting(true);

    setSubmitError(null);

    try {
      // =====================================================
      // GET LATEST ORDER
      // =====================================================

      const latestOrder = await DataStore.query(Order, order.id);

      // =====================================================
      // ORDER NO LONGER EXISTS
      // =====================================================

      if (!latestOrder) {
        throw new Error("This delivery could not be found.");
      }

      // =====================================================
      // CONFIRM DELIVERY
      // =====================================================

      if (latestOrder.status !== "DELIVERED") {
        throw new Error("This delivery is no longer available for review.");
      }

      // =====================================================
      // CONFIRM COURIER
      // =====================================================

      if (latestOrder.assignedCourierId !== courier.id) {
        throw new Error("The courier assigned to this delivery has changed.");
      }

      // =====================================================
      // FINAL DUPLICATE CHECK
      // =====================================================

      const existingReviews = await DataStore.query(CourierReview, (review) =>
        review.orderID.eq(order.id),
      );

      // =====================================================
      // REVIEW ALREADY EXISTS
      // =====================================================

      if (existingReviews.length > 0) {
        submittedOrderIdsRef.current.add(order.id);

        setPendingReviews((current) =>
          current.filter((item) => item.order.id !== order.id),
        );

        activeOrderIdRef.current = null;

        setActiveReview(null);

        return;
      }

      // =====================================================
      // CREATE REVIEW
      // =====================================================

      await DataStore.save(
        new CourierReview({
          courierID: courier.id,

          userID: dbUser.id,

          orderID: order.id,

          rating: numericRating,

          comment:
            typeof comment === "string" && comment.trim().length > 0
              ? comment.trim()
              : null,
        }),
      );

      // =====================================================
      // MARK AS SUBMITTED LOCALLY
      // =====================================================

      submittedOrderIdsRef.current.add(order.id);

      // =====================================================
      // REMOVE FROM QUEUE
      // =====================================================

      setPendingReviews((current) =>
        current.filter((item) => item.order.id !== order.id),
      );

      // =====================================================
      // CLEAR ACTIVE REVIEW
      // =====================================================

      activeOrderIdRef.current = null;

      setActiveReview(null);

      setSubmitError(null);
    } catch (error) {
      console.log("SUBMIT COURIER REVIEW ERROR:", error);

      setSubmitError(
        error?.message || "We couldn't submit your review. Please try again.",
      );
    } finally {
      submittingRef.current = false;

      setSubmitting(false);
    }
  };

  // =========================================================
  // RENDER
  // =========================================================

  if (!activeReview) {
    return null;
  }

  return (
    <CourierReviewModal
      visible={true}
      order={activeReview.order}
      courier={activeReview.courier}
      courierImageUrl={activeReview.courierImageUrl}
      loading={submitting}
      error={submitError}
      onSubmit={handleSubmitReview}
    />
  );
};

export default CourierReviewGate;
