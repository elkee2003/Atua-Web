import React, { useMemo } from "react";

import {
  FaWallet,
  FaClock,
  FaMoneyBillWave,
  FaUniversity,
  FaCheckCircle,
  FaHourglassHalf,
} from "react-icons/fa";

import "./CourierWalletStats.css";

function CourierWalletStats({ wallet, payouts = [] }) {
  /*
  ==========================================================
  SAFE WALLET VALUES
  ==========================================================
  */

  const balance = Number(wallet?.balance) || 0;

  const pendingBalance = Number(wallet?.pendingBalance) || 0;

  const totalEarnings = Number(wallet?.totalEarnings) || 0;

  /*
  ==========================================================
  PAYOUT STATISTICS
  ==========================================================
  */

  const payoutStats = useMemo(() => {
    const totalPayouts = payouts.reduce(
      (sum, payout) => sum + (Number(payout?.amount) || 0),
      0,
    );

    const paidPayouts = payouts.filter((payout) => payout?.status === "PAID");

    const pendingPayouts = payouts.filter(
      (payout) => payout?.status === "PENDING",
    );

    const processingPayouts = payouts.filter(
      (payout) => payout?.status === "PROCESSING",
    );

    const completedPayoutAmount = paidPayouts.reduce(
      (sum, payout) => sum + (Number(payout?.amount) || 0),
      0,
    );

    const pendingPayoutAmount = pendingPayouts.reduce(
      (sum, payout) => sum + (Number(payout?.amount) || 0),
      0,
    );

    const processingPayoutAmount = processingPayouts.reduce(
      (sum, payout) => sum + (Number(payout?.amount) || 0),
      0,
    );

    return {
      totalPayouts,
      paidCount: paidPayouts.length,
      pendingCount: pendingPayouts.length,
      processingCount: processingPayouts.length,
      completedPayoutAmount,
      pendingPayoutAmount,
      processingPayoutAmount,
    };
  }, [payouts]);

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
  STAT CARD
  ==========================================================
  */

  const StatCard = ({ icon, label, value, description, type = "default" }) => {
    return (
      <div
        className={`
          courierWalletStats-card
          courierWalletStats-${type}
        `}
      >
        <div className="courierWalletStats-cardTop">
          <div className="courierWalletStats-icon">{icon}</div>
        </div>

        <div className="courierWalletStats-cardContent">
          <span className="courierWalletStats-label">{label}</span>

          <strong className="courierWalletStats-value">{value}</strong>

          {description && (
            <span className="courierWalletStats-description">
              {description}
            </span>
          )}
        </div>
      </div>
    );
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierWalletStats">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierWalletStats-header">
        <div>
          <h2>Wallet Overview</h2>

          <p>Current financial position and payout summary</p>
        </div>
      </div>

      {/* ==================================================
          STAT GRID
      ================================================== */}

      <div className="courierWalletStats-grid">
        {/* ==================================================
            AVAILABLE BALANCE
        ================================================== */}

        <StatCard
          icon={<FaWallet />}
          label="Available Balance"
          value={formatCurrency(balance)}
          description="Available for payout"
          type="balance"
        />

        {/* ==================================================
            PENDING BALANCE
        ================================================== */}

        <StatCard
          icon={<FaClock />}
          label="Pending Balance"
          value={formatCurrency(pendingBalance)}
          description="Funds awaiting release"
          type="pending"
        />

        {/* ==================================================
            TOTAL EARNINGS
        ================================================== */}

        <StatCard
          icon={<FaMoneyBillWave />}
          label="Total Earnings"
          value={formatCurrency(totalEarnings)}
          description="Lifetime courier earnings"
          type="earnings"
        />

        {/* ==================================================
            TOTAL PAYOUTS
        ================================================== */}

        <StatCard
          icon={<FaUniversity />}
          label="Total Payouts"
          value={formatCurrency(payoutStats.totalPayouts)}
          description={`${payouts.length} payout${
            payouts.length === 1 ? "" : "s"
          } recorded`}
          type="payout"
        />

        {/* ==================================================
            COMPLETED PAYOUTS
        ================================================== */}

        <StatCard
          icon={<FaCheckCircle />}
          label="Completed Payouts"
          value={formatCurrency(payoutStats.completedPayoutAmount)}
          description={`${payoutStats.paidCount} completed payout${
            payoutStats.paidCount === 1 ? "" : "s"
          }`}
          type="completed"
        />

        {/* ==================================================
            PENDING PAYOUTS
        ================================================== */}

        <StatCard
          icon={<FaHourglassHalf />}
          label="Pending / Processing"
          value={formatCurrency(
            payoutStats.pendingPayoutAmount +
              payoutStats.processingPayoutAmount,
          )}
          description={`${payoutStats.pendingCount} pending · ${payoutStats.processingCount} processing`}
          type="processing"
        />
      </div>
    </section>
  );
}

export default CourierWalletStats;
