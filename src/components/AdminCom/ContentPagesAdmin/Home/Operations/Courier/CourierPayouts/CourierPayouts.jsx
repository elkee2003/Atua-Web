import React, { useCallback, useEffect, useMemo, useState } from "react";

import {
  FaCheckCircle,
  FaExclamationTriangle,
  FaMoneyBillWave,
  FaRedo,
  FaTimes,
  FaWallet,
} from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { generateClient } from "aws-amplify/api";

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

/*
==========================================================
AMPLIFY GRAPHQL CLIENT
==========================================================

The admin payout is intentionally sent through the
processPayouts Lambda via the AppSync mutation.

The page does NOT modify the wallet directly.
==========================================================
*/

const client = generateClient();

/*
==========================================================
ADMIN PAYOUT RULES
==========================================================
*/

const ADMIN_PAYOUT_FEE = 100;

const PAYSTACK_MIN_TRANSFER_AMOUNT = 50;

const ADMIN_MIN_WALLET_BALANCE =
  ADMIN_PAYOUT_FEE + PAYSTACK_MIN_TRANSFER_AMOUNT;

/*
==========================================================
Business rules enforced by the Lambda:

- Admin payout has a flat ₦100 Atua payout fee.
- Admin payout has NO ₦3,000 business minimum.
- Paystack transfer amount must be at least ₦50.
- Therefore, the minimum wallet balance for an admin payout
  is ₦150 (₦50 transfer + ₦100 Atua fee).
- Requested amount cannot exceed:
    available balance - ₦100 Atua fee.
- The backend remains the final authority on the balance.
==========================================================
*/

const ADMIN_MAKE_PAYOUT = /* GraphQL */ `
  mutation AdminMakePayout($courierID: ID!, $requestedAmount: Float!) {
    adminMakePayout(courierID: $courierID, requestedAmount: $requestedAmount) {
      statusCode
      body
    }
  }
`;

/*
==========================================================
CURRENCY FORMATTER
==========================================================
*/

const formatPayoutCurrency = (amount = 0) => {
  return `₦${Number(amount || 0).toLocaleString("en-NG", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

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
ADMIN PAYOUT MODAL
==========================================================
*/

  const [payoutModalOpen, setPayoutModalOpen] = useState(false);

  const [payoutAmountInput, setPayoutAmountInput] = useState("");

  const [payoutSubmitting, setPayoutSubmitting] = useState(false);

  const [payoutError, setPayoutError] = useState(null);

  const [payoutSuccess, setPayoutSuccess] = useState(null);

  const [payoutConfirmation, setPayoutConfirmation] = useState(null);

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
MAKE PAYOUT
==========================================================

Opens the admin payout modal.

The admin can either:

1. Enter a specific amount
2. Choose "Empty Wallet"

The actual payout is performed by the
adminMakePayout AppSync mutation.
==========================================================
*/

  const handleMakePayout = () => {
    if (!courierId || !courier) {
      return;
    }

    /*
  --------------------------------------------------------
  Open a fresh payout form.
  --------------------------------------------------------
  */

    setPayoutAmountInput("");

    setPayoutError(null);

    setPayoutSuccess(null);

    setPayoutConfirmation(null);

    setPayoutModalOpen(true);
  };

  /*
==========================================================
CLOSE ADMIN PAYOUT MODAL
==========================================================
*/

  const handleClosePayoutModal = () => {
    /*
  --------------------------------------------------------
  Do not allow the admin to close the modal while the
  payout request is actively being submitted.
  --------------------------------------------------------
  */

    if (payoutSubmitting) {
      return;
    }

    setPayoutModalOpen(false);

    setPayoutAmountInput("");

    setPayoutError(null);

    setPayoutSuccess(null);

    setPayoutConfirmation(null);
  };

  /*
==========================================================
EMPTY WALLET
==========================================================

"Empty Wallet" means:

    payout amount
        =
    available wallet balance
        -
    ₦100 Atua payout fee

The backend remains the final authority.

==========================================================
*/

  const handleEmptyWallet = () => {
    const availableBalance = Number(wallet?.availableBalance || 0);

    if (
      !Number.isFinite(availableBalance) ||
      availableBalance < ADMIN_MIN_WALLET_BALANCE
    ) {
      setPayoutError(
        `This courier needs at least ₦${ADMIN_MIN_WALLET_BALANCE.toLocaleString(
          "en-NG",
        )} available to make an admin payout.`,
      );

      return;
    }

    const maximumPayoutAmount = Number(
      (availableBalance - ADMIN_PAYOUT_FEE).toFixed(2),
    );

    setPayoutError(null);
    setPayoutSuccess(null);
    setPayoutAmountInput(String(maximumPayoutAmount));
  };

  /*
==========================================================
SUBMIT ADMIN PAYOUT
==========================================================
*/

  const handleSubmitAdminPayout = async () => {
    if (!courierId || !courier) {
      setPayoutError("Courier information is missing.");

      return;
    }

    const availableBalance = Number(wallet?.availableBalance || 0);

    /*
  --------------------------------------------------------
  Normalize number input.

  This allows:

      10000
      10,000

  to both work.
  --------------------------------------------------------
  */

    const normalizedInput = String(payoutAmountInput || "")
      .replace(/,/g, "")
      .trim();

    const requestedAmount = Number(normalizedInput);

    setPayoutError(null);

    setPayoutSuccess(null);

    /*
  --------------------------------------------------------
  AMOUNT REQUIRED
  --------------------------------------------------------
  */

    if (!normalizedInput) {
      setPayoutError("Enter a payout amount or choose Empty Wallet.");

      return;
    }

    /*
  --------------------------------------------------------
  AMOUNT MUST BE VALID
  --------------------------------------------------------
  */

    if (!Number.isFinite(requestedAmount) || requestedAmount <= 0) {
      setPayoutError("Enter a valid payout amount greater than zero.");

      return;
    }

    /*
  --------------------------------------------------------
  COURIER MUST HAVE AVAILABLE BALANCE
  --------------------------------------------------------
  */

    if (!Number.isFinite(availableBalance) || availableBalance <= 0) {
      setPayoutError("This courier has no available balance to pay out.");

      return;
    }

    /*
      --------------------------------------------------------
      ADMIN PAYOUT FEE + MAXIMUM PAYOUT
      --------------------------------------------------------

      The requested amount is the amount sent to the courier.

      The ₦100 Atua fee is additional.

      Therefore:

          total wallet debit
              =
          requested amount + ₦100

      The requested amount cannot exceed:

          available balance - ₦100

      --------------------------------------------------------
    */

    const totalWalletDebit = Number(
      (requestedAmount + ADMIN_PAYOUT_FEE).toFixed(2),
    );

    const maximumPayoutAmount = Number(
      (availableBalance - ADMIN_PAYOUT_FEE).toFixed(2),
    );

    if (availableBalance < ADMIN_MIN_WALLET_BALANCE) {
      setPayoutError(
        `This courier needs at least ₦${ADMIN_MIN_WALLET_BALANCE.toLocaleString(
          "en-NG",
        )} available to make an admin payout.`,
      );

      return;
    }

    if (requestedAmount < PAYSTACK_MIN_TRANSFER_AMOUNT) {
      setPayoutError(
        `Admin payout must be at least ₦${PAYSTACK_MIN_TRANSFER_AMOUNT.toLocaleString(
          "en-NG",
        )}.`,
      );

      return;
    }

    if (requestedAmount > maximumPayoutAmount) {
      setPayoutError(
        `The payout amount cannot exceed ${formatPayoutCurrency(
          maximumPayoutAmount,
        )} because the ₦${ADMIN_PAYOUT_FEE.toLocaleString(
          "en-NG",
        )} Atua payout fee must also be deducted from the wallet.`,
      );

      return;
    }

    /*
  --------------------------------------------------------
  COURIER NAME
  --------------------------------------------------------
  */

    const courierName =
      [courier?.firstName, courier?.lastName].filter(Boolean).join(" ") ||
      courier?.name ||
      "this courier";

    /*
      --------------------------------------------------------
      OPEN IN-MODAL CONFIRMATION
      --------------------------------------------------------
    */

    setPayoutConfirmation({
      requestedAmount,
      totalWalletDebit,
      courierName,
    });

    return;
  };

  /*
==========================================================
CONFIRM ADMIN PAYOUT
==========================================================
*/

  const handleConfirmAdminPayout = async () => {
    if (!courierId || !payoutConfirmation) {
      return;
    }

    const { requestedAmount } = payoutConfirmation;

    try {
      setPayoutSubmitting(true);

      setPayoutError(null);

      /*
    ------------------------------------------------------
    CALL APPSYNC
    ------------------------------------------------------

    This invokes:

        adminMakePayout

    which routes to:

        processPayouts Lambda

    with:

        ADMIN_MANUAL
        MANUAL_SINGLE
    ------------------------------------------------------
    */

      const response = await client.graphql({
        query: ADMIN_MAKE_PAYOUT,

        variables: {
          courierID: courierId,
          requestedAmount,
        },
      });

      const result = response?.data?.adminMakePayout;

      if (!result) {
        throw new Error("The payout service returned no response.");
      }

      /*
    ------------------------------------------------------
    PARSE LAMBDA RESPONSE
    ------------------------------------------------------
    */

      let bodyResult = result.body;

      if (typeof bodyResult === "string") {
        try {
          bodyResult = JSON.parse(bodyResult);
        } catch (parseError) {
          console.warn("Could not parse payout response body:", parseError);
        }
      }

      /*
    ------------------------------------------------------
    HANDLE BACKEND FAILURE
    ------------------------------------------------------
    */

      if (Number(result.statusCode) >= 400 || bodyResult?.success === false) {
        throw new Error(
          bodyResult?.message || "The payout could not be initiated.",
        );
      }

      /*
    ------------------------------------------------------
    SUCCESS
    ------------------------------------------------------
    */

      setPayoutConfirmation(null);

      setPayoutSuccess(
        bodyResult?.message ||
          "Payout successfully initiated. Awaiting Paystack transfer confirmation.",
      );

      /*
    ------------------------------------------------------
    REFRESH PAGE DATA
    ------------------------------------------------------

    The DataStore observers should also receive the
    backend changes.

    We explicitly refresh as well so the admin interface
    immediately reflects the latest wallet/payout state.
    ------------------------------------------------------
    */

      await fetchPayoutData({
        showLoading: false,
        showRefreshing: false,
      });
    } catch (payoutErrorValue) {
      console.error("ADMIN MAKE PAYOUT ERROR:", payoutErrorValue);

      setPayoutError(
        payoutErrorValue?.message || "Unable to initiate the admin payout.",
      );
    } finally {
      setPayoutSubmitting(false);
    }
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
        onMakePayout={handleMakePayout}
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

      {/* ==================================================
    ADMIN PAYOUT MODAL
================================================== */}

      {payoutModalOpen && (
        <div
          className="courierPayouts-payoutModalOverlay"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !payoutSubmitting) {
              handleClosePayoutModal();
            }
          }}
        >
          <div
            className="courierPayouts-payoutModal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="admin-payout-title"
          >
            {/* ==================================================
          MODAL HEADER
      ================================================== */}

            <div className="courierPayouts-payoutModalHeader">
              <div>
                <h2
                  id="admin-payout-title"
                  className="courierPayouts-payoutModalTitle"
                >
                  Make Payout
                </h2>

                <p className="courierPayouts-payoutModalSubtitle">
                  Admin payout to this courier
                </p>
              </div>

              <button
                type="button"
                className="courierPayouts-payoutModalClose"
                onClick={handleClosePayoutModal}
                disabled={payoutSubmitting}
                aria-label="Close payout dialog"
              >
                <FaTimes />
              </button>
            </div>

            {/* ==================================================
          COURIER SUMMARY
      ================================================== */}

            <div className="courierPayouts-payoutCourierSummary">
              <div className="courierPayouts-payoutCourierName">
                {courier?.firstName || courier?.lastName
                  ? [courier?.firstName, courier?.lastName]
                      .filter(Boolean)
                      .join(" ")
                  : courier?.name || "Courier"}
              </div>

              <div className="courierPayouts-payoutAvailableBalance">
                <FaWallet />

                <span>
                  Available balance:{" "}
                  {formatPayoutCurrency(wallet?.availableBalance || 0)}
                </span>
              </div>
            </div>

            {/* ==================================================
                PAYOUT AMOUNT
            ================================================== */}

            <label
              htmlFor="admin-payout-amount"
              className="courierPayouts-payoutAmountLabel"
            >
              Payout Amount
            </label>

            <div className="courierPayouts-payoutAmountRow">
              <input
                id="admin-payout-amount"
                className="courierPayouts-payoutAmountInput"
                type="text"
                inputMode="decimal"
                value={payoutAmountInput}
                onChange={(event) => {
                  setPayoutAmountInput(event.target.value);
                  setPayoutError(null);
                  setPayoutSuccess(null);
                }}
                placeholder="Enter amount"
                disabled={payoutSubmitting}
              />

              <button
                type="button"
                className="courierPayouts-emptyWalletButton"
                onClick={handleEmptyWallet}
                disabled={
                  payoutSubmitting ||
                  Number(wallet?.availableBalance || 0) <
                    ADMIN_MIN_WALLET_BALANCE
                }
              >
                Empty Wallet
              </button>
            </div>

            {(() => {
              const normalizedPreviewInput = String(payoutAmountInput || "")
                .replace(/,/g, "")
                .trim();

              const previewAmount = Number(normalizedPreviewInput);

              if (!Number.isFinite(previewAmount) || previewAmount <= 0) {
                return null;
              }

              const previewTotalWalletDebit = Number(
                (previewAmount + ADMIN_PAYOUT_FEE).toFixed(2),
              );

              const previewRemainingBalance = Number(
                (
                  Number(wallet?.availableBalance || 0) -
                  previewTotalWalletDebit
                ).toFixed(2),
              );

              return (
                <div className="courierPayouts-payoutPreview">
                  <div className="courierPayouts-payoutPreviewRow">
                    <span>Payout amount</span>
                    <strong>{formatPayoutCurrency(previewAmount)}</strong>
                  </div>

                  <div className="courierPayouts-payoutPreviewRow">
                    <span>Atua payout fee</span>
                    <strong>{formatPayoutCurrency(ADMIN_PAYOUT_FEE)}</strong>
                  </div>

                  <div className="courierPayouts-payoutPreviewRow">
                    <span>Total wallet deduction</span>
                    <strong>
                      {formatPayoutCurrency(previewTotalWalletDebit)}
                    </strong>
                  </div>

                  <div className="courierPayouts-payoutPreviewRow">
                    <span>Courier receives</span>
                    <strong>{formatPayoutCurrency(previewAmount)}</strong>
                  </div>

                  <div className="courierPayouts-payoutPreviewRow">
                    <span>Remaining wallet balance</span>
                    <strong>
                      {formatPayoutCurrency(
                        Math.max(previewRemainingBalance, 0),
                      )}
                    </strong>
                  </div>
                </div>
              );
            })()}

            <p className="courierPayouts-payoutAmountNote">
              Admin payouts have a flat ₦100 Atua fee. The ₦3,000 courier
              minimum does not apply. The courier receives the requested amount,
              while the ₦100 fee is deducted separately from the wallet. Any
              Paystack transfer fee is covered by Atua from the ₦100 fee.
            </p>

            {payoutConfirmation && (
              <div className="courierPayouts-payoutConfirmation">
                <div className="courierPayouts-payoutConfirmationHeader">
                  <div className="courierPayouts-payoutConfirmationIcon">
                    <FaCheckCircle />
                  </div>

                  <div>
                    <h3 className="courierPayouts-payoutConfirmationTitle">
                      Confirm Payout
                    </h3>

                    <p className="courierPayouts-payoutConfirmationSubtitle">
                      Please review the payout details before continuing.
                    </p>
                  </div>
                </div>

                <div className="courierPayouts-payoutConfirmationCard">
                  <div className="courierPayouts-payoutConfirmationRow">
                    <span>Courier</span>

                    <strong>{payoutConfirmation.courierName}</strong>
                  </div>

                  <div className="courierPayouts-payoutConfirmationRow">
                    <span>Courier receives</span>

                    <strong>
                      {formatPayoutCurrency(payoutConfirmation.requestedAmount)}
                    </strong>
                  </div>

                  <div className="courierPayouts-payoutConfirmationRow">
                    <span>Atua payout fee</span>

                    <strong>{formatPayoutCurrency(ADMIN_PAYOUT_FEE)}</strong>
                  </div>

                  <div className="courierPayouts-payoutConfirmationRow courierPayouts-payoutConfirmationTotal">
                    <span>Total wallet deduction</span>

                    <strong>
                      {formatPayoutCurrency(
                        payoutConfirmation.totalWalletDebit,
                      )}
                    </strong>
                  </div>
                </div>

                <div className="courierPayouts-payoutConfirmationNotice">
                  The ₦3,000 courier-request minimum does not apply. This is an
                  admin payout.
                </div>

                <div className="courierPayouts-payoutConfirmationActions">
                  <button
                    type="button"
                    className="courierPayouts-payoutCancelButton"
                    onClick={() => {
                      if (payoutSubmitting) {
                        return;
                      }

                      setPayoutConfirmation(null);
                      setPayoutError(null);
                    }}
                    disabled={payoutSubmitting}
                  >
                    Back
                  </button>

                  <button
                    type="button"
                    className="courierPayouts-payoutConfirmButton"
                    onClick={handleConfirmAdminPayout}
                    disabled={payoutSubmitting}
                  >
                    {payoutSubmitting ? "Processing..." : "Confirm Payout"}
                  </button>
                </div>
              </div>
            )}

            {/* ==================================================
          ERROR
      ================================================== */}

            {payoutError && (
              <div
                className="courierPayouts-payoutMessage courierPayouts-payoutMessage-error"
                role="alert"
              >
                <FaExclamationTriangle />

                <span>{payoutError}</span>
              </div>
            )}

            {/* ==================================================
          SUCCESS
      ================================================== */}

            {payoutSuccess && (
              <div
                className="courierPayouts-payoutMessage courierPayouts-payoutMessage-success"
                role="status"
              >
                <FaCheckCircle />

                <span>{payoutSuccess}</span>
              </div>
            )}

            {/* ==================================================
          ACTIONS
      ================================================== */}

            {!payoutConfirmation && (
              <div className="courierPayouts-payoutModalActions">
                <button
                  type="button"
                  className="courierPayouts-payoutCancelButton"
                  onClick={handleClosePayoutModal}
                  disabled={payoutSubmitting}
                >
                  {payoutSuccess ? "Close" : "Cancel"}
                </button>

                {!payoutSuccess && (
                  <button
                    type="button"
                    className="courierPayouts-payoutSubmitButton"
                    onClick={handleSubmitAdminPayout}
                    disabled={payoutSubmitting}
                  >
                    {payoutSubmitting ? "Processing..." : "Make Payout"}
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export default CourierPayouts;
