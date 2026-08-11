import React, { useCallback, useEffect, useMemo, useState } from "react";

import { FaExclamationTriangle, FaMoneyBillWave, FaRedo } from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { Courier, Wallet, Payout } from "../../../../../../../models";

import { getSignedUrl } from "../../../../../../../utils/s3";

import CourierPayoutsHeader from "./Components/CourierPayoutsHeader/CourierPayoutsHeader";

import CourierPayoutStats from "./Components/CourierPayoutStats/CourierPayoutStats";

import CourierPayoutBalance from "./Components/CourierPayoutBalance/CourierPayoutBalance";

import CourierPayoutSearch from "./Components/CourierPayoutSearch/CourierPayoutSearch";

import CourierPayoutFilters from "./Components/CourierPayoutFilters/CourierPayoutFilters";

import CourierPayoutTransactions from "./Components/CourierPayoutTransactions/CourierPayoutTransactions";

import CourierPayoutEmptyState from "./Components/CourierPayoutEmptyState/CourierPayoutEmptyState";

import "./CourierPayouts.css";

function CourierPayouts() {
  /*
  ==========================================================
  ROUTER
  ==========================================================
  */

  const navigate = useNavigate();

  const { id: courierId } = useParams();

  /*
  ==========================================================
  COURIER
  ==========================================================
  */

  const [courier, setCourier] = useState(null);

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  WALLET
  ==========================================================
  */

  const [wallet, setWallet] = useState(null);

  /*
  ==========================================================
  PAYOUTS
  ==========================================================
  */

  const [payouts, setPayouts] = useState([]);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

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

  const [searchQuery, setSearchQuery] = useState("");

  /*
  ==========================================================
  FILTER
  ==========================================================
  */

  const [statusFilter, setStatusFilter] = useState("ALL");

  /*
  ==========================================================
  FETCH COURIER
  ==========================================================
  */

  const fetchCourier = useCallback(async () => {
    if (!courierId) {
      throw new Error("Courier ID is missing.");
    }

    const courierData = await DataStore.query(Courier, courierId);

    if (!courierData) {
      throw new Error("Courier not found.");
    }

    setCourier(courierData);

    return courierData;
  }, [courierId]);

  /*
  ==========================================================
  FETCH PROFILE IMAGE
  ==========================================================
  */

  const fetchProfileImage = useCallback(async (courierData) => {
    if (!courierData?.profilePic) {
      setProfileUrl(null);

      return;
    }

    try {
      const signedUrl = await getSignedUrl(courierData.profilePic);

      setProfileUrl(signedUrl || null);
    } catch (imageError) {
      console.error("Failed to load courier profile image:", imageError);

      setProfileUrl(null);
    }
  }, []);

  /*
  ==========================================================
  FETCH WALLET
  ==========================================================

  Courier → walletID → Wallet

  This is only for the balance information.
  Payouts themselves are queried by courierID.
  ==========================================================
  */

  const fetchWallet = useCallback(async (courierData) => {
    const walletId = courierData?.walletID;

    if (!walletId) {
      setWallet(null);

      return null;
    }

    try {
      const walletData = await DataStore.query(Wallet, walletId);

      setWallet(walletData || null);

      return walletData || null;
    } catch (walletError) {
      console.error("Failed to fetch courier wallet:", walletError);

      setWallet(null);

      return null;
    }
  }, []);

  /*
  ==========================================================
  FETCH PAYOUTS
  ==========================================================

  IMPORTANT:

  Payout has:

      courierID: ID! @index(name: "byCourier")

  Therefore the courier-specific payout query is:

      Payout.courierID.eq(courierId)

  ==========================================================
  */

  const fetchPayouts = useCallback(async () => {
    if (!courierId) {
      setPayouts([]);

      return [];
    }

    const payoutData = await DataStore.query(Payout, (payout) =>
      payout.courierID.eq(courierId),
    );

    /*
        ------------------------------------------------------
        NEWEST PAYOUT FIRST
        ------------------------------------------------------
        */

    const sortedPayouts = [...payoutData].sort((a, b) => {
      const dateA = new Date(a?.createdAt || 0).getTime();

      const dateB = new Date(b?.createdAt || 0).getTime();

      return dateB - dateA;
    });

    setPayouts(sortedPayouts);

    return sortedPayouts;
  }, [courierId]);

  /*
  ==========================================================
  FETCH EVERYTHING
  ==========================================================
  */

  const fetchPayoutData = useCallback(
    async ({ showLoading = true, showRefreshing = false } = {}) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        if (showRefreshing) {
          setRefreshing(true);
        }

        setError(null);

        /*
          ----------------------------------------------------
          COURIER
          ----------------------------------------------------
          */

        const courierData = await fetchCourier();

        /*
          ----------------------------------------------------
          PROFILE IMAGE
          ----------------------------------------------------
          */

        await fetchProfileImage(courierData);

        /*
          ----------------------------------------------------
          WALLET
          ----------------------------------------------------
          */

        await fetchWallet(courierData);

        /*
          ----------------------------------------------------
          PAYOUTS
          ----------------------------------------------------
          */

        await fetchPayouts();
      } catch (fetchError) {
        console.error("Failed to load courier payouts:", fetchError);

        setError(fetchError?.message || "Unable to load courier payouts.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [fetchCourier, fetchProfileImage, fetchWallet, fetchPayouts],
  );

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    fetchPayoutData({
      showLoading: true,
      showRefreshing: false,
    });
  }, [fetchPayoutData]);

  /*
  ==========================================================
  COURIER REAL-TIME OBSERVER
  ==========================================================
  */

  useEffect(() => {
    if (!courierId) {
      return undefined;
    }

    const subscription = DataStore.observe(Courier, courierId).subscribe(
      ({ element }) => {
        if (!element) {
          return;
        }

        setCourier(element);

        fetchProfileImage(element);

        /*
          ----------------------------------------------------
          Wallet relationship may have changed.
          ----------------------------------------------------
          */

        fetchWallet(element);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [courierId, fetchProfileImage, fetchWallet]);

  /*
  ==========================================================
  WALLET REAL-TIME OBSERVER
  ==========================================================
  */

  useEffect(() => {
    if (!courierId) {
      return undefined;
    }

    if (!courier?.walletID) {
      return undefined;
    }

    const subscription = DataStore.observe(Wallet, courier.walletID).subscribe(
      ({ element }) => {
        if (!element) {
          return;
        }

        setWallet(element);
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [courierId, courier?.walletID]);

  /*
  ==========================================================
  PAYOUT REAL-TIME OBSERVER
  ==========================================================
  */

  useEffect(() => {
    if (!courierId) {
      return undefined;
    }

    const subscription = DataStore.observe(Payout).subscribe(
      ({ element, opType }) => {
        /*
          ----------------------------------------------------
          IMPORTANT

          Only refresh when the payout belongs to
          this courier.
          ----------------------------------------------------
          */

        if (element?.courierID === courierId) {
          fetchPayouts();

          return;
        }

        /*
          ----------------------------------------------------
          DELETE

          Refreshing is safer for DELETE because depending
          on the DataStore event, the deleted object may not
          contain every field we need.
          ----------------------------------------------------
          */

        if (opType === "DELETE") {
          fetchPayouts();
        }
      },
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [courierId, fetchPayouts]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    if (refreshing || loading) {
      return;
    }

    await fetchPayoutData({
      showLoading: false,
      showRefreshing: true,
    });
  };

  /*
  ==========================================================
  STATUS NORMALIZATION
  ==========================================================
  */

  const normalizeStatus = useCallback((status) => {
    if (!status) {
      return "";
    }

    return String(status).trim().toUpperCase();
  }, []);

  /*
  ==========================================================
  PAYOUT STATISTICS
  ==========================================================
  */

  const payoutStats = useMemo(() => {
    const total = payouts.length;

    const pending = payouts.filter(
      (payout) => normalizeStatus(payout.status) === "PENDING",
    ).length;

    const processing = payouts.filter(
      (payout) => normalizeStatus(payout.status) === "PROCESSING",
    ).length;

    const paid = payouts.filter(
      (payout) => normalizeStatus(payout.status) === "PAID",
    ).length;

    const failed = payouts.filter(
      (payout) => normalizeStatus(payout.status) === "FAILED",
    ).length;

    const totalAmount = payouts.reduce(
      (total, payout) => total + Number(payout.amount || 0),
      0,
    );

    const pendingAmount = payouts
      .filter((payout) => normalizeStatus(payout.status) === "PENDING")
      .reduce((total, payout) => total + Number(payout.amount || 0), 0);

    const processingAmount = payouts
      .filter((payout) => normalizeStatus(payout.status) === "PROCESSING")
      .reduce((total, payout) => total + Number(payout.amount || 0), 0);

    const paidAmount = payouts
      .filter((payout) => normalizeStatus(payout.status) === "PAID")
      .reduce((total, payout) => total + Number(payout.amount || 0), 0);

    const failedAmount = payouts
      .filter((payout) => normalizeStatus(payout.status) === "FAILED")
      .reduce((total, payout) => total + Number(payout.amount || 0), 0);

    return {
      total,
      pending,
      processing,
      paid,
      failed,
      totalAmount,
      pendingAmount,
      processingAmount,
      paidAmount,
      failedAmount,
    };
  }, [payouts, normalizeStatus]);

  /*
  ==========================================================
  FILTERED PAYOUTS
  ==========================================================
  */

  const filteredPayouts = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return payouts.filter((payout) => {
      /*
            --------------------------------------------------
            STATUS FILTER
            --------------------------------------------------
            */

      if (statusFilter !== "ALL") {
        const payoutStatus = normalizeStatus(payout.status);

        if (payoutStatus !== statusFilter) {
          return false;
        }
      }

      /*
            --------------------------------------------------
            SEARCH
            --------------------------------------------------

            These fields actually exist on Payout:
              id
              amount
              status
              bankName
              accountNumber
              reference
              walletID
            --------------------------------------------------
            */

      if (query) {
        const searchableText = [
          payout.id,
          payout.amount,
          payout.status,
          payout.bankName,
          payout.accountNumber,
          payout.reference,
          payout.walletID,
        ]
          .filter((value) => value !== null && value !== undefined)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [payouts, searchQuery, statusFilter, normalizeStatus]);

  /*
  ==========================================================
  BALANCE VALUES FOR PAYOUT BALANCE COMPONENT
  ==========================================================
  */

  const pendingPayoutAmount = payoutStats.pendingAmount;

  const processingPayoutAmount = payoutStats.processingAmount;

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const handleSearchChange = (value) => {
    setSearchQuery(value || "");
  };

  /*
  ==========================================================
  CLEAR SEARCH
  ==========================================================
  */

  const handleClearSearch = () => {
    setSearchQuery("");
  };

  /*
  ==========================================================
  CLEAR FILTERS
  ==========================================================
  */

  const handleClearFilters = () => {
    setSearchQuery("");

    setStatusFilter("ALL");
  };

  /*
  ==========================================================
  EMPTY STATE TYPE
  ==========================================================
  */

  const emptyStateType = useMemo(() => {
    if (payouts.length === 0) {
      return "NO_PAYOUTS";
    }

    if (searchQuery.trim()) {
      return "NO_SEARCH_RESULTS";
    }

    if (statusFilter !== "ALL") {
      return "NO_FILTER_RESULTS";
    }

    return "NO_PAYOUTS";
  }, [payouts.length, searchQuery, statusFilter]);

  /*
  ==========================================================
  EMPTY STATE ACTION
  ==========================================================
  */

  const handleEmptyStateAction = () => {
    if (emptyStateType === "NO_SEARCH_RESULTS") {
      setSearchQuery("");

      return;
    }

    if (emptyStateType === "NO_FILTER_RESULTS") {
      setStatusFilter("ALL");
    }
  };

  /*
  ==========================================================
  VIEW WALLET
  ==========================================================
  */

  const handleViewWallet = () => {
    if (!courierId) {
      return;
    }

    navigate(`/courier_wallet/${courierId}`);
  };

  /*
  ==========================================================
  VIEW PAYOUT
  ==========================================================
  */

  const handleViewPayout = (payout) => {
    if (!payout?.id) {
      return;
    }

    /*
      ------------------------------------------------------
      Keep this handler available for the payout transaction
      component.

      The exact payout-detail route has not been established
      in the supplied schema/routes, so we don't invent one.
      ------------------------------------------------------
      */

    console.log("Selected payout:", payout);
  };

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
  LIVE TRACK
  ==========================================================
  */

  const handleTrack = () => {
    if (!courierId) {
      return;
    }

    navigate(`/courier_tracking/${courierId}`);
  };

  /*
  ==========================================================
  MISSING COURIER ID
  ==========================================================
  */

  if (!courierId) {
    return (
      <main className="courierPayouts">
        <div className="courierPayouts-error">
          <div className="courierPayouts-errorIcon">
            <FaExclamationTriangle />
          </div>

          <h2>Courier ID Missing</h2>

          <p>No courier was specified for this payout page.</p>

          <button
            type="button"
            className="courierPayouts-errorButton"
            onClick={handleBack}
          >
            <FaRedo />

            <span>Go Back</span>
          </button>
        </div>
      </main>
    );
  }

  /*
  ==========================================================
  ERROR
  ==========================================================
  */

  if (error && !loading && !courier) {
    return (
      <main className="courierPayouts">
        <div className="courierPayouts-error">
          <div className="courierPayouts-errorIcon">
            <FaExclamationTriangle />
          </div>

          <h2>Unable to Load Courier Payouts</h2>

          <p>{error}</p>

          <button
            type="button"
            className="courierPayouts-errorButton"
            onClick={() =>
              fetchPayoutData({
                showLoading: true,
                showRefreshing: false,
              })
            }
          >
            <FaRedo />

            <span>Try Again</span>
          </button>
        </div>
      </main>
    );
  }

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <main className="courierPayouts">
      {/* ==================================================
          HEADER
      ================================================== */}

      <CourierPayoutsHeader
        courier={courier}
        profileUrl={profileUrl}
        onBack={handleBack}
        onTrack={handleTrack}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ==================================================
          INLINE ERROR
      ================================================== */}

      {error && courier && (
        <div className="courierPayouts-inlineError">
          <FaExclamationTriangle />

          <span>{error}</span>

          <button type="button" onClick={handleRefresh}>
            Try Again
          </button>
        </div>
      )}

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading ? (
        <div className="courierPayouts-loading">
          <div className="courierPayouts-loadingIcon">
            <FaMoneyBillWave />
          </div>

          <span>Loading courier payouts...</span>
        </div>
      ) : (
        <>
          {/* ==================================================
              PAYOUT STATISTICS
          ================================================== */}

          <CourierPayoutStats
            payouts={payouts}
            stats={payoutStats}
            loading={loading}
          />

          {/* ==================================================
              PAYOUT BALANCE
          ================================================== */}

          <CourierPayoutBalance
            wallet={wallet}
            pendingPayoutAmount={pendingPayoutAmount}
            processingPayoutAmount={processingPayoutAmount}
            loading={loading}
            onViewWallet={handleViewWallet}
          />

          {/* ==================================================
              SEARCH
          ================================================== */}

          <CourierPayoutSearch
            searchQuery={searchQuery}
            setSearchQuery={handleSearchChange}
            onClear={handleClearSearch}
          />

          {/* ==================================================
              FILTERS
          ================================================== */}

          <CourierPayoutFilters
            statusFilter={statusFilter}
            setStatusFilter={setStatusFilter}
            payouts={payouts}
          />

          {/* ==================================================
              PAYOUT TRANSACTIONS
          ================================================== */}

          {filteredPayouts.length === 0 ? (
            <CourierPayoutEmptyState
              type={emptyStateType}
              searchQuery={searchQuery}
              statusFilter={statusFilter}
              onAction={handleEmptyStateAction}
            />
          ) : (
            <CourierPayoutTransactions
              payouts={filteredPayouts}
              totalPayouts={payouts.length}
              loading={loading}
              onViewPayout={handleViewPayout}
              onClearFilters={handleClearFilters}
            />
          )}
        </>
      )}
    </main>
  );
}

export default CourierPayouts;
