import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import {
  FaArrowLeft,
  FaExclamationTriangle,
  FaFileAlt,
  FaRedo,
  FaStar,
  FaUserShield,
  FaPhone,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBriefcase,
  FaIdCard,
  FaUserFriends,
  FaCamera,
  FaImage,
} from "react-icons/fa";

import {
  Courier,
  Order,
  CourierReview,
  CourierReport,
  Offer,
  Payout,
  Transaction,
  Wallet,
} from "../../../../../../../models";

import { getSignedUrl } from "../../../../../../../utils/s3";

import { useAuthContext } from "../../../../../../../../Providers/ClientProvider/AuthProvider";

import CourierProfileHeader from "./Components/CourierProfileHeader/CourierProfileHeader";
import CourierProfileStats from "./Components/CourierProfileStats/CourierProfileStats";
import CourierQuickActions from "./Components/CourierQuickActions/CourierQuickActions";
import CourierInformation from "./Components/CourierInformation/CourierInformation";
import CourierVehicle from "./Components/CourierVehicle/CourierVehicle";
import CourierActivity from "./Components/CourierActivity/CourierActivity";

import "./CourierFullProfile.css";

function CourierFullProfile() {
  /*
  ==========================================================
  ROUTING
  ==========================================================
  */

  const { id } = useParams();

  const navigate = useNavigate();

  /*
  ==========================================================
  AUTH
  ==========================================================
  */

  const { dbUser } = useAuthContext();

  /*
  ==========================================================
  COURIER
  ==========================================================
  */

  const [courier, setCourier] = useState(null);

  /*
  ==========================================================
  IMAGE URLS
  ==========================================================
  */

  const [profileUrl, setProfileUrl] = useState(null);

  const [courierNINImageUrl, setCourierNINImageUrl] = useState(null);

  const [guarantorNINImageUrl, setGuarantorNINImageUrl] = useState(null);

  /*
  ==========================================================
  RELATED DATA
  ==========================================================
  */

  const [orders, setOrders] = useState([]);

  const [reviews, setReviews] = useState([]);

  const [reports, setReports] = useState([]);

  const [offers, setOffers] = useState([]);

  const [payouts, setPayouts] = useState([]);

  const [transactions, setTransactions] = useState([]);

  const [wallet, setWallet] = useState(null);

  /*
  ==========================================================
  PAGE STATE
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  const [approvalLoading, setApprovalLoading] = useState(false);

  /*
  ==========================================================
  IMAGE URL HELPER
  ==========================================================
  */

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

      /*
          ----------------------------------------------------
          ALREADY A URL
          ----------------------------------------------------
          */

      if (
        typeof pathValue === "string" &&
        (pathValue.startsWith("http://") ||
          pathValue.startsWith("https://") ||
          pathValue.startsWith("blob:"))
      ) {
        return pathValue;
      }

      /*
          ----------------------------------------------------
          AMPLIFY STORAGE
          ----------------------------------------------------
          */

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
        console.warn(
          "Amplify Storage getUrl failed. Trying S3 helper:",
          storageError,
        );
      }

      /*
          ----------------------------------------------------
          CUSTOM S3 FALLBACK
          ----------------------------------------------------
          */

      try {
        const signedUrl = await getSignedUrl(pathValue);

        if (signedUrl) {
          return signedUrl.toString();
        }
      } catch (signedUrlError) {
        console.error("Custom S3 image URL resolution failed:", signedUrlError);
      }

      return null;
    } catch (imageError) {
      console.error("Failed to resolve image:", imageError);

      return null;
    }
  }, []);

  /*
  ==========================================================
  FETCH COURIER
  ==========================================================
  */

  const fetchCourier = useCallback(async () => {
    if (!id) {
      setError("No courier ID was provided.");

      setLoading(false);

      return;
    }

    try {
      setLoading(true);

      setError(null);

      /*
          ----------------------------------------------------
          COURIER
          ----------------------------------------------------
          */

      const courierData = await DataStore.query(Courier, id);

      if (!courierData) {
        setCourier(null);

        setError("Courier could not be found.");

        return;
      }

      setCourier(courierData);

      /*
          ----------------------------------------------------
          PROFILE IMAGE
          ----------------------------------------------------
          */

      const resolvedProfileUrl = await resolveImageUrl(courierData.profilePic);

      setProfileUrl(resolvedProfileUrl);

      /*
          ----------------------------------------------------
          COURIER NIN IMAGE
          ----------------------------------------------------

          IMPORTANT:
          The schema field is courierNINImage.
          ----------------------------------------------------
          */

      const courierNINPath =
        courierData.courierNINImage ||
        courierData.ninImage ||
        courierData.NINImage ||
        courierData.ninPhoto ||
        courierData.NINPhoto ||
        null;

      const resolvedCourierNINUrl = await resolveImageUrl(courierNINPath);

      setCourierNINImageUrl(resolvedCourierNINUrl);

      /*
          ----------------------------------------------------
          GUARANTOR NIN IMAGE
          ----------------------------------------------------
          */

      const guarantorNINPath =
        courierData.guarantorNINImage ||
        courierData.guarantorNINPhoto ||
        courierData.guarantorNinImage ||
        null;

      const resolvedGuarantorNINUrl = await resolveImageUrl(guarantorNINPath);

      setGuarantorNINImageUrl(resolvedGuarantorNINUrl);

      /*
          ====================================================
          RELATED DATA
          ====================================================
          */

      const [
        courierOrders,
        courierReviews,
        courierReports,
        courierOffers,
        courierPayouts,
      ] = await Promise.all([
        DataStore.query(Order, (order) =>
          order.assignedCourierId.eq(courierData.id),
        ),

        DataStore.query(CourierReview, (review) =>
          review.courierID.eq(courierData.id),
        ),

        DataStore.query(CourierReport, (report) =>
          report.courierID.eq(courierData.id),
        ),

        DataStore.query(Offer, (offer) => offer.courierID.eq(courierData.id)),

        DataStore.query(Payout, (payout) =>
          payout.courierID.eq(courierData.id),
        ),
      ]);

      setOrders(courierOrders || []);

      setReviews(courierReviews || []);

      setReports(courierReports || []);

      setOffers(courierOffers || []);

      setPayouts(courierPayouts || []);

      /*
          ====================================================
          WALLET
          ====================================================
          */

      let walletData = null;

      if (courierData.walletID) {
        try {
          walletData = await DataStore.query(Wallet, courierData.walletID);
        } catch (walletError) {
          console.error("Failed to fetch courier wallet:", walletError);
        }
      }

      /*
          ----------------------------------------------------
          WALLET FALLBACK
          ----------------------------------------------------
          */

      if (!walletData) {
        try {
          const wallets = await DataStore.query(Wallet, (walletItem) =>
            walletItem.ownerID.eq(courierData.id),
          );

          walletData = wallets?.[0] || null;
        } catch (walletError) {
          console.error("Wallet fallback failed:", walletError);
        }
      }

      setWallet(walletData);

      /*
          ====================================================
          TRANSACTIONS
          ====================================================
          */

      if (walletData?.id) {
        try {
          const walletTransactions = await DataStore.query(
            Transaction,
            (transaction) => transaction.walletID.eq(walletData.id),
          );

          setTransactions(walletTransactions || []);
        } catch (transactionError) {
          console.error(
            "Failed to fetch wallet transactions:",
            transactionError,
          );

          setTransactions([]);
        }
      } else {
        setTransactions([]);
      }
    } catch (fetchError) {
      console.error("Failed to fetch courier profile:", fetchError);

      setError("Unable to load this courier profile.");
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  }, [id, resolveImageUrl]);

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    fetchCourier();
  }, [fetchCourier]);

  /*
  ==========================================================
  REAL-TIME COURIER UPDATE
  ==========================================================
  */

  useEffect(() => {
    if (!id) {
      return undefined;
    }

    const subscription = DataStore.observe(Courier, id).subscribe(
      ({ opType, element }) => {
        if (["INSERT", "UPDATE"].includes(opType) && element) {
          setCourier(element);

          /*
              ------------------------------------------------
              PROFILE IMAGE
              ------------------------------------------------
              */

          resolveImageUrl(element.profilePic).then(setProfileUrl);

          /*
              ------------------------------------------------
              COURIER NIN IMAGE
              ------------------------------------------------
              */

          const courierNINPath =
            element.courierNINImage ||
            element.ninImage ||
            element.NINImage ||
            element.ninPhoto ||
            element.NINPhoto ||
            null;

          resolveImageUrl(courierNINPath).then(setCourierNINImageUrl);

          /*
              ------------------------------------------------
              GUARANTOR NIN IMAGE
              ------------------------------------------------
              */

          const guarantorNINPath =
            element.guarantorNINImage ||
            element.guarantorNINPhoto ||
            element.guarantorNinImage ||
            null;

          resolveImageUrl(guarantorNINPath).then(setGuarantorNINImageUrl);
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [id, resolveImageUrl]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    setRefreshing(true);

    await fetchCourier();
  };

  /*
  ==========================================================
  APPROVAL
  ==========================================================
  */

  const handleApproval = async () => {
    if (!courier) {
      return;
    }

    try {
      setApprovalLoading(true);

      const freshCourier = await DataStore.query(Courier, courier.id);

      if (!freshCourier) {
        return;
      }

      const newApprovalStatus = !freshCourier.isApproved;

      const updatedCourier = Courier.copyOf(freshCourier, (updated) => {
        updated.isApproved = newApprovalStatus;

        updated.approvedById = newApprovalStatus ? dbUser?.id || null : null;

        /*
              ------------------------------------------------
              UNAPPROVING FORCES OFFLINE
              ------------------------------------------------
              */

        if (!newApprovalStatus) {
          updated.isOnline = false;
        }

        updated.statusKey = `${updated.isOnline ? "ONLINE" : "OFFLINE"}#${
          newApprovalStatus ? "APPROVED" : "NOT_APPROVED"
        }`;
      });

      await DataStore.save(updatedCourier);

      setCourier(updatedCourier);
    } catch (approvalError) {
      console.error("Failed to update courier approval:", approvalError);
    } finally {
      setApprovalLoading(false);
    }
  };

  /*
  ==========================================================
  ORDER STATISTICS
  ==========================================================
  */

  const courierStats = useMemo(() => {
    const totalOrders = orders.length;

    const deliveredOrders = orders.filter(
      (order) => order.status === "DELIVERED",
    ).length;

    const cancelledOrders = orders.filter(
      (order) => order.status === "CANCELLED",
    ).length;

    const disputedOrders = orders.filter(
      (order) => order.status === "DISPUTED",
    ).length;

    const activeOrderStatuses = [
      "ACCEPTED",
      "ARRIVED_PICKUP",
      "LOADING",
      "PICKED_UP",
      "IN_TRANSIT",
      "ARRIVED_DROPOFF",
      "UNLOADING",
    ];

    const activeOrders = orders.filter((order) =>
      activeOrderStatuses.includes(order.status),
    ).length;

    /*
        ------------------------------------------------------
        EARNINGS
        ------------------------------------------------------
        */

    const totalEarnings = orders.reduce(
      (total, order) => total + Number(order.courierEarnings || 0),
      0,
    );

    const averageOrderValue =
      deliveredOrders > 0 ? totalEarnings / deliveredOrders : 0;

    /*
        ------------------------------------------------------
        COMPLETION
        ------------------------------------------------------
        */

    const completionRate =
      totalOrders > 0 ? (deliveredOrders / totalOrders) * 100 : 0;

    /*
        ------------------------------------------------------
        REVIEWS
        ------------------------------------------------------
        */

    const rating = Number(courier?.averageRating || 0);

    const reviewCount = Number(courier?.reviewCount || reviews.length || 0);

    /*
        ------------------------------------------------------
        REPORTS
        ------------------------------------------------------
        */

    const reportCount = Number(courier?.totalReports || reports.length || 0);

    /*
        ------------------------------------------------------
        OFFERS
        ------------------------------------------------------
        */

    const acceptedOffers = offers.filter(
      (offer) => offer.status === "ACCEPTED",
    ).length;

    const rejectedOffers = offers.filter(
      (offer) => offer.status === "REJECTED",
    ).length;

    const activeOffers = offers.filter(
      (offer) => offer.status === "ACTIVE",
    ).length;

    /*
        ------------------------------------------------------
        PAYOUTS
        ------------------------------------------------------
        */

    const totalPayouts = payouts.reduce(
      (total, payout) => total + Number(payout.amount || 0),
      0,
    );

    const completedPayouts = payouts
      .filter((payout) => payout.status === "PAID")
      .reduce((total, payout) => total + Number(payout.amount || 0), 0);

    /*
        ------------------------------------------------------
        WALLET
        ------------------------------------------------------
        */

    const totalCredits = transactions
      .filter((transaction) => transaction.type === "CREDIT")
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0,
      );

    const totalDebits = transactions
      .filter((transaction) => transaction.type === "DEBIT")
      .reduce(
        (total, transaction) => total + Number(transaction.amount || 0),
        0,
      );

    return {
      totalOrders,
      deliveredOrders,
      cancelledOrders,
      disputedOrders,
      activeOrders,
      totalEarnings,
      averageOrderValue,
      completionRate,
      rating,
      reviewCount,
      reportCount,
      totalOffers: offers.length,
      acceptedOffers,
      rejectedOffers,
      activeOffers,
      totalPayouts,
      completedPayouts,
      totalCredits,
      totalDebits,
      walletBalance: wallet?.balance ?? totalCredits - totalDebits,
    };
  }, [
    orders,
    reviews,
    reports,
    offers,
    payouts,
    transactions,
    wallet,
    courier,
  ]);

  /*
  ==========================================================
  NAVIGATION
  ==========================================================
  */

  const goToOrders = () => {
    navigate(`/admin/courier_orders/${id}`);
  };

  const goToWallet = () => {
    navigate(`/admin/courier_wallet/${id}`);
  };

  const goToPayouts = () => {
    navigate(`/admin/courier_payouts/${id}`);
  };

  const goToAnalytics = () => {
    navigate(`/admin/courier_analytics/${id}`);
  };

  const goToReviews = () => {
    navigate(`/admin/courier_reviews/${id}`);
  };

  const goToReports = () => {
    navigate(`/admin/courier_reports/${id}`);
  };

  const goToDocuments = () => {
    navigate(`/admin/courier_documents/${id}`);
  };

  const goToLiveTracking = () => {
    navigate(`/admin/courier_live_tracking/${id}`);
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <div className="courierFullProfile">
        <div className="courierFullProfile-loading">
          <div className="courierFullProfile-loadingHeader">
            <div className="courierFullProfile-skeletonAvatar" />

            <div className="courierFullProfile-loadingLines">
              <div
                className="
                  courierFullProfile-skeletonLine
                  courierFullProfile-skeletonLineLarge
                "
              />

              <div
                className="
                  courierFullProfile-skeletonLine
                  courierFullProfile-skeletonLineMedium
                "
              />

              <div
                className="
                  courierFullProfile-skeletonLine
                  courierFullProfile-skeletonLineSmall
                "
              />
            </div>
          </div>

          <div className="courierFullProfile-loadingStats">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="courierFullProfile-skeletonStat" />
            ))}
          </div>

          <div className="courierFullProfile-loadingBody">
            <div className="courierFullProfile-skeletonCard" />

            <div className="courierFullProfile-skeletonCard" />
          </div>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  ERROR / NOT FOUND
  ==========================================================
  */

  if (error || !courier) {
    return (
      <div className="courierFullProfile">
        <div className="courierFullProfile-errorPage">
          <div className="courierFullProfile-errorIcon">
            <FaExclamationTriangle />
          </div>

          <h1>Courier unavailable</h1>

          <p>{error || "We could not find this courier."}</p>

          <div className="courierFullProfile-errorActions">
            <button
              type="button"
              className="courierFullProfile-secondaryButton"
              onClick={() => navigate("/admin/courier_dashboard")}
            >
              <FaArrowLeft />

              <span>Back to Couriers</span>
            </button>

            <button
              type="button"
              className="courierFullProfile-primaryButton"
              onClick={handleRefresh}
            >
              <FaRedo />

              <span>Try Again</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  /*
  ==========================================================
  GUARANTOR HELPERS
  ==========================================================
  */

  const guarantorFullName = [courier.guarantorName, courier.guarantorLastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  const hasGuarantorInformation = Boolean(
    guarantorFullName ||
    courier.guarantorProfession ||
    courier.guarantorNumber ||
    courier.guarantorRelationship ||
    courier.guarantorAddress ||
    courier.guarantorEmail ||
    courier.guarantorNIN ||
    guarantorNINImageUrl,
  );

  /*
  ==========================================================
  COURIER NIN
  ==========================================================
  */

  const courierNIN =
    courier.courierNIN ||
    courier.nin ||
    courier.NIN ||
    courier.ninNumber ||
    courier.NINNumber ||
    courier.ninID ||
    courier.ninId ||
    null;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <div className="courierFullProfile">
      {/* ==================================================
          TOP BAR
      ================================================== */}

      <div className="courierFullProfile-topbar">
        <button
          type="button"
          className="courierFullProfile-backButton"
          onClick={() => navigate("/admin/courier_dashboard")}
        >
          <FaArrowLeft />

          <span>Back to Couriers</span>
        </button>

        <button
          type="button"
          className="courierFullProfile-refreshButton"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <FaRedo
            className={
              refreshing ? "courierFullProfile-refreshIconSpinning" : ""
            }
          />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ==================================================
          PROFILE HEADER
      ================================================== */}

      <CourierProfileHeader
        courier={courier}
        profileUrl={profileUrl}
        approvalLoading={approvalLoading}
        onApprove={handleApproval}
        onTrack={goToLiveTracking}
      />

      {/* ==================================================
          PROFILE STATS
      ================================================== */}

      <CourierProfileStats
        courier={courier}
        stats={courierStats}
        orders={orders}
        reviews={reviews}
        reports={reports}
        offers={offers}
        payouts={payouts}
        transactions={transactions}
        wallet={wallet}
      />

      {/* ==================================================
          QUICK ACTIONS
      ================================================== */}

      <CourierQuickActions
        courier={courier}
        stats={courierStats}
        onOrders={goToOrders}
        onWallet={goToWallet}
        onPayouts={goToPayouts}
        onAnalytics={goToAnalytics}
        onReviews={goToReviews}
        onReports={goToReports}
        onDocuments={goToDocuments}
        onTracking={goToLiveTracking}
      />

      {/* ==================================================
          MAIN CONTENT
      ================================================== */}

      <div className="courierFullProfile-mainGrid">
        {/* ==================================================
            LEFT COLUMN
        ================================================== */}

        <div className="courierFullProfile-mainColumn">
          <CourierInformation courier={courier} />

          {/* ==================================================
              COURIER IDENTITY DOCUMENTS
          ================================================== */}

          <section className="courierFullProfile-identityDocuments">
            <div className="courierFullProfile-sectionHeader">
              <div className="courierFullProfile-sectionHeaderIcon">
                <FaIdCard />
              </div>

              <div>
                <h2>Courier Identity</h2>

                <p>Courier identification and NIN information.</p>
              </div>
            </div>

            <div className="courierFullProfile-identityDocumentGrid">
              {/* ==================================================
                  COURIER NIN NUMBER
              ================================================== */}

              <div className="courierFullProfile-ninDetails">
                <div className="courierFullProfile-detailItem">
                  <div className="courierFullProfile-detailIcon">
                    <FaIdCard />
                  </div>

                  <div>
                    <span>NIN Number</span>

                    <strong>{courierNIN || "Not provided"}</strong>
                  </div>
                </div>

                <div className="courierFullProfile-detailItem">
                  <div className="courierFullProfile-detailIcon">
                    <FaUserFriends />
                  </div>

                  <div>
                    <span>Identification Status</span>

                    <strong
                      className={
                        courierNIN
                          ? "courierFullProfile-documentAvailable"
                          : "courierFullProfile-documentMissing"
                      }
                    >
                      {courierNIN ? "NIN Provided" : "NIN Not Provided"}
                    </strong>
                  </div>
                </div>
              </div>

              {/* ==================================================
                  COURIER NIN PHOTO
              ================================================== */}

              <div className="courierFullProfile-documentPhotoCard">
                <div className="courierFullProfile-documentPhotoHeader">
                  <div>
                    <span>Courier NIN Photo</span>

                    <strong>
                      {courierNINImageUrl
                        ? "NIN document uploaded"
                        : "No NIN photo uploaded"}
                    </strong>
                  </div>

                  <FaCamera />
                </div>

                <div className="courierFullProfile-documentPhoto">
                  {courierNINImageUrl ? (
                    <img
                      src={courierNINImageUrl}
                      alt="Courier NIN document"
                      onError={() => setCourierNINImageUrl(null)}
                    />
                  ) : (
                    <div className="courierFullProfile-noPhoto">
                      <div className="courierFullProfile-noPhotoIcon">
                        <FaImage />
                      </div>

                      <strong>No Photo</strong>

                      <span>Courier NIN photo not available</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </section>

          {/* ==================================================
              GUARANTOR INFORMATION
          ================================================== */}

          <section className="courierFullProfile-guarantorCard">
            <div className="courierFullProfile-sectionHeader">
              <div className="courierFullProfile-sectionHeaderIcon">
                <FaUserShield />
              </div>

              <div>
                <h2>Guarantor Information</h2>

                <p>Registered guarantor details for this courier.</p>
              </div>
            </div>

            {hasGuarantorInformation ? (
              <div className="courierFullProfile-guarantorContent">
                {/* ==================================================
                    GUARANTOR IDENTITY
                ================================================== */}

                <div className="courierFullProfile-guarantorIdentity">
                  <div className="courierFullProfile-guarantorAvatar">
                    {guarantorFullName
                      ? guarantorFullName
                          .split(" ")
                          .map((part) => part.charAt(0))
                          .join("")
                          .slice(0, 2)
                          .toUpperCase()
                      : "G"}
                  </div>

                  <div>
                    <span>Guarantor</span>

                    <strong>{guarantorFullName || "Name not provided"}</strong>
                  </div>
                </div>

                {/* ==================================================
                    GUARANTOR DETAILS
                ================================================== */}

                <div className="courierFullProfile-guarantorGrid">
                  {/* RELATIONSHIP */}

                  <div className="courierFullProfile-detailItem">
                    <div className="courierFullProfile-detailIcon">
                      <FaUserFriends />
                    </div>

                    <div>
                      <span>Relationship</span>

                      <strong>
                        {courier.guarantorRelationship || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  {/* PROFESSION */}

                  <div className="courierFullProfile-detailItem">
                    <div className="courierFullProfile-detailIcon">
                      <FaBriefcase />
                    </div>

                    <div>
                      <span>Profession</span>

                      <strong>
                        {courier.guarantorProfession || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  {/* PHONE */}

                  <div className="courierFullProfile-detailItem">
                    <div className="courierFullProfile-detailIcon">
                      <FaPhone />
                    </div>

                    <div>
                      <span>Phone Number</span>

                      <strong>
                        {courier.guarantorNumber || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  {/* EMAIL */}

                  <div className="courierFullProfile-detailItem">
                    <div className="courierFullProfile-detailIcon">
                      <FaEnvelope />
                    </div>

                    <div>
                      <span>Email</span>

                      <strong>
                        {courier.guarantorEmail || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  {/* ADDRESS */}

                  <div
                    className="
                      courierFullProfile-detailItem
                      courierFullProfile-detailItemWide
                    "
                  >
                    <div className="courierFullProfile-detailIcon">
                      <FaMapMarkerAlt />
                    </div>

                    <div>
                      <span>Address</span>

                      <strong>
                        {courier.guarantorAddress || "Not provided"}
                      </strong>
                    </div>
                  </div>

                  {/* GUARANTOR NIN */}

                  <div className="courierFullProfile-detailItem">
                    <div className="courierFullProfile-detailIcon">
                      <FaIdCard />
                    </div>

                    <div>
                      <span>NIN Number</span>

                      <strong>{courier.guarantorNIN || "Not provided"}</strong>
                    </div>
                  </div>
                </div>

                {/* ==================================================
                    GUARANTOR NIN PHOTO
                ================================================== */}

                <div className="courierFullProfile-guarantorNINPhotoSection">
                  <div className="courierFullProfile-documentPhotoHeader">
                    <div>
                      <span>Guarantor NIN Photo</span>

                      <strong>
                        {guarantorNINImageUrl
                          ? "NIN document uploaded"
                          : "No NIN photo uploaded"}
                      </strong>
                    </div>

                    <FaCamera />
                  </div>

                  <div className="courierFullProfile-documentPhoto">
                    {guarantorNINImageUrl ? (
                      <img
                        src={guarantorNINImageUrl}
                        alt="Guarantor NIN document"
                        onError={() => setGuarantorNINImageUrl(null)}
                      />
                    ) : (
                      <div className="courierFullProfile-noPhoto">
                        <div className="courierFullProfile-noPhotoIcon">
                          <FaImage />
                        </div>

                        <strong>No Photo</strong>

                        <span>Guarantor NIN photo not available</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* ==================================================
                    DOCUMENT ACTION
                ================================================== */}

                <div className="courierFullProfile-guarantorFooter">
                  <div>
                    <FaFileAlt />

                    <span>
                      {guarantorNINImageUrl
                        ? "Guarantor NIN document available"
                        : "Guarantor NIN document unavailable"}
                    </span>
                  </div>

                  <button type="button" onClick={goToDocuments}>
                    View Documents
                  </button>
                </div>
              </div>
            ) : (
              <div className="courierFullProfile-guarantorEmpty">
                <div className="courierFullProfile-guarantorEmptyIcon">
                  <FaUserShield />
                </div>

                <div>
                  <strong>No guarantor information</strong>

                  <span>
                    No guarantor details have been registered for this courier.
                  </span>
                </div>
              </div>
            )}
          </section>

          {/* ==================================================
              VEHICLE INFORMATION
          ================================================== */}

          <CourierVehicle courier={courier} />
        </div>

        {/* ==================================================
            RIGHT COLUMN
        ================================================== */}

        <aside className="courierFullProfile-sideColumn">
          {/* ==================================================
              CURRENT STATUS
          ================================================== */}

          <section className="courierFullProfile-statusCard">
            <div className="courierFullProfile-statusHeader">
              <span>Current Status</span>

              <span
                className={`
                  courierFullProfile-statusIndicator
                  ${
                    courier.isOnline
                      ? "courierFullProfile-statusIndicatorOnline"
                      : "courierFullProfile-statusIndicatorOffline"
                  }
                `}
              />
            </div>

            <div className="courierFullProfile-statusValue">
              <strong>{courier.isOnline ? "Online" : "Offline"}</strong>

              <span>
                {courier.isApproved ? "Approved courier" : "Approval required"}
              </span>
            </div>

            {courier.lat != null && courier.lng != null && (
              <div className="courierFullProfile-location">
                <span>Current Location</span>

                <strong>
                  {Number(courier.lat).toFixed(5)}

                  {" , "}

                  {Number(courier.lng).toFixed(5)}
                </strong>
              </div>
            )}
          </section>

          {/* ==================================================
              PERFORMANCE SNAPSHOT
          ================================================== */}

          <section className="courierFullProfile-performanceCard">
            <div className="courierFullProfile-sectionHeader">
              <div>
                <h2>Performance</h2>

                <p>Courier activity snapshot</p>
              </div>
            </div>

            <div className="courierFullProfile-performanceList">
              <div className="courierFullProfile-performanceRow">
                <span>Delivered Orders</span>

                <strong>{courierStats.deliveredOrders}</strong>
              </div>

              <div className="courierFullProfile-performanceRow">
                <span>Active Orders</span>

                <strong>{courierStats.activeOrders}</strong>
              </div>

              <div className="courierFullProfile-performanceRow">
                <span>Completion Rate</span>

                <strong>{courierStats.completionRate.toFixed(1)}%</strong>
              </div>

              <div className="courierFullProfile-performanceRow">
                <span>Average Order Value</span>

                <strong>
                  ₦
                  {Number(courierStats.averageOrderValue || 0).toLocaleString(
                    "en-NG",
                    {
                      maximumFractionDigits: 0,
                    },
                  )}
                </strong>
              </div>
            </div>
          </section>

          {/* ==================================================
              DOCUMENT STATUS
          ================================================== */}

          <section className="courierFullProfile-documentStatusCard">
            <div className="courierFullProfile-documentStatusIcon">
              <FaFileAlt />
            </div>

            <div className="courierFullProfile-documentStatusContent">
              <strong>Courier Documents</strong>

              <span>
                {courierNINImageUrl
                  ? "Courier NIN photo available"
                  : "Courier NIN photo not uploaded"}
              </span>
            </div>

            <button type="button" onClick={goToDocuments}>
              View
            </button>
          </section>

          {/* ==================================================
              GUARANTOR DOCUMENT STATUS
          ================================================== */}

          <section className="courierFullProfile-documentStatusCard">
            <div className="courierFullProfile-documentStatusIcon">
              <FaUserShield />
            </div>

            <div className="courierFullProfile-documentStatusContent">
              <strong>Guarantor Documents</strong>

              <span>
                {guarantorNINImageUrl
                  ? "Guarantor NIN photo available"
                  : "Guarantor NIN photo not uploaded"}
              </span>
            </div>

            <button type="button" onClick={goToDocuments}>
              View
            </button>
          </section>
        </aside>
      </div>

      {/* ==================================================
          ACTIVITY
      ================================================== */}

      <CourierActivity courier={courier} maxItems={15} />
    </div>
  );
}

export default CourierFullProfile;
