import React from "react";

import {
  FaChartLine,
  FaClipboardList,
  FaFileAlt,
  FaFlag,
  FaMapMarkedAlt,
  FaMoneyBillWave,
  FaStar,
  FaWallet,
} from "react-icons/fa";

import "./CourierQuickActions.css";

function CourierQuickActions({
  courier,
  stats = {},

  onOrders,
  onWallet,
  onPayouts,
  onAnalytics,
  onReviews,
  onReports,
  onDocuments,
  onTracking,
}) {
  /*
  ==========================================================
  SAFETY
  ==========================================================
  */

  if (!courier) {
    return null;
  }

  /*
  ==========================================================
  SAFE STAT VALUES
  ==========================================================
  */

  const totalOrders = Number(stats.totalOrders ?? 0);

  const walletBalance = Number(stats.walletBalance ?? 0);

  const completedPayouts = Number(stats.completedPayouts ?? 0);

  const completionRate = Number(stats.completionRate ?? 0);

  const reviewCount = Number(stats.reviewCount ?? 0);

  const rating = Number(stats.rating ?? courier.averageRating ?? 0);

  const reportCount = Number(stats.reportCount ?? 0);

  /*
  ==========================================================
  FORMAT CURRENCY
  ==========================================================
  */

  const formatCurrency = (amount) => {
    return `₦${amount.toLocaleString("en-NG", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    })}`;
  };

  /*
  ==========================================================
  ACTIONS
  ==========================================================
  */

  const actions = [
    {
      key: "orders",

      label: "Orders",

      description: `${totalOrders.toLocaleString()} total`,

      icon: FaClipboardList,

      className: "courierQuickActions-orders",

      onClick: onOrders,

      disabled: !onOrders,
    },

    {
      key: "wallet",

      label: "Wallet",

      description: formatCurrency(walletBalance),

      icon: FaWallet,

      className: "courierQuickActions-wallet",

      onClick: onWallet,

      disabled: !onWallet,
    },

    {
      key: "payouts",

      label: "Payouts",

      description: formatCurrency(completedPayouts),

      icon: FaMoneyBillWave,

      className: "courierQuickActions-payouts",

      onClick: onPayouts,

      disabled: !onPayouts,
    },

    {
      key: "analytics",

      label: "Analytics",

      description: `${completionRate.toFixed(0)}% completion`,

      icon: FaChartLine,

      className: "courierQuickActions-analytics",

      onClick: onAnalytics,

      disabled: !onAnalytics,
    },

    {
      key: "reviews",

      label: "Reviews",

      description:
        rating > 0
          ? `${rating.toFixed(1)} rating · ${reviewCount} reviews`
          : `${reviewCount} reviews`,

      icon: FaStar,

      className: "courierQuickActions-reviews",

      onClick: onReviews,

      disabled: !onReviews,
    },

    {
      key: "reports",

      label: "Reports",

      description: `${reportCount.toLocaleString()} ${
        reportCount === 1 ? "report" : "reports"
      }`,

      icon: FaFlag,

      className: "courierQuickActions-reports",

      onClick: onReports,

      disabled: !onReports,
    },

    {
      key: "documents",

      label: "Documents",

      description: "View courier records",

      icon: FaFileAlt,

      className: "courierQuickActions-documents",

      onClick: onDocuments,

      disabled: !onDocuments,
    },

    {
      key: "tracking",

      label: "Live Tracking",

      description: courier.isOnline ? "Currently online" : "Currently offline",

      icon: FaMapMarkedAlt,

      className: "courierQuickActions-tracking",

      onClick: onTracking,

      disabled: !onTracking,
    },
  ];

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierQuickActions">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierQuickActions-header">
        <div className="courierQuickActions-heading">
          <h2>Quick Actions</h2>

          <p>Manage this courier's operations and records.</p>
        </div>
      </div>

      {/* ==================================================
          ACTION GRID
      ================================================== */}

      <div className="courierQuickActions-grid">
        {actions.map(
          ({
            key,
            label,
            description,
            icon: Icon,
            className,
            onClick,
            disabled,
          }) => (
            <button
              key={key}
              type="button"
              className={`
                courierQuickActions-card
                ${className}
              `}
              onClick={onClick}
              disabled={disabled}
            >
              {/* ==================================================
                  ICON
              ================================================== */}

              <span
                className="
                courierQuickActions-icon
              "
              >
                <Icon />
              </span>

              {/* ==================================================
                  CONTENT
              ================================================== */}

              <span
                className="
                courierQuickActions-content
              "
              >
                <strong>{label}</strong>

                <span>{description}</span>
              </span>

              {/* ==================================================
                  ARROW
              ================================================== */}

              <span
                className="
                courierQuickActions-arrow
              "
              >
                →
              </span>
            </button>
          ),
        )}
      </div>
    </section>
  );
}

export default CourierQuickActions;
