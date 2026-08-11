import React from "react";

import {
  FaCheckCircle,
  FaClock,
  FaExclamationCircle,
  FaMoneyBillWave,
  FaSpinner,
  FaList,
} from "react-icons/fa";

import "./CourierPayoutStats.css";

function CourierPayoutStats({ payouts = [], loading = false }) {
  /*
    ==========================================================
    SAFE PAYOUT DATA
    ==========================================================
    */

  const safePayouts = Array.isArray(payouts) ? payouts.filter(Boolean) : [];

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
    CALCULATE STATS
    ==========================================================
    */

  const totalPayouts = safePayouts.length;

  const paidAmount = safePayouts
    .filter((payout) => payout.status === "PAID")
    .reduce((total, payout) => total + Number(payout.amount || 0), 0);

  const pendingAmount = safePayouts
    .filter((payout) => payout.status === "PENDING")
    .reduce((total, payout) => total + Number(payout.amount || 0), 0);

  const processingAmount = safePayouts
    .filter((payout) => payout.status === "PROCESSING")
    .reduce((total, payout) => total + Number(payout.amount || 0), 0);

  const failedAmount = safePayouts
    .filter((payout) => payout.status === "FAILED")
    .reduce((total, payout) => total + Number(payout.amount || 0), 0);

  /*
    ==========================================================
    STAT CARDS
    ==========================================================
    */

  const statCards = [
    {
      key: "total",

      label: "Total Payouts",

      value: totalPayouts.toLocaleString("en-NG"),

      description: "Payout records",

      icon: FaList,

      className: "courierPayoutStats-total",
    },

    {
      key: "paid",

      label: "Paid",

      value: formatCurrency(paidAmount),

      description: "Successfully paid",

      icon: FaCheckCircle,

      className: "courierPayoutStats-paid",
    },

    {
      key: "pending",

      label: "Pending",

      value: formatCurrency(pendingAmount),

      description: "Awaiting processing",

      icon: FaClock,

      className: "courierPayoutStats-pending",
    },

    {
      key: "processing",

      label: "Processing",

      value: formatCurrency(processingAmount),

      description: "Currently processing",

      icon: FaSpinner,

      className: "courierPayoutStats-processing",
    },

    {
      key: "failed",

      label: "Failed",

      value: formatCurrency(failedAmount),

      description: "Unsuccessful payouts",

      icon: FaExclamationCircle,

      className: "courierPayoutStats-failed",
    },
  ];

  /*
    ==========================================================
    LOADING
    ==========================================================
    */

  if (loading) {
    return (
      <section className="courierPayoutStats">
        <div className="courierPayoutStats-grid">
          {statCards.map((card) => (
            <div
              key={card.key}
              className="
                                    courierPayoutStats-card
                                "
            >
              <div
                className="
                                    courierPayoutStats-cardTop
                                "
              >
                <div
                  className="
                                        courierPayoutStats-loadingIcon
                                    "
                />

                <div
                  className="
                                        courierPayoutStats-loadingLabel
                                    "
                />
              </div>

              <div
                className="
                                    courierPayoutStats-loadingValue
                                "
              />

              <div
                className="
                                    courierPayoutStats-loadingDescription
                                "
              />
            </div>
          ))}
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
    <section className="courierPayoutStats">
      <div className="courierPayoutStats-grid">
        {statCards.map(
          ({ key, label, value, description, icon: Icon, className }) => (
            <div
              key={key}
              className={`
                                courierPayoutStats-card
                                ${className}
                            `}
            >
              {/* ==================================================
                                TOP
                            ================================================== */}

              <div
                className="
                                courierPayoutStats-cardTop
                            "
              >
                <div
                  className="
                                    courierPayoutStats-icon
                                "
                >
                  <Icon />
                </div>

                <span
                  className="
                                    courierPayoutStats-label
                                "
                >
                  {label}
                </span>
              </div>

              {/* ==================================================
                                VALUE
                            ================================================== */}

              <div
                className="
                                courierPayoutStats-value
                            "
              >
                {value}
              </div>

              {/* ==================================================
                                DESCRIPTION
                            ================================================== */}

              <div
                className="
                                courierPayoutStats-description
                            "
              >
                {description}
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
}

export default CourierPayoutStats;
