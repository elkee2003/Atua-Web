import React, { useCallback, useEffect, useMemo, useState } from "react";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import {
  Courier,
  Wallet,
  Transaction,
  Payout,
} from "../../../../../../../models";

import { FaExclamationTriangle, FaWallet } from "react-icons/fa";

import CourierWalletHeader from "./Components/CourierWalletHeader/CourierWalletHeader";

import CourierWalletStats from "./Components/CourierWalletStats/CourierWalletStats";

import CourierWalletBalance from "./Components/CourierWalletBalance/CourierWalletBalance";

import CourierWalletTransactions from "./Components/CourierWalletTransactions/CourierWalletTransactions";

import CourierWalletFilters from "./Components/CourierWalletFilters/CourierWalletFilters";

import CourierWalletSearch from "./Components/CourierWalletSearch/CourierWalletSearch";

import CourierWalletEmptyState from "./Components/CourierWalletEmptyState/CourierWalletEmptyState";

import "./CourierWallet.css";

function CourierWallet() {
  /*
  ==========================================================
  ROUTER
  ==========================================================
  */

  const { id: courierId } = useParams();

  const navigate = useNavigate();

  /*
  ==========================================================
  COURIER
  ==========================================================
  */

  const [courier, setCourier] = useState(null);

  /*
  ==========================================================
  WALLET
  ==========================================================
  */

  const [wallet, setWallet] = useState(null);

  /*
  ==========================================================
  TRANSACTIONS
  ==========================================================
  */

  const [transactions, setTransactions] = useState([]);

  /*
  ==========================================================
  PAYOUTS
  ==========================================================
  */

  const [payouts, setPayouts] = useState([]);

  /*
  ==========================================================
  PROFILE IMAGE URL
  ==========================================================
  */

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState(null);

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const [searchQuery, setSearchQuery] = useState("");

  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [typeFilter, setTypeFilter] = useState("ALL");

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [periodFilter, setPeriodFilter] = useState("ALL");

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
  LOAD COURIER PROFILE IMAGE
  ==========================================================
  
  THIS USES THE SAME METHOD THAT WORKS
  IN YOUR MAINPROFILE COMPONENT.
  
  ==========================================================
  */

  const fetchProfileImage = useCallback(async (courierData) => {
    /*
        ------------------------------------------------------
        RESET FIRST
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
        NO PROFILE PICTURE
        ------------------------------------------------------
        */

    if (!courierData.profilePic) {
      console.log("Courier has no profilePic.");

      return;
    }

    try {
      /*
          ----------------------------------------------------
          GET STORAGE PATH
          ----------------------------------------------------
          */

      const profilePath = courierData.profilePic;

      console.log("Courier profile picture path:", profilePath);

      /*
          ----------------------------------------------------
          IF IT IS ALREADY A FULL URL
          ----------------------------------------------------
          */

      if (
        typeof profilePath === "string" &&
        (profilePath.startsWith("http://") ||
          profilePath.startsWith("https://"))
      ) {
        setProfileUrl(profilePath);

        return;
      }

      /*
          ----------------------------------------------------
          GET AMPLIFY STORAGE URL
          ----------------------------------------------------
          */

      const result = await getUrl({
        path: profilePath,

        options: {
          validateObjectExistence: true,
        },
      });

      /*
          ----------------------------------------------------
          CHECK RESULT
          ----------------------------------------------------
          */

      if (result?.url) {
        const url = result.url.toString();

        console.log("Courier profile image URL:", url);

        setProfileUrl(url);
      } else {
        console.log("Amplify did not return a profile image URL.");

        setProfileUrl(null);
      }
    } catch (imageError) {
      console.error("Error fetching courier profile image:", imageError);

      setProfileUrl(null);
    }
  }, []);

  /*
  ==========================================================
  FETCH WALLET
  ==========================================================
  */

  const fetchWallet = useCallback(async (courierData) => {
    const walletId = courierData?.walletID;

    if (!walletId) {
      setWallet(null);

      setTransactions([]);

      setPayouts([]);

      return null;
    }

    const walletData = await DataStore.query(Wallet, walletId);

    setWallet(walletData || null);

    return walletData || null;
  }, []);

  /*
  ==========================================================
  FETCH TRANSACTIONS
  ==========================================================
  */

  const fetchTransactions = useCallback(async (walletData) => {
    const walletId = walletData?.id;

    if (!walletId) {
      setTransactions([]);

      return [];
    }

    const result = await DataStore.query(Transaction, (transaction) =>
      transaction.walletID.eq(walletId),
    );

    const sorted = [...result].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
    );

    setTransactions(sorted);

    return sorted;
  }, []);

  /*
  ==========================================================
  FETCH PAYOUTS
  ==========================================================
  */

  const fetchPayouts = useCallback(async (walletData) => {
    const walletId = walletData?.id;

    if (!walletId) {
      setPayouts([]);

      return [];
    }

    const result = await DataStore.query(Payout, (payout) =>
      payout.walletID.eq(walletId),
    );

    const sorted = [...result].sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
    );

    setPayouts(sorted);

    return sorted;
  }, []);

  /*
  ==========================================================
  FETCH EVERYTHING
  ==========================================================
  */

  const fetchWalletData = useCallback(
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
          FETCH COURIER
          ----------------------------------------------------
          */

        const courierData = await fetchCourier();

        /*
          ----------------------------------------------------
          FETCH PROFILE IMAGE
          ----------------------------------------------------
          */

        await fetchProfileImage(courierData);

        /*
          ----------------------------------------------------
          FETCH WALLET
          ----------------------------------------------------
          */

        const walletData = await fetchWallet(courierData);

        /*
          ----------------------------------------------------
          FETCH TRANSACTIONS + PAYOUTS
          ----------------------------------------------------
          */

        if (walletData) {
          await Promise.all([
            fetchTransactions(walletData),

            fetchPayouts(walletData),
          ]);
        } else {
          setTransactions([]);

          setPayouts([]);
        }
      } catch (fetchError) {
        console.error("Failed to load courier wallet:", fetchError);

        setError(fetchError?.message || "Failed to load courier wallet.");
      } finally {
        setLoading(false);

        setRefreshing(false);
      }
    },
    [
      fetchCourier,
      fetchProfileImage,
      fetchWallet,
      fetchTransactions,
      fetchPayouts,
    ],
  );

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    fetchWalletData();
  }, [fetchWalletData]);

  /*
  ==========================================================
  REAL-TIME COURIER OBSERVER
  ==========================================================
  */

  useEffect(() => {
    if (!courierId) {
      return undefined;
    }

    const courierSubscription = DataStore.observe(Courier, courierId).subscribe(
      ({ element }) => {
        if (!element) {
          return;
        }

        setCourier(element);

        /*
            --------------------------------------------------
            IMPORTANT:
            RELOAD IMAGE WHEN COURIER CHANGES
            --------------------------------------------------
            */

        fetchProfileImage(element);
      },
    );

    /*
      --------------------------------------------------------
      WALLET OBSERVER
      --------------------------------------------------------
      */

    const walletSubscription = DataStore.observe(Wallet).subscribe(
      ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          fetchWalletData({
            showLoading: false,
            showRefreshing: false,
          });
        }
      },
    );

    /*
      --------------------------------------------------------
      TRANSACTION OBSERVER
      --------------------------------------------------------
      */

    const transactionSubscription = DataStore.observe(Transaction).subscribe(
      ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          fetchWalletData({
            showLoading: false,
            showRefreshing: false,
          });
        }
      },
    );

    /*
      --------------------------------------------------------
      PAYOUT OBSERVER
      --------------------------------------------------------
      */

    const payoutSubscription = DataStore.observe(Payout).subscribe(
      ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          fetchWalletData({
            showLoading: false,
            showRefreshing: false,
          });
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

      walletSubscription.unsubscribe();

      transactionSubscription.unsubscribe();

      payoutSubscription.unsubscribe();
    };
  }, [courierId, fetchWalletData, fetchProfileImage]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    await fetchWalletData({
      showLoading: false,
      showRefreshing: true,
    });
  };

  /*
  ==========================================================
  FILTER RESET
  ==========================================================
  */

  const handleResetFilters = () => {
    setTypeFilter("ALL");

    setStatusFilter("ALL");

    setPeriodFilter("ALL");
  };

  /*
  ==========================================================
  ACTIVE FILTERS
  ==========================================================
  */

  const hasActiveFilters = useMemo(() => {
    return (
      typeFilter !== "ALL" || statusFilter !== "ALL" || periodFilter !== "ALL"
    );
  }, [typeFilter, statusFilter, periodFilter]);

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
  ERROR STATE
  ==========================================================
  */

  if (!loading && error) {
    return (
      <div className="courierWallet">
        <div className="courierWallet-error">
          <div className="courierWallet-errorIcon">
            <FaExclamationTriangle />
          </div>

          <h2>Unable to Load Courier Wallet</h2>

          <p>{error}</p>

          <button
            type="button"
            className="courierWallet-errorButton"
            onClick={() => fetchWalletData()}
          >
            Try Again
          </button>
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
    <main className="courierWallet">
      {/* ==================================================
          HEADER
      ================================================== */}

      <CourierWalletHeader
        courier={courier}
        wallet={wallet}
        profileUrl={profileUrl}
        onBack={() => navigate(-1)}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ==================================================
          LOADING
      ================================================== */}

      {loading ? (
        <div className="courierWallet-loading">
          <div className="courierWallet-loadingIcon">
            <FaWallet />
          </div>

          <span>Loading courier wallet...</span>
        </div>
      ) : (
        <>
          {/* ==================================================
              WALLET EMPTY
          ================================================== */}

          {!wallet ? (
            <CourierWalletEmptyState
              type="WALLET"
              actionLabel="Refresh"
              onAction={handleRefresh}
            />
          ) : (
            <>
              {/* ==================================================
                  WALLET STATS
              ================================================== */}

              <CourierWalletStats wallet={wallet} payouts={payouts} />

              {/* ==================================================
                  WALLET BALANCE
              ================================================== */}

              <CourierWalletBalance wallet={wallet} />

              {/* ==================================================
                  TRANSACTION SECTION
              ================================================== */}

              <div className="courierWallet-transactionSection">
                <div className="courierWallet-transactionControls">
                  <CourierWalletSearch
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    transactions={transactions}
                  />

                  <CourierWalletFilters
                    typeFilter={typeFilter}
                    setTypeFilter={setTypeFilter}
                    statusFilter={statusFilter}
                    setStatusFilter={setStatusFilter}
                    periodFilter={periodFilter}
                    setPeriodFilter={setPeriodFilter}
                  />
                </div>

                {/* ==================================================
                    TRANSACTIONS
                ================================================== */}

                {transactions.length === 0 ? (
                  <CourierWalletEmptyState type="TRANSACTIONS" />
                ) : (
                  <CourierWalletTransactions
                    transactions={transactions}
                    searchQuery={searchQuery}
                    typeFilter={typeFilter}
                    statusFilter={statusFilter}
                    periodFilter={periodFilter}
                  />
                )}
              </div>
            </>
          )}
        </>
      )}
    </main>
  );
}

export default CourierWallet;
