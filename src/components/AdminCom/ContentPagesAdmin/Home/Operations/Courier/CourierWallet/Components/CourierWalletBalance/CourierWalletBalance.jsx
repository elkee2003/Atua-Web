import React, { useMemo } from "react";

import {
  FaWallet,
  FaClock,
  FaMoneyBillWave,
  FaInfoCircle,
} from "react-icons/fa";

import "./CourierWalletBalance.css";

function CourierWalletBalance({ wallet }) {
  /*
  ==========================================================
  WALLET VALUES
  ==========================================================
  */

  const balance = Number(wallet?.balance) || 0;

  const pendingBalance = Number(wallet?.pendingBalance) || 0;

  const totalEarnings = Number(wallet?.totalEarnings) || 0;

  /*
  ==========================================================
  TOTAL WALLET POSITION
  ==========================================================
  */

  const totalWalletPosition = useMemo(() => {
    return balance + pendingBalance;
  }, [balance, pendingBalance]);

  /*
  ==========================================================
  PERCENTAGE BREAKDOWN
  ==========================================================
  */

  const balancePercentage =
    totalWalletPosition > 0 ? (balance / totalWalletPosition) * 100 : 0;

  const pendingPercentage =
    totalWalletPosition > 0 ? (pendingBalance / totalWalletPosition) * 100 : 0;

  /*
  ==========================================================
  CURRENCY FORMATTER
  ==========================================================
  */

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  /*
  ==========================================================
  DATE
  ==========================================================
  */

  const walletUpdatedAt = wallet?.updatedAt ? new Date(wallet.updatedAt) : null;

  const formattedUpdatedAt =
    walletUpdatedAt && !Number.isNaN(walletUpdatedAt.getTime())
      ? walletUpdatedAt.toLocaleString("en-NG", {
          day: "numeric",
          month: "short",
          year: "numeric",
          hour: "numeric",
          minute: "2-digit",
        })
      : null;

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierWalletBalance">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierWalletBalance-header">
        <div className="courierWalletBalance-heading">
          <div className="courierWalletBalance-headingIcon">
            <FaWallet />
          </div>

          <div>
            <h2>Wallet Balance</h2>

            <p>Current financial position</p>
          </div>
        </div>

        {formattedUpdatedAt && (
          <div className="courierWalletBalance-updated">
            <FaInfoCircle />

            <span>Updated {formattedUpdatedAt}</span>
          </div>
        )}
      </div>

      {/* ==================================================
          MAIN BALANCE
      ================================================== */}

      <div className="courierWalletBalance-main">
        <div className="courierWalletBalance-mainLabel">Available Balance</div>

        <div className="courierWalletBalance-mainAmount">
          {formatCurrency(balance)}
        </div>

        <div className="courierWalletBalance-mainDescription">
          Funds currently available in the courier wallet
        </div>
      </div>

      {/* ==================================================
          BALANCE BREAKDOWN
      ================================================== */}

      <div className="courierWalletBalance-breakdown">
        {/* ==================================================
            AVAILABLE
        ================================================== */}

        <div className="courierWalletBalance-breakdownItem">
          <div className="courierWalletBalance-itemHeader">
            <div className="courierWalletBalance-itemLabel">
              <span className="availableDot" />

              <span>Available</span>
            </div>

            <strong>{formatCurrency(balance)}</strong>
          </div>

          <div className="courierWalletBalance-progress">
            <div
              className="courierWalletBalance-progressAvailable"
              style={{
                width: `${balancePercentage}%`,
              }}
            />
          </div>
        </div>

        {/* ==================================================
            PENDING
        ================================================== */}

        <div className="courierWalletBalance-breakdownItem">
          <div className="courierWalletBalance-itemHeader">
            <div className="courierWalletBalance-itemLabel">
              <span className="pendingDot" />

              <span>Pending</span>
            </div>

            <strong>{formatCurrency(pendingBalance)}</strong>
          </div>

          <div className="courierWalletBalance-progress">
            <div
              className="courierWalletBalance-progressPending"
              style={{
                width: `${pendingPercentage}%`,
              }}
            />
          </div>
        </div>
      </div>

      {/* ==================================================
          LOWER SUMMARY
      ================================================== */}

      <div className="courierWalletBalance-summary">
        {/* ==================================================
            PENDING BALANCE
        ================================================== */}

        <div className="courierWalletBalance-summaryItem">
          <div className="courierWalletBalance-summaryIcon pending">
            <FaClock />
          </div>

          <div className="courierWalletBalance-summaryContent">
            <span>Pending Balance</span>

            <strong>{formatCurrency(pendingBalance)}</strong>
          </div>
        </div>

        {/* ==================================================
            TOTAL POSITION
        ================================================== */}

        <div className="courierWalletBalance-summaryItem">
          <div className="courierWalletBalance-summaryIcon position">
            <FaWallet />
          </div>

          <div className="courierWalletBalance-summaryContent">
            <span>Total Wallet Position</span>

            <strong>{formatCurrency(totalWalletPosition)}</strong>
          </div>
        </div>

        {/* ==================================================
            TOTAL EARNINGS
        ================================================== */}

        <div className="courierWalletBalance-summaryItem">
          <div className="courierWalletBalance-summaryIcon earnings">
            <FaMoneyBillWave />
          </div>

          <div className="courierWalletBalance-summaryContent">
            <span>Lifetime Earnings</span>

            <strong>{formatCurrency(totalEarnings)}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}

export default CourierWalletBalance;
