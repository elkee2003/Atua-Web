import React from "react";

import { FaMoneyBillWave } from "react-icons/fa";

import CourierPayoutCard from "../CourierPayoutCard/CourierPayoutCard";
import CourierPayoutEmptyState from "../CourierPayoutEmptyState/CourierPayoutEmptyState";

import "./CourierPayoutTransactions.css";

function CourierPayoutTransactions({
  payouts = [],
  loading = false,
  onViewPayout,
}) {
  /*
    ==========================================================
    SAFE PAYOUT DATA
    ==========================================================
    */

  const safePayouts = Array.isArray(payouts) ? payouts.filter(Boolean) : [];

  const payoutCount = safePayouts.length;

  /*
    ==========================================================
    LOADING STATE
    ==========================================================
    */

  if (loading) {
    return (
      <section className="courierPayoutTransactions">
        <div className="courierPayoutTransactions-header">
          <div className="courierPayoutTransactions-heading">
            <div className="courierPayoutTransactions-titleRow">
              <div className="courierPayoutTransactions-titleIcon">
                <FaMoneyBillWave />
              </div>

              <div className="courierPayoutTransactions-titleContent">
                <h2>Payout Transactions</h2>

                <p>Loading payout history...</p>
              </div>
            </div>
          </div>
        </div>

        <div className="courierPayoutTransactions-list">
          {[1, 2, 3].map((item) => (
            <div key={item} className="courierPayoutTransactions-loadingCard">
              <div className="courierPayoutTransactions-loadingLeft">
                <div className="courierPayoutTransactions-loadingIcon" />

                <div className="courierPayoutTransactions-loadingContent">
                  <div className="courierPayoutTransactions-loadingReference" />

                  <div className="courierPayoutTransactions-loadingBank" />
                </div>
              </div>

              <div className="courierPayoutTransactions-loadingRight">
                <div className="courierPayoutTransactions-loadingAmount" />

                <div className="courierPayoutTransactions-loadingStatus" />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }

  /*
    ==========================================================
    EMPTY STATE
    ==========================================================
    */

  if (payoutCount === 0) {
    return (
      <section className="courierPayoutTransactions">
        <div className="courierPayoutTransactions-header">
          <div className="courierPayoutTransactions-heading">
            <div className="courierPayoutTransactions-titleRow">
              <div className="courierPayoutTransactions-titleIcon">
                <FaMoneyBillWave />
              </div>

              <div className="courierPayoutTransactions-titleContent">
                <h2>Payout Transactions</h2>

                <p>No payout transactions found.</p>
              </div>
            </div>
          </div>

          <div className="courierPayoutTransactions-count">
            <span>0</span>

            <small>payouts</small>
          </div>
        </div>

        <CourierPayoutEmptyState />
      </section>
    );
  }

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <section className="courierPayoutTransactions">
      {/* ==================================================
                HEADER
            ================================================== */}

      <div className="courierPayoutTransactions-header">
        <div className="courierPayoutTransactions-heading">
          <div className="courierPayoutTransactions-titleRow">
            <div className="courierPayoutTransactions-titleIcon">
              <FaMoneyBillWave />
            </div>

            <div className="courierPayoutTransactions-titleContent">
              <h2>Payout Transactions</h2>

              <p>Review this courier's payout history.</p>
            </div>
          </div>
        </div>

        {/* ==================================================
                    PAYOUT COUNT
                ================================================== */}

        <div className="courierPayoutTransactions-count">
          <span>{payoutCount}</span>

          <small>{payoutCount === 1 ? "payout" : "payouts"}</small>
        </div>
      </div>

      {/* ==================================================
                PAYOUT LIST
            ================================================== */}

      <div className="courierPayoutTransactions-list">
        {safePayouts.map((payout) => (
          <CourierPayoutCard
            key={payout.id}
            payout={payout}
            onView={onViewPayout}
          />
        ))}
      </div>
    </section>
  );
}

export default CourierPayoutTransactions;
