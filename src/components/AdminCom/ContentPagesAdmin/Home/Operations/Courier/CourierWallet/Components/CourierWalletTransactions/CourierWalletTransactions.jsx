import React, { useMemo } from "react";

import { FaExchangeAlt, FaArrowUp, FaArrowDown, FaClock } from "react-icons/fa";

import CourierTransactionCard from "../CourierTransactionCard/CourierTransactionCard";

import "./CourierWalletTransactions.css";

function CourierWalletTransactions({
  transactions = [],
  searchQuery = "",
  typeFilter = "ALL",
  statusFilter = "ALL",
  periodFilter = "ALL",
}) {
  /*
  ==========================================================
  DATE PERIOD HELPER
  ==========================================================
  */

  const getPeriodStart = (period) => {
    if (period === "ALL") {
      return null;
    }

    const daysMap = {
      "7D": 7,
      "30D": 30,
      "90D": 90,
    };

    const days = daysMap[period] || 30;

    const date = new Date();

    date.setHours(0, 0, 0, 0);

    date.setDate(date.getDate() - (days - 1));

    return date;
  };

  /*
  ==========================================================
  FILTER TRANSACTIONS
  ==========================================================
  */

  const filteredTransactions = useMemo(() => {
    let data = [...transactions];

    /*
    ----------------------------------------------------------
    SEARCH
    ----------------------------------------------------------
    */

    if (searchQuery && searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();

      data = data.filter((transaction) => {
        const searchableText = [
          transaction?.description,

          transaction?.orderID,

          transaction?.paymentID,

          transaction?.id,

          transaction?.type,

          transaction?.status,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        return searchableText.includes(query);
      });
    }

    /*
    ----------------------------------------------------------
    TRANSACTION TYPE
    ----------------------------------------------------------
    */

    if (typeFilter !== "ALL") {
      data = data.filter((transaction) => transaction?.type === typeFilter);
    }

    /*
    ----------------------------------------------------------
    TRANSACTION STATUS
    ----------------------------------------------------------
    */

    if (statusFilter !== "ALL") {
      data = data.filter((transaction) => transaction?.status === statusFilter);
    }

    /*
    ----------------------------------------------------------
    PERIOD
    ----------------------------------------------------------
    */

    if (periodFilter !== "ALL") {
      const periodStart = getPeriodStart(periodFilter);

      if (periodStart) {
        data = data.filter((transaction) => {
          const transactionDate = new Date(transaction?.createdAt);

          if (Number.isNaN(transactionDate.getTime())) {
            return false;
          }

          return transactionDate >= periodStart;
        });
      }
    }

    /*
    ----------------------------------------------------------
    SORT
    ----------------------------------------------------------

    Newest transaction first.
    ----------------------------------------------------------
    */

    data.sort(
      (a, b) => new Date(b?.createdAt || 0) - new Date(a?.createdAt || 0),
    );

    return data;
  }, [transactions, searchQuery, typeFilter, statusFilter, periodFilter]);

  /*
  ==========================================================
  SUMMARY
  ==========================================================
  */

  const transactionSummary = useMemo(() => {
    const total = filteredTransactions.length;

    const credits = filteredTransactions.filter(
      (transaction) => transaction?.type === "CREDIT",
    );

    const debits = filteredTransactions.filter(
      (transaction) => transaction?.type === "DEBIT",
    );

    const creditAmount = credits.reduce(
      (sum, transaction) => sum + (Number(transaction?.amount) || 0),
      0,
    );

    const debitAmount = debits.reduce(
      (sum, transaction) => sum + (Number(transaction?.amount) || 0),
      0,
    );

    const pending = filteredTransactions.filter(
      (transaction) => transaction?.status === "PENDING",
    ).length;

    return {
      total,
      creditCount: credits.length,
      debitCount: debits.length,
      creditAmount,
      debitAmount,
      pending,
    };
  }, [filteredTransactions]);

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
  RENDER TRANSACTION
  ==========================================================
  */

  const renderTransaction = (transaction) => {
    return (
      <CourierTransactionCard key={transaction?.id} transaction={transaction} />
    );
  };

  /*
  ==========================================================
  RENDER
  ==========================================================
  */

  return (
    <section className="courierWalletTransactions">
      {/* ==================================================
          HEADER
      ================================================== */}

      <div className="courierWalletTransactions-header">
        <div className="courierWalletTransactions-heading">
          <div className="courierWalletTransactions-headingIcon">
            <FaExchangeAlt />
          </div>

          <div>
            <h2>Transactions</h2>

            <p>Wallet transaction history</p>
          </div>
        </div>

        <div className="courierWalletTransactions-count">
          {transactionSummary.total}{" "}
          {transactionSummary.total === 1 ? "transaction" : "transactions"}
        </div>
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      {filteredTransactions.length > 0 && (
        <div className="courierWalletTransactions-summary">
          {/* ==================================================
              CREDITS
          ================================================== */}

          <div className="courierWalletTransactions-summaryItem credit">
            <div className="courierWalletTransactions-summaryIcon">
              <FaArrowDown />
            </div>

            <div>
              <span>Credits</span>

              <strong>{formatCurrency(transactionSummary.creditAmount)}</strong>

              <small>
                {transactionSummary.creditCount}{" "}
                {transactionSummary.creditCount === 1
                  ? "transaction"
                  : "transactions"}
              </small>
            </div>
          </div>

          {/* ==================================================
              DEBITS
          ================================================== */}

          <div className="courierWalletTransactions-summaryItem debit">
            <div className="courierWalletTransactions-summaryIcon">
              <FaArrowUp />
            </div>

            <div>
              <span>Debits</span>

              <strong>{formatCurrency(transactionSummary.debitAmount)}</strong>

              <small>
                {transactionSummary.debitCount}{" "}
                {transactionSummary.debitCount === 1
                  ? "transaction"
                  : "transactions"}
              </small>
            </div>
          </div>

          {/* ==================================================
              PENDING
          ================================================== */}

          <div className="courierWalletTransactions-summaryItem pending">
            <div className="courierWalletTransactions-summaryIcon">
              <FaClock />
            </div>

            <div>
              <span>Pending</span>

              <strong>{transactionSummary.pending}</strong>

              <small>awaiting completion</small>
            </div>
          </div>
        </div>
      )}

      {/* ==================================================
          TRANSACTION LIST
      ================================================== */}

      {filteredTransactions.length > 0 ? (
        <div className="courierWalletTransactions-list">
          {filteredTransactions.map(renderTransaction)}
        </div>
      ) : (
        <div className="courierWalletTransactions-empty">
          <div className="courierWalletTransactions-emptyIcon">
            <FaExchangeAlt />
          </div>

          <h3>No transactions found</h3>

          <p>No wallet transactions match the current search or filters.</p>
        </div>
      )}
    </section>
  );
}

export default CourierWalletTransactions;
