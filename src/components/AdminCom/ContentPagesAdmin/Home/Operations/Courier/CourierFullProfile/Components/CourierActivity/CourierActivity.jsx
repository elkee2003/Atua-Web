import React, { useCallback, useEffect, useMemo, useState } from "react";
import { DataStore } from "aws-amplify/datastore";

import {
  FaBoxOpen,
  FaCheckCircle,
  FaClock,
  FaExchangeAlt,
  FaFlag,
  FaMapMarkerAlt,
  FaMoneyBillWave,
  FaMotorcycle,
  FaPlay,
  FaReceipt,
  FaStar,
  FaTimesCircle,
  FaTruck,
  FaUserCheck,
} from "react-icons/fa";

import {
  Courier,
  CourierReport,
  CourierReview,
  Offer,
  Order,
  Payout,
  Transaction,
  Wallet,
} from "../../../../../../../../../models";

import "./CourierActivity.css";

function CourierActivity({ courier, maxItems = 15 }) {
  /*
    ==========================================================
    STATE
    ==========================================================
    */

  const [activities, setActivities] = useState([]);

  const [loading, setLoading] = useState(true);

  const [error, setError] = useState(null);

  /*
    ==========================================================
    FETCH COURIER ACTIVITY
    ==========================================================
    */

  const fetchActivity = useCallback(async () => {
    if (!courier?.id) {
      setActivities([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      /*
            ==================================================
            FETCH CORE COURIER DATA
            ==================================================
            */

      const [orders, offers, reviews, reports, payouts] = await Promise.all([
        DataStore.query(Order, (order) =>
          order.assignedCourierId.eq(courier.id),
        ),

        DataStore.query(Offer, (offer) => offer.courierID.eq(courier.id)),

        DataStore.query(CourierReview, (review) =>
          review.courierID.eq(courier.id),
        ),

        DataStore.query(CourierReport, (report) =>
          report.courierID.eq(courier.id),
        ),

        DataStore.query(Payout, (payout) => payout.courierID.eq(courier.id)),
      ]);

      /*
            ==================================================
            WALLET
            ==================================================
            */

      let transactions = [];

      try {
        let wallet = null;

        /*
                ----------------------------------------------
                Try walletID first
                ----------------------------------------------
                */

        if (courier.walletID) {
          wallet = await DataStore.query(Wallet, courier.walletID);
        }

        /*
                ----------------------------------------------
                Fallback: find by ownerID
                ----------------------------------------------
                */

        if (!wallet) {
          const wallets = await DataStore.query(Wallet, (w) =>
            w.ownerID.eq(courier.id),
          );

          wallet = wallets?.[0] || null;
        }

        /*
                ----------------------------------------------
                Transactions
                ----------------------------------------------
                */

        if (wallet?.id) {
          transactions = await DataStore.query(Transaction, (transaction) =>
            transaction.walletID.eq(wallet.id),
          );
        }
      } catch (walletError) {
        console.error("Courier wallet activity error:", walletError);

        transactions = [];
      }

      /*
            ==================================================
            BUILD ACTIVITY ARRAY
            ==================================================
            */

      const activityItems = [];

      /*
            ==================================================
            COURIER APPROVAL
            ==================================================
            */

      if (courier.isApproved) {
        activityItems.push({
          id: `courier-approved-${courier.id}`,
          type: "APPROVED",
          title: "Courier approved",
          description: "This courier is approved to operate on Atua.",
          timestamp: courier.updatedAt || courier.createdAt,
        });
      } else {
        activityItems.push({
          id: `courier-pending-${courier.id}`,
          type: "PENDING",
          title: "Approval pending",
          description: "This courier has not yet been approved for operations.",
          timestamp: courier.updatedAt || courier.createdAt,
        });
      }

      /*
            ==================================================
            ORDERS
            ==================================================
            */

      orders.forEach((order) => {
        /*
                ----------------------------------------------
                ACCEPTED
                ----------------------------------------------
                */

        if (order.acceptedAt) {
          activityItems.push({
            id: `${order.id}-accepted`,
            type: "ORDER_ACCEPTED",
            title: "Order accepted",
            description: "Courier accepted an assigned delivery.",
            timestamp: order.acceptedAt,
            orderId: order.id,
            orderStatus: order.status,
          });
        }

        /*
                ----------------------------------------------
                ARRIVED PICKUP
                ----------------------------------------------
                */

        if (order.arrivedPickupAt) {
          activityItems.push({
            id: `${order.id}-pickup-arrival`,
            type: "PICKUP_ARRIVAL",
            title: "Arrived at pickup",
            description: "Courier arrived at the pickup location.",
            timestamp: order.arrivedPickupAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                LOADING
                ----------------------------------------------
                */

        if (order.loadingStartedAt) {
          activityItems.push({
            id: `${order.id}-loading`,
            type: "LOADING_STARTED",
            title: "Loading started",
            description: "Loading of the order was started.",
            timestamp: order.loadingStartedAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                TRIP STARTED
                ----------------------------------------------
                */

        if (order.tripStartedAt) {
          activityItems.push({
            id: `${order.id}-trip-started`,
            type: "TRIP_STARTED",
            title: "Trip started",
            description: "Courier started the delivery journey.",
            timestamp: order.tripStartedAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                ARRIVED DROPOFF
                ----------------------------------------------
                */

        if (order.arrivedDropoffAt) {
          activityItems.push({
            id: `${order.id}-dropoff-arrival`,
            type: "DROPOFF_ARRIVAL",
            title: "Arrived at drop-off",
            description: "Courier arrived at the destination.",
            timestamp: order.arrivedDropoffAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                UNLOADING COMPLETED
                ----------------------------------------------
                */

        if (order.unloadingCompletedAt) {
          activityItems.push({
            id: `${order.id}-unloading`,
            type: "UNLOADING_COMPLETED",
            title: "Unloading completed",
            description: "The unloading process was completed.",
            timestamp: order.unloadingCompletedAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                DELIVERED
                ----------------------------------------------
                */

        if (order.status === "DELIVERED" && !order.unloadingCompletedAt) {
          activityItems.push({
            id: `${order.id}-delivered`,
            type: "ORDER_COMPLETED",
            title: "Order delivered",
            description: "The order has been marked as delivered.",
            timestamp: order.updatedAt || order.createdAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                CANCELLED
                ----------------------------------------------
                */

        if (order.status === "CANCELLED") {
          activityItems.push({
            id: `${order.id}-cancelled`,
            type: "ORDER_CANCELLED",
            title: "Order cancelled",
            description: "An assigned order was cancelled.",
            timestamp: order.updatedAt || order.createdAt,
            orderId: order.id,
          });
        }

        /*
                ----------------------------------------------
                DISPUTED
                ----------------------------------------------
                */

        if (order.status === "DISPUTED") {
          activityItems.push({
            id: `${order.id}-disputed`,
            type: "ORDER_DISPUTED",
            title: "Order disputed",
            description: "An assigned order is currently disputed.",
            timestamp: order.updatedAt || order.createdAt,
            orderId: order.id,
          });
        }
      });

      /*
            ==================================================
            OFFERS
            ==================================================
            */

      offers.forEach((offer) => {
        activityItems.push({
          id: `offer-${offer.id}`,
          type: "OFFER",
          title:
            offer.status === "ACCEPTED"
              ? "Offer accepted"
              : offer.status === "REJECTED"
                ? "Offer rejected"
                : "Offer submitted",

          description:
            offer.amount != null
              ? `Courier submitted an offer of ₦${Number(
                  offer.amount,
                ).toLocaleString("en-NG")}.`
              : "Courier submitted an order offer.",

          timestamp: offer.updatedAt || offer.createdAt,

          orderId: offer.orderID,
          amount: offer.amount,
          offerStatus: offer.status,
        });
      });

      /*
            ==================================================
            REVIEWS
            ==================================================
            */

      reviews.forEach((review) => {
        activityItems.push({
          id: `review-${review.id}`,
          type: "REVIEW",
          title: "Customer review received",

          description:
            review.comment || "A customer submitted a review for this courier.",

          timestamp: review.createdAt || review.updatedAt,

          orderId: review.orderID,
          rating: review.rating,
        });
      });

      /*
            ==================================================
            REPORTS
            ==================================================
            */

      reports.forEach((report) => {
        activityItems.push({
          id: `report-${report.id}`,
          type: "REPORT",
          title: "Courier report filed",

          description:
            report.reason || "A report was filed concerning this courier.",

          timestamp: report.createdAt || report.updatedAt,

          orderId: report.orderID,
          reportStatus: report.status,
        });
      });

      /*
            ==================================================
            TRANSACTIONS
            ==================================================
            */

      transactions.forEach((transaction) => {
        activityItems.push({
          id: `transaction-${transaction.id}`,
          type:
            transaction.type === "CREDIT" ? "WALLET_CREDIT" : "WALLET_DEBIT",

          title:
            transaction.type === "CREDIT"
              ? "Wallet credited"
              : "Wallet debited",

          description:
            transaction.description || "A wallet transaction was recorded.",

          timestamp: transaction.createdAt || transaction.updatedAt,

          amount: transaction.amount,

          transactionStatus: transaction.status,

          orderId: transaction.orderID,
        });
      });

      /*
            ==================================================
            PAYOUTS
            ==================================================
            */

      payouts.forEach((payout) => {
        activityItems.push({
          id: `payout-${payout.id}`,
          type: "PAYOUT",

          title:
            payout.status === "PAID"
              ? "Payout completed"
              : payout.status === "FAILED"
                ? "Payout failed"
                : payout.status === "PROCESSING"
                  ? "Payout processing"
                  : "Payout requested",

          description:
            payout.amount != null
              ? `Courier payout of ₦${Number(payout.amount).toLocaleString(
                  "en-NG",
                )}.`
              : "A courier payout was recorded.",

          timestamp: payout.updatedAt || payout.createdAt,

          amount: payout.amount,

          payoutStatus: payout.status,

          reference: payout.reference,
        });
      });

      /*
            ==================================================
            SORT
            ==================================================
            */

      activityItems.sort((a, b) => {
        const dateA = new Date(a.timestamp || 0).getTime();

        const dateB = new Date(b.timestamp || 0).getTime();

        return dateB - dateA;
      });

      setActivities(activityItems);
    } catch (err) {
      console.error("Failed to fetch courier activity:", err);

      setError("Unable to load courier activity.");

      setActivities([]);
    } finally {
      setLoading(false);
    }
  }, [courier]);

  /*
    ==========================================================
    INITIAL LOAD
    ==========================================================
    */

  useEffect(() => {
    fetchActivity();
  }, [fetchActivity]);

  /*
    ==========================================================
    REALTIME UPDATES
    ==========================================================
    */

  useEffect(() => {
    if (!courier?.id) {
      return undefined;
    }

    const subscriptions = [];

    /*
        ----------------------------------------------
        Models affecting courier activity
        ----------------------------------------------
        */

    const models = [
      Order,
      Offer,
      CourierReview,
      CourierReport,
      Transaction,
      Payout,
    ];

    models.forEach((Model) => {
      try {
        const subscription = DataStore.observe(Model).subscribe(() => {
          fetchActivity();
        });

        subscriptions.push(subscription);
      } catch (error) {
        console.error(`Failed to observe ${Model.name}:`, error);
      }
    });

    return () => {
      subscriptions.forEach((subscription) => subscription?.unsubscribe());
    };
  }, [courier?.id, fetchActivity]);

  /*
    ==========================================================
    FORMAT DATE
    ==========================================================
    */

  const formatDate = (value) => {
    if (!value) {
      return "Unknown date";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "Unknown date";
    }

    return date.toLocaleDateString("en-NG", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  /*
    ==========================================================
    FORMAT TIME
    ==========================================================
    */

  const formatTime = (value) => {
    if (!value) {
      return "";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "";
    }

    return date.toLocaleTimeString("en-NG", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /*
    ==========================================================
    ACTIVITY ICON
    ==========================================================
    */

  const getActivityIcon = (type) => {
    switch (type) {
      case "APPROVED":
        return <FaUserCheck />;

      case "PENDING":
        return <FaClock />;

      case "ORDER_ACCEPTED":
        return <FaBoxOpen />;

      case "PICKUP_ARRIVAL":
        return <FaMapMarkerAlt />;

      case "LOADING_STARTED":
        return <FaTruck />;

      case "TRIP_STARTED":
        return <FaPlay />;

      case "DROPOFF_ARRIVAL":
        return <FaMapMarkerAlt />;

      case "UNLOADING_COMPLETED":
        return <FaCheckCircle />;

      case "ORDER_COMPLETED":
        return <FaCheckCircle />;

      case "ORDER_CANCELLED":
        return <FaTimesCircle />;

      case "ORDER_DISPUTED":
        return <FaFlag />;

      case "OFFER":
        return <FaExchangeAlt />;

      case "REVIEW":
        return <FaStar />;

      case "REPORT":
        return <FaFlag />;

      case "WALLET_CREDIT":
        return <FaMoneyBillWave />;

      case "WALLET_DEBIT":
        return <FaReceipt />;

      case "PAYOUT":
        return <FaMoneyBillWave />;

      default:
        return <FaClock />;
    }
  };

  /*
    ==========================================================
    ACTIVITY COLOR
    ==========================================================
    */

  const getActivityClass = (activity) => {
    switch (activity.type) {
      case "APPROVED":
      case "ORDER_COMPLETED":
      case "UNLOADING_COMPLETED":
      case "WALLET_CREDIT":
        return "success";

      case "ORDER_CANCELLED":
      case "ORDER_DISPUTED":
      case "REPORT":
        return "danger";

      case "PENDING":
        return "warning";

      case "REVIEW":
        return "rating";

      case "PAYOUT":
      case "WALLET_DEBIT":
        return "finance";

      case "PICKUP_ARRIVAL":
      case "DROPOFF_ARRIVAL":
      case "TRIP_STARTED":
        return "location";

      case "OFFER":
      case "ORDER_ACCEPTED":
        return "operation";

      default:
        return "default";
    }
  };

  /*
    ==========================================================
    FORMAT AMOUNT
    ==========================================================
    */

  const formatAmount = (amount) => {
    if (amount === null || amount === undefined) {
      return null;
    }

    return `₦${Number(amount).toLocaleString("en-NG")}`;
  };

  /*
    ==========================================================
    ACTIVITY META
    ==========================================================
    */

  const getMeta = (activity) => {
    const meta = [];

    if (activity.orderId) {
      meta.push(`Order #${activity.orderId}`);
    }

    if (activity.amount !== undefined && activity.amount !== null) {
      meta.push(formatAmount(activity.amount));
    }

    if (activity.rating) {
      meta.push(`${activity.rating}/5 rating`);
    }

    if (activity.offerStatus) {
      meta.push(activity.offerStatus);
    }

    if (activity.reportStatus) {
      meta.push(activity.reportStatus);
    }

    if (activity.payoutStatus) {
      meta.push(activity.payoutStatus);
    }

    if (activity.transactionStatus) {
      meta.push(activity.transactionStatus);
    }

    return meta;
  };

  /*
    ==========================================================
    VISIBLE ACTIVITIES
    ==========================================================
    */

  const visibleActivities = useMemo(
    () => activities.slice(0, maxItems),
    [activities, maxItems],
  );

  /*
    ==========================================================
    LOADING
    ==========================================================
    */

  if (loading) {
    return (
      <section className="courierActivity">
        <div className="courierActivity-header">
          <div>
            <h2 className="courierActivity-title">Recent Activity</h2>

            <p className="courierActivity-description">
              Recent operational activity for this courier.
            </p>
          </div>
        </div>

        <div className="courierActivity-loading">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="courierActivity-loadingItem">
              <div className="courierActivity-loadingIcon" />

              <div className="courierActivity-loadingContent">
                <div className="courierActivity-loadingTitle" />

                <div className="courierActivity-loadingText" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
    ==========================================================
    ERROR
    ==========================================================
    */

  if (error) {
    return (
      <section className="courierActivity">
        <div className="courierActivity-header">
          <div>
            <h2 className="courierActivity-title">Recent Activity</h2>

            <p className="courierActivity-description">
              Recent operational activity for this courier.
            </p>
          </div>
        </div>

        <div className="courierActivity-error">
          <div className="courierActivity-errorIcon">
            <FaFlag />
          </div>

          <h3>Activity unavailable</h3>

          <p>{error}</p>

          <button type="button" onClick={fetchActivity}>
            Try Again
          </button>
        </div>
      </section>
    );
  }

  /*
    ==========================================================
    EMPTY
    ==========================================================
    */

  if (visibleActivities.length === 0) {
    return (
      <section className="courierActivity">
        <div className="courierActivity-header">
          <div>
            <h2 className="courierActivity-title">Recent Activity</h2>

            <p className="courierActivity-description">
              Recent operational activity for this courier.
            </p>
          </div>
        </div>

        <div className="courierActivity-empty">
          <div className="courierActivity-emptyIcon">
            <FaClock />
          </div>

          <h3>No activity recorded</h3>

          <p>
            There is no operational activity available for this courier yet.
          </p>
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
    <section className="courierActivity">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierActivity-header">
        <div>
          <h2 className="courierActivity-title">Recent Activity</h2>

          <p className="courierActivity-description">
            A timeline of this courier's operational and financial activity.
          </p>
        </div>

        <div className="courierActivity-count">{activities.length}</div>
      </div>

      {/* ==================================================
                TIMELINE
            ================================================== */}

      <div className="courierActivity-timeline">
        {visibleActivities.map((activity, index) => {
          const activityClass = getActivityClass(activity);

          const meta = getMeta(activity);

          const isLast = index === visibleActivities.length - 1;

          return (
            <div
              key={activity.id}
              className={`courierActivity-item ${
                isLast ? "courierActivity-itemLast" : ""
              }`}
            >
              {/* ==================================
                                    TIMELINE LINE
                                ================================== */}

              {!isLast && <div className="courierActivity-line" />}

              {/* ==================================
                                    ICON
                                ================================== */}

              <div
                className={`courierActivity-icon courierActivity-icon-${activityClass}`}
              >
                {getActivityIcon(activity.type)}
              </div>

              {/* ==================================
                                    CONTENT
                                ================================== */}

              <div className="courierActivity-content">
                <div className="courierActivity-itemTop">
                  <h3 className="courierActivity-itemTitle">
                    {activity.title}
                  </h3>

                  {activity.timestamp && (
                    <time className="courierActivity-time">
                      {formatDate(activity.timestamp)}

                      {" · "}

                      {formatTime(activity.timestamp)}
                    </time>
                  )}
                </div>

                <p className="courierActivity-itemDescription">
                  {activity.description}
                </p>

                {/* ==================================
                                        META
                                    ================================== */}

                {meta.length > 0 && (
                  <div className="courierActivity-meta">
                    {meta.map((item, metaIndex) => (
                      <span key={`${activity.id}-meta-${metaIndex}`}>
                        {item}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export default CourierActivity;
