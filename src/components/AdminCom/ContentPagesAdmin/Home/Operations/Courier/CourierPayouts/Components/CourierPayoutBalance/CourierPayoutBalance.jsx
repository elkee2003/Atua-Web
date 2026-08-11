import React from "react";

import {
  FaClock,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaSpinner,
  FaWallet,
} from "react-icons/fa";

import "./CourierPayoutBalance.css";

function CourierPayoutBalance({
  wallet = null,
  pendingPayoutAmount = 0,
  processingPayoutAmount = 0,
  loading = false,
  onViewWallet,
}) {
  /*
  ==========================================================
  SAFE WALLET VALUES
  ==========================================================
  */

  const balance = Number(wallet?.balance ?? 0);

  const pendingBalance = Number(wallet?.pendingBalance ?? 0);

  const totalEarnings = Number(wallet?.totalEarnings ?? 0);

  /*
  ==========================================================
  PAYOUT VALUES
  ==========================================================
  */

  const pendingPayout = Number(pendingPayoutAmount ?? 0);

  const processingPayout = Number(processingPayoutAmount ?? 0);

  /*
  ==========================================================
  CURRENCY FORMAT
  ==========================================================
  */

  const formatCurrency = (value) => {
    return `₦${Number(value || 0).toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  if (loading) {
    return (
      <section className="courierPayoutBalance">
        {/* ==================================================
            MAIN BALANCE LOADING
        ================================================== */}

        <div className="courierPayoutBalance-main">
          <div className="courierPayoutBalance-loadingIcon" />

          <div className="courierPayoutBalance-loadingContent">
            <div className="courierPayoutBalance-loadingLabel" />

            <div className="courierPayoutBalance-loadingValue" />

            <div className="courierPayoutBalance-loadingDescription" />
          </div>
        </div>

        {/* ==================================================
            BREAKDOWN LOADING
        ================================================== */}

        <div className="courierPayoutBalance-breakdown">
          {[1, 2, 3, 4].map((item) => (
            <div key={item} className="courierPayoutBalance-item">
              <div className="courierPayoutBalance-loadingSmallIcon" />

              <div className="courierPayoutBalance-loadingSmallContent">
                <div className="courierPayoutBalance-loadingSmallLabel" />

                <div className="courierPayoutBalance-loadingSmallValue" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
  ==========================================================
  NO WALLET
  ==========================================================
  */

  if (!wallet) {
    return (
      <section className="courierPayoutBalance">
        <div className="courierPayoutBalance-noWallet">
          <div className="courierPayoutBalance-noWalletIcon">
            <FaExclamationCircle />
          </div>

          <div className="courierPayoutBalance-noWalletContent">
            <h3>Wallet Not Available</h3>

            <p>
              This courier does not have a wallet associated with their account
              yet.
            </p>
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
    <section className="courierPayoutBalance">
      {/* ==================================================
          MAIN AVAILABLE BALANCE
      ================================================== */}

      <div className="courierPayoutBalance-main">
        <div className="courierPayoutBalance-mainIcon">
          <FaWallet />
        </div>

        <div className="courierPayoutBalance-mainContent">
          <span className="courierPayoutBalance-mainLabel">
            Available Balance
          </span>

          <strong className="courierPayoutBalance-mainValue">
            {formatCurrency(balance)}
          </strong>

          <span className="courierPayoutBalance-mainDescription">
            Current wallet balance available to the courier.
          </span>
        </div>
      </div>

      {/* ==================================================
          FINANCIAL BREAKDOWN
      ================================================== */}

      <div className="courierPayoutBalance-breakdown">
        {/* ==================================================
            PENDING BALANCE
        ================================================== */}

        <div
          className="
            courierPayoutBalance-item
            courierPayoutBalance-pendingBalance
          "
        >
          <div className="courierPayoutBalance-itemIcon">
            <FaClock />
          </div>

          <div className="courierPayoutBalance-itemContent">
            <span>Pending Balance</span>

            <strong>{formatCurrency(pendingBalance)}</strong>
          </div>
        </div>

        {/* ==================================================
            PENDING PAYOUTS
        ================================================== */}

        <div
          className="
            courierPayoutBalance-item
            courierPayoutBalance-pendingPayout
          "
        >
          <div className="courierPayoutBalance-itemIcon">
            <FaMoneyBillWave />
          </div>

          <div className="courierPayoutBalance-itemContent">
            <span>Pending Payouts</span>

            <strong>{formatCurrency(pendingPayout)}</strong>
          </div>
        </div>

        {/* ==================================================
            PROCESSING PAYOUTS
        ================================================== */}

        <div
          className="
            courierPayoutBalance-item
            courierPayoutBalance-processing
          "
        >
          <div className="courierPayoutBalance-itemIcon">
            <FaSpinner />
          </div>

          <div className="courierPayoutBalance-itemContent">
            <span>Processing</span>

            <strong>{formatCurrency(processingPayout)}</strong>
          </div>
        </div>

        {/* ==================================================
            TOTAL EARNINGS
        ================================================== */}

        <div
          className="
            courierPayoutBalance-item
            courierPayoutBalance-earnings
          "
        >
          <div className="courierPayoutBalance-itemIcon">
            <FaWallet />
          </div>

          <div className="courierPayoutBalance-itemContent">
            <span>Total Earnings</span>

            <strong>{formatCurrency(totalEarnings)}</strong>
          </div>
        </div>
      </div>

      {/* ==================================================
          WALLET ACTION
      ================================================== */}

      {onViewWallet && (
        <div className="courierPayoutBalance-footer">
          <button
            type="button"
            className="courierPayoutBalance-walletButton"
            onClick={onViewWallet}
          >
            <FaWallet />

            <span>View Courier Wallet</span>
          </button>
        </div>
      )}
    </section>
  );
}

export default CourierPayoutBalance;
