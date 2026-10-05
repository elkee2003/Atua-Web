import React, { useCallback, useEffect, useMemo, useState } from "react";

import { DataStore } from "aws-amplify/datastore";

import { AdminAlert } from "../../../../models";

import {
  faArrowDown,
  faArrowUp,
  faBell,
  faCheck,
  faCheckCircle,
  faChevronDown,
  faClock,
  faCoins,
  faExclamationCircle,
  faExclamationTriangle,
  faFilter,
  faInfoCircle,
  faMoneyBillTransfer,
  faRefresh,
  faSearch,
  faShieldHalved,
  faTriangleExclamation,
  faWallet,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";

import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

import "./Alerts.css";

/* ==========================================================
   CONSTANTS
========================================================== */

const ALERT_TYPES = {
  ALL: "ALL",
  PAYOUT: "PAYOUT",
  ORDER: "ORDER",
  COURIER: "COURIER",
  PAYMENT: "PAYMENT",
  SYSTEM: "SYSTEM",
};

const ALERT_SEVERITIES = {
  CRITICAL: "CRITICAL",
  WARNING: "WARNING",
  INFO: "INFO",
  SUCCESS: "SUCCESS",
};

const ALERT_STATUSES = {
  UNREAD: "UNREAD",
  READ: "READ",
  RESOLVED: "RESOLVED",
  DISMISSED: "DISMISSED",
};

/* ==========================================================
   CURRENCY FORMATTER
========================================================== */

const formatCurrency = (value) => {
  const numericValue = Number(value || 0);

  if (!Number.isFinite(numericValue)) {
    return "₦0.00";
  }

  return new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

/* ==========================================================
   DATE FORMATTERS
========================================================== */

const formatDate = (value) => {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat("en-NG", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const formatRelativeTime = (value) => {
  if (!value) {
    return "Unknown time";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Unknown time";
  }

  const now = new Date();

  const difference = now.getTime() - date.getTime();

  const seconds = Math.floor(difference / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (seconds < 30) {
    return "Just now";
  }

  if (seconds < 60) {
    return `${seconds}s ago`;
  }

  if (minutes < 60) {
    return `${minutes}m ago`;
  }

  if (hours < 24) {
    return `${hours}h ago`;
  }

  if (days < 7) {
    return `${days}d ago`;
  }

  return formatDate(value);
};

/* ==========================================================
   NORMALIZE ALERT VALUES
========================================================== */

const normalizeValue = (value) => {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim().toUpperCase();
};

/* ==========================================================
   ALERT TYPE HELPERS
========================================================== */

const getAlertType = (alert) => {
  const type = normalizeValue(alert?.type);

  if (type === ALERT_TYPES.PAYOUT) {
    return ALERT_TYPES.PAYOUT;
  }

  if (type === ALERT_TYPES.ORDER) {
    return ALERT_TYPES.ORDER;
  }

  if (type === ALERT_TYPES.COURIER) {
    return ALERT_TYPES.COURIER;
  }

  if (type === ALERT_TYPES.PAYMENT) {
    return ALERT_TYPES.PAYMENT;
  }

  return ALERT_TYPES.SYSTEM;
};

const getSeverity = (alert) => {
  const severity = normalizeValue(alert?.severity);

  if (
    severity === ALERT_SEVERITIES.CRITICAL ||
    severity === ALERT_SEVERITIES.WARNING ||
    severity === ALERT_SEVERITIES.SUCCESS ||
    severity === ALERT_SEVERITIES.INFO
  ) {
    return severity;
  }

  return ALERT_SEVERITIES.INFO;
};

const getStatus = (alert) => {
  const status = normalizeValue(alert?.status);

  if (
    status === ALERT_STATUSES.UNREAD ||
    status === ALERT_STATUSES.READ ||
    status === ALERT_STATUSES.RESOLVED ||
    status === ALERT_STATUSES.DISMISSED
  ) {
    return status;
  }

  return ALERT_STATUSES.UNREAD;
};

/* ==========================================================
   DISPLAY LABELS
========================================================== */

const getTypeLabel = (type) => {
  switch (type) {
    case ALERT_TYPES.PAYOUT:
      return "Payout";

    case ALERT_TYPES.ORDER:
      return "Order";

    case ALERT_TYPES.COURIER:
      return "Courier";

    case ALERT_TYPES.PAYMENT:
      return "Payment";

    case ALERT_TYPES.SYSTEM:
      return "System";

    default:
      return "System";
  }
};

const getSeverityLabel = (severity) => {
  switch (severity) {
    case ALERT_SEVERITIES.CRITICAL:
      return "Critical";

    case ALERT_SEVERITIES.WARNING:
      return "Warning";

    case ALERT_SEVERITIES.SUCCESS:
      return "Success";

    case ALERT_SEVERITIES.INFO:
      return "Information";

    default:
      return "Information";
  }
};

/* ==========================================================
   ICON HELPERS
========================================================== */

const getSeverityIcon = (severity) => {
  switch (severity) {
    case ALERT_SEVERITIES.CRITICAL:
      return faTriangleExclamation;

    case ALERT_SEVERITIES.WARNING:
      return faExclamationTriangle;

    case ALERT_SEVERITIES.SUCCESS:
      return faCheckCircle;

    case ALERT_SEVERITIES.INFO:
    default:
      return faInfoCircle;
  }
};

const getTypeIcon = (type) => {
  switch (type) {
    case ALERT_TYPES.PAYOUT:
      return faMoneyBillTransfer;

    case ALERT_TYPES.ORDER:
      return faShieldHalved;

    case ALERT_TYPES.COURIER:
      return faBell;

    case ALERT_TYPES.PAYMENT:
      return faCoins;

    case ALERT_TYPES.SYSTEM:
    default:
      return faInfoCircle;
  }
};

/* ==========================================================
   ALERT CENTER
========================================================== */

function AlertCenter() {
  /* ========================================================
     STATE
  ======================================================== */

  const [alerts, setAlerts] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [error, setError] = useState("");

  const [searchTerm, setSearchTerm] = useState("");

  const [activeFilter, setActiveFilter] = useState(ALERT_TYPES.ALL);

  const [activeSeverity, setActiveSeverity] = useState(
    ALERT_SEVERITIES.ALL || "ALL",
  );

  const [selectedAlert, setSelectedAlert] = useState(null);

  const [showFilters, setShowFilters] = useState(false);

  /* ========================================================
     FETCH ALERTS
  ======================================================== */

  const fetchAlerts = useCallback(async ({ showRefresh = false } = {}) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const results = await DataStore.query(AdminAlert);

      /*
       * Newest alerts first.
       *
       * createdAt is explicitly present in the schema,
       * so we use it as the primary sort field.
       */
      const sortedAlerts = [...(results || [])].sort((a, b) => {
        const aTime = new Date(a?.createdAt || 0).getTime();

        const bTime = new Date(b?.createdAt || 0).getTime();

        return bTime - aTime;
      });

      setAlerts(sortedAlerts);
    } catch (fetchError) {
      console.error("AlertCenter: failed to load admin alerts:", fetchError);

      setError(fetchError?.message || "Unable to load admin alerts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /* ========================================================
     INITIAL LOAD + REAL-TIME SUBSCRIPTION
  ======================================================== */

  useEffect(() => {
    fetchAlerts();

    /*
     * AdminAlert is a DataStore model.
     *
     * We subscribe to changes so the Alert Center updates
     * automatically when the backend creates or updates
     * alerts.
     */
    const subscription = DataStore.observe(AdminAlert).subscribe({
      next: () => {
        fetchAlerts();
      },

      error: (subscriptionError) => {
        console.error("AlertCenter subscription error:", subscriptionError);
      },
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchAlerts]);

  /* ========================================================
     SUMMARY COUNTS
  ======================================================== */

  const summary = useMemo(() => {
    const activeAlerts = alerts.filter((alert) => {
      const status = getStatus(alert);

      return (
        status !== ALERT_STATUSES.RESOLVED &&
        status !== ALERT_STATUSES.DISMISSED
      );
    });

    const unreadAlerts = alerts.filter(
      (alert) => getStatus(alert) === ALERT_STATUSES.UNREAD,
    );

    const criticalAlerts = activeAlerts.filter(
      (alert) => getSeverity(alert) === ALERT_SEVERITIES.CRITICAL,
    );

    const payoutAlerts = activeAlerts.filter(
      (alert) => getAlertType(alert) === ALERT_TYPES.PAYOUT,
    );

    const warningAlerts = activeAlerts.filter(
      (alert) => getSeverity(alert) === ALERT_SEVERITIES.WARNING,
    );

    const successAlerts = activeAlerts.filter(
      (alert) => getSeverity(alert) === ALERT_SEVERITIES.SUCCESS,
    );

    return {
      total: alerts.length,
      active: activeAlerts.length,
      unread: unreadAlerts.length,
      critical: criticalAlerts.length,
      payout: payoutAlerts.length,
      warning: warningAlerts.length,
      success: successAlerts.length,
    };
  }, [alerts]);

  /* ========================================================
     FILTERED ALERTS
  ======================================================== */

  const filteredAlerts = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return alerts.filter((alert) => {
      const type = getAlertType(alert);

      const severity = getSeverity(alert);

      const status = getStatus(alert);

      /*
       * ------------------------------------------------------
       * TYPE FILTER
       * ------------------------------------------------------
       */

      if (activeFilter !== ALERT_TYPES.ALL && type !== activeFilter) {
        return false;
      }

      /*
       * ------------------------------------------------------
       * SEVERITY FILTER
       * ------------------------------------------------------
       */

      if (activeSeverity !== "ALL" && severity !== activeSeverity) {
        return false;
      }

      /*
       * ------------------------------------------------------
       * SEARCH
       * ------------------------------------------------------
       */

      if (normalizedSearch) {
        const searchableText = [
          alert?.title,
          alert?.message,
          alert?.type,
          alert?.severity,
          alert?.status,
          alert?.payoutMethod,
          alert?.payoutSource,
          alert?.payoutID,
          alert?.courierID,
          alert?.failureReason,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase();

        if (!searchableText.includes(normalizedSearch)) {
          return false;
        }
      }

      /*
       * ------------------------------------------------------
       * CURRENT STATUS IS NOT FILTERED OUT HERE.
       *
       * This allows the All view to show resolved history.
       * ------------------------------------------------------
       */

      return true;
    });
  }, [alerts, activeFilter, activeSeverity, searchTerm]);

  /* ========================================================
     MARK ALERT AS READ
  ======================================================== */

  const markAsRead = useCallback(async (alert) => {
    if (!alert?.id) {
      return;
    }

    if (getStatus(alert) !== ALERT_STATUSES.UNREAD) {
      return;
    }

    try {
      const updatedAlert = await DataStore.save(
        AdminAlert.copyOf(alert, (draft) => {
          draft.status = ALERT_STATUSES.READ;

          draft.readAt = new Date().toISOString();
        }),
      );

      setAlerts((currentAlerts) =>
        currentAlerts.map((item) =>
          item.id === updatedAlert.id ? updatedAlert : item,
        ),
      );

      setSelectedAlert((current) =>
        current?.id === updatedAlert.id ? updatedAlert : current,
      );
    } catch (readError) {
      console.error("AlertCenter: failed to mark alert as read:", readError);
    }
  }, []);

  /* ========================================================
     MARK ALERT AS RESOLVED
  ======================================================== */

  const markAsResolved = useCallback(async (alert) => {
    if (!alert?.id) {
      return;
    }

    try {
      const updatedAlert = await DataStore.save(
        AdminAlert.copyOf(alert, (draft) => {
          draft.status = ALERT_STATUSES.RESOLVED;

          draft.resolvedAt = new Date().toISOString();

          /*
           * If the alert was still unread,
           * resolving it also counts as having
           * been handled.
           */
          if (draft.status === ALERT_STATUSES.UNREAD) {
            draft.readAt = new Date().toISOString();
          }
        }),
      );

      setAlerts((currentAlerts) =>
        currentAlerts.map((item) =>
          item.id === updatedAlert.id ? updatedAlert : item,
        ),
      );

      setSelectedAlert((current) =>
        current?.id === updatedAlert.id ? updatedAlert : current,
      );
    } catch (resolveError) {
      console.error("AlertCenter: failed to resolve alert:", resolveError);
    }
  }, []);

  /* ========================================================
     OPEN ALERT
  ======================================================== */

  const handleOpenAlert = async (alert) => {
    setSelectedAlert(alert);

    if (getStatus(alert) === ALERT_STATUSES.UNREAD) {
      await markAsRead(alert);
    }
  };

  /* ========================================================
     CLOSE ALERT
  ======================================================== */

  const handleCloseAlert = () => {
    setSelectedAlert(null);
  };

  /* ========================================================
     RESET FILTERS
  ======================================================== */

  const clearFilters = () => {
    setSearchTerm("");

    setActiveFilter(ALERT_TYPES.ALL);

    setActiveSeverity("ALL");
  };

  /* ========================================================
     LOADING STATE
  ======================================================== */

  if (loading) {
    return (
      <div className="alert-page">
        <div className="alert-loading">
          <div className="alert-loadingIcon">
            <FontAwesomeIcon icon={faBell} spin />
          </div>

          <h2>Loading Alert Center</h2>

          <p>Retrieving the latest operational alerts...</p>
        </div>
      </div>
    );
  }

  /* ========================================================
     MAIN UI
  ======================================================== */

  return (
    <div className="alert-page">
      {/* ====================================================
          PAGE HEADER
      ==================================================== */}

      <div className="alert-header">
        <div className="alert-headerMain">
          <div className="alert-headerIcon">
            <FontAwesomeIcon icon={faBell} />
          </div>

          <div className="alert-headerText">
            <div className="alert-titleRow">
              <h1>Alert Center</h1>

              <span className="alert-liveBadge">
                <span className="alert-liveDot" />
                Live
              </span>
            </div>

            <p>
              Monitor critical operational, courier, order, payment and payout
              events across Atua.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="alert-refreshButton"
          onClick={() =>
            fetchAlerts({
              showRefresh: true,
            })
          }
          disabled={refreshing}
        >
          <FontAwesomeIcon icon={faRefresh} spin={refreshing} />

          <span>{refreshing ? "Refreshing..." : "Refresh"}</span>
        </button>
      </div>

      {/* ====================================================
          ERROR BANNER
      ==================================================== */}

      {error && (
        <div className="alert-errorBanner">
          <div className="alert-errorIcon">
            <FontAwesomeIcon icon={faExclamationCircle} />
          </div>

          <div className="alert-errorContent">
            <strong>Unable to load alerts</strong>

            <span>{error}</span>
          </div>

          <button type="button" onClick={() => fetchAlerts()}>
            Try again
          </button>
        </div>
      )}

      {/* ====================================================
          SUMMARY CARDS
      ==================================================== */}

      <div className="alert-summaryGrid">
        {/* ACTIVE */}

        <div className="alert-summaryCard">
          <div className="alert-summaryTop">
            <div className="alert-summaryIcon alert-summaryIcon-blue">
              <FontAwesomeIcon icon={faBell} />
            </div>

            <span className="alert-summaryLabel">Active</span>
          </div>

          <div className="alert-summaryValue">{summary.active}</div>

          <div className="alert-summaryFooter">Current operational alerts</div>
        </div>

        {/* UNREAD */}

        <div className="alert-summaryCard">
          <div className="alert-summaryTop">
            <div className="alert-summaryIcon alert-summaryIcon-purple">
              <FontAwesomeIcon icon={faExclamationCircle} />
            </div>

            <span className="alert-summaryLabel">Unread</span>
          </div>

          <div className="alert-summaryValue">{summary.unread}</div>

          <div className="alert-summaryFooter">
            Require administrator attention
          </div>
        </div>

        {/* CRITICAL */}

        <div className="alert-summaryCard">
          <div className="alert-summaryTop">
            <div className="alert-summaryIcon alert-summaryIcon-red">
              <FontAwesomeIcon icon={faTriangleExclamation} />
            </div>

            <span className="alert-summaryLabel">Critical</span>
          </div>

          <div className="alert-summaryValue">{summary.critical}</div>

          <div className="alert-summaryFooter">High-priority system events</div>
        </div>

        {/* PAYOUT */}

        <div className="alert-summaryCard">
          <div className="alert-summaryTop">
            <div className="alert-summaryIcon alert-summaryIcon-green">
              <FontAwesomeIcon icon={faWallet} />
            </div>

            <span className="alert-summaryLabel">Payouts</span>
          </div>

          <div className="alert-summaryValue">{summary.payout}</div>

          <div className="alert-summaryFooter">
            Active payout-related events
          </div>
        </div>
      </div>

      {/* ====================================================
          FILTER TOOLBAR
      ==================================================== */}

      <div className="alert-toolbar">
        <div className="alert-search">
          <FontAwesomeIcon icon={faSearch} className="alert-searchIcon" />

          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search alerts..."
            aria-label="Search alerts"
          />

          {searchTerm && (
            <button
              type="button"
              className="alert-searchClear"
              onClick={() => setSearchTerm("")}
              aria-label="Clear search"
            >
              <FontAwesomeIcon icon={faXmark} />
            </button>
          )}
        </div>

        <div className="alert-filterGroup">
          <button
            type="button"
            className={`alert-filterButton ${
              activeFilter === ALERT_TYPES.ALL ? "active" : ""
            }`}
            onClick={() => setActiveFilter(ALERT_TYPES.ALL)}
          >
            All
            <span>{summary.total}</span>
          </button>

          <button
            type="button"
            className={`alert-filterButton ${
              activeFilter === ALERT_TYPES.PAYOUT ? "active" : ""
            }`}
            onClick={() => setActiveFilter(ALERT_TYPES.PAYOUT)}
          >
            Payouts
            <span>{summary.payout}</span>
          </button>

          <button
            type="button"
            className={`alert-filterButton ${
              activeFilter === ALERT_TYPES.ORDER ? "active" : ""
            }`}
            onClick={() => setActiveFilter(ALERT_TYPES.ORDER)}
          >
            Orders
          </button>

          <button
            type="button"
            className={`alert-filterButton ${
              activeFilter === ALERT_TYPES.COURIER ? "active" : ""
            }`}
            onClick={() => setActiveFilter(ALERT_TYPES.COURIER)}
          >
            Couriers
          </button>

          <button
            type="button"
            className={`alert-filterButton ${
              activeFilter === ALERT_TYPES.PAYMENT ? "active" : ""
            }`}
            onClick={() => setActiveFilter(ALERT_TYPES.PAYMENT)}
          >
            Payments
          </button>
        </div>

        <button
          type="button"
          className={`alert-filterToggle ${showFilters ? "active" : ""}`}
          onClick={() => setShowFilters((current) => !current)}
        >
          <FontAwesomeIcon icon={faFilter} />

          <span>Filters</span>

          <FontAwesomeIcon
            icon={faChevronDown}
            className={`alert-filterChevron ${showFilters ? "open" : ""}`}
          />
        </button>
      </div>

      {/* ====================================================
          ADVANCED FILTERS
      ==================================================== */}

      {showFilters && (
        <div className="alert-advancedFilters">
          <div className="alert-advancedFilter">
            <label>Severity</label>

            <select
              value={activeSeverity}
              onChange={(event) => setActiveSeverity(event.target.value)}
            >
              <option value="ALL">All severities</option>

              <option value={ALERT_SEVERITIES.CRITICAL}>Critical</option>

              <option value={ALERT_SEVERITIES.WARNING}>Warning</option>

              <option value={ALERT_SEVERITIES.INFO}>Information</option>

              <option value={ALERT_SEVERITIES.SUCCESS}>Success</option>
            </select>
          </div>

          <button
            type="button"
            className="alert-clearFilters"
            onClick={clearFilters}
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ====================================================
          RESULT HEADER
      ==================================================== */}

      <div className="alert-resultsHeader">
        <div>
          <h2>Operational Activity</h2>

          <span>
            {filteredAlerts.length}{" "}
            {filteredAlerts.length === 1 ? "alert" : "alerts"}
          </span>
        </div>

        <div className="alert-resultsStatus">
          <span className="alert-resultsDot" />
          Real-time monitoring
        </div>
      </div>

      {/* ====================================================
          ALERT LIST
      ==================================================== */}

      {filteredAlerts.length === 0 ? (
        <div className="alert-empty">
          <div className="alert-emptyIcon">
            <FontAwesomeIcon
              icon={
                searchTerm ||
                activeFilter !== ALERT_TYPES.ALL ||
                activeSeverity !== "ALL"
                  ? faSearch
                  : faCheckCircle
              }
            />
          </div>

          <h2>
            {searchTerm ||
            activeFilter !== ALERT_TYPES.ALL ||
            activeSeverity !== "ALL"
              ? "No matching alerts"
              : "Everything looks good"}
          </h2>

          <p>
            {searchTerm ||
            activeFilter !== ALERT_TYPES.ALL ||
            activeSeverity !== "ALL"
              ? "Try changing your search or filters."
              : "There are currently no operational alerts requiring attention."}
          </p>

          {(searchTerm ||
            activeFilter !== ALERT_TYPES.ALL ||
            activeSeverity !== "ALL") && (
            <button type="button" onClick={clearFilters}>
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="alert-list">
          {filteredAlerts.map((alert) => {
            const type = getAlertType(alert);

            const severity = getSeverity(alert);

            const status = getStatus(alert);

            const isUnread = status === ALERT_STATUSES.UNREAD;

            const isResolved = status === ALERT_STATUSES.RESOLVED;

            const isPayout = type === ALERT_TYPES.PAYOUT;

            return (
              <div
                key={alert.id}
                className={`alert-card alert-card-${severity.toLowerCase()} ${
                  isUnread ? "alert-card-unread" : ""
                } ${isResolved ? "alert-card-resolved" : ""}`}
              >
                {/* ========================================
                      CARD SEVERITY BAR
                  ======================================== */}

                <div className="alert-cardSeverityBar" />

                {/* ========================================
                      CARD MAIN
                  ======================================== */}

                <div className="alert-cardMain">
                  <div className="alert-cardIcon">
                    <FontAwesomeIcon icon={getTypeIcon(type)} />
                  </div>

                  <div className="alert-cardContent">
                    {/* ------------------------------------
                          TOP META
                      ------------------------------------ */}

                    <div className="alert-cardMeta">
                      <span
                        className={`alert-typeBadge alert-type-${type.toLowerCase()}`}
                      >
                        <FontAwesomeIcon icon={getTypeIcon(type)} />

                        {getTypeLabel(type)}
                      </span>

                      <span
                        className={`alert-severityBadge alert-severity-${severity.toLowerCase()}`}
                      >
                        <FontAwesomeIcon icon={getSeverityIcon(severity)} />

                        {getSeverityLabel(severity)}
                      </span>

                      {isUnread && (
                        <span className="alert-unreadBadge">New</span>
                      )}

                      {isResolved && (
                        <span className="alert-resolvedBadge">
                          <FontAwesomeIcon icon={faCheck} />
                          Resolved
                        </span>
                      )}
                    </div>

                    {/* ------------------------------------
                          TITLE
                      ------------------------------------ */}

                    <h3 className="alert-cardTitle">
                      {alert.title || "System Alert"}
                    </h3>

                    {/* ------------------------------------
                          MESSAGE
                      ------------------------------------ */}

                    <p className="alert-cardMessage">
                      {alert.message ||
                        "No additional information was provided."}
                    </p>

                    {/* ------------------------------------
                          PAYOUT FINANCIAL SNAPSHOT
                      ------------------------------------ */}

                    {isPayout &&
                      (alert.courierObligations !== null ||
                        alert.totalRequired !== null ||
                        alert.paystackBalance !== null ||
                        alert.topUpRequired !== null) && (
                        <div className="alert-payoutSnapshot">
                          <div className="alert-payoutSnapshotHeader">
                            <div>
                              <FontAwesomeIcon icon={faWallet} />

                              <span>Payout Financial Snapshot</span>
                            </div>

                            {alert.affectedCourierCount !== null &&
                              alert.affectedCourierCount !== undefined && (
                                <span className="alert-courierCount">
                                  {alert.affectedCourierCount} couriers
                                </span>
                              )}
                          </div>

                          <div className="alert-payoutGrid">
                            {alert.courierObligations !== null &&
                              alert.courierObligations !== undefined && (
                                <div className="alert-financialItem">
                                  <span>Courier obligations</span>

                                  <strong>
                                    {formatCurrency(alert.courierObligations)}
                                  </strong>
                                </div>
                              )}

                            {alert.paystackCosts !== null &&
                              alert.paystackCosts !== undefined && (
                                <div className="alert-financialItem">
                                  <span>Paystack costs</span>

                                  <strong>
                                    {formatCurrency(alert.paystackCosts)}
                                  </strong>
                                </div>
                              )}

                            {alert.totalRequired !== null &&
                              alert.totalRequired !== undefined && (
                                <div className="alert-financialItem alert-financialItem-highlight">
                                  <span>Total required</span>

                                  <strong>
                                    {formatCurrency(alert.totalRequired)}
                                  </strong>
                                </div>
                              )}

                            {alert.paystackBalance !== null &&
                              alert.paystackBalance !== undefined && (
                                <div className="alert-financialItem">
                                  <span>Paystack balance</span>

                                  <strong>
                                    {formatCurrency(alert.paystackBalance)}
                                  </strong>
                                </div>
                              )}

                            {alert.topUpRequired !== null &&
                              alert.topUpRequired !== undefined &&
                              Number(alert.topUpRequired) > 0 && (
                                <div className="alert-financialItem alert-financialItem-danger">
                                  <span>Top-up required</span>

                                  <strong>
                                    {formatCurrency(alert.topUpRequired)}
                                  </strong>
                                </div>
                              )}
                          </div>
                        </div>
                      )}

                    {/* ------------------------------------
                          PAYOUT METADATA
                      ------------------------------------ */}

                    {isPayout && (
                      <div className="alert-payoutMeta">
                        {alert.payoutMethod && (
                          <span>
                            Method: <strong>{alert.payoutMethod}</strong>
                          </span>
                        )}

                        {alert.payoutSource && (
                          <span>
                            Source: <strong>{alert.payoutSource}</strong>
                          </span>
                        )}

                        {alert.payoutID && (
                          <span>
                            Payout: <strong>{alert.payoutID}</strong>
                          </span>
                        )}
                      </div>
                    )}

                    {/* ------------------------------------
                          FOOTER
                      ------------------------------------ */}

                    <div className="alert-cardFooter">
                      <div className="alert-cardTime">
                        <FontAwesomeIcon icon={faClock} />

                        <span>{formatRelativeTime(alert.createdAt)}</span>

                        <span className="alert-timeSeparator">•</span>

                        <span>{formatDate(alert.createdAt)}</span>
                      </div>

                      <button
                        type="button"
                        className="alert-viewButton"
                        onClick={() => handleOpenAlert(alert)}
                      >
                        View details
                        <FontAwesomeIcon icon={faArrowDown} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ====================================================
          DETAIL DRAWER / MODAL
      ==================================================== */}

      {selectedAlert && (
        <div
          className="alert-detailOverlay"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              handleCloseAlert();
            }
          }}
        >
          <div className="alert-detailPanel">
            {/* ==============================================
                DETAIL HEADER
            ============================================== */}

            <div className="alert-detailHeader">
              <div className="alert-detailHeaderLeft">
                <div
                  className={`alert-detailIcon alert-detailIcon-${getSeverity(
                    selectedAlert,
                  ).toLowerCase()}`}
                >
                  <FontAwesomeIcon
                    icon={getSeverityIcon(getSeverity(selectedAlert))}
                  />
                </div>

                <div>
                  <span className="alert-detailEyebrow">
                    {getTypeLabel(getAlertType(selectedAlert))} Alert
                  </span>

                  <h2>{selectedAlert.title || "System Alert"}</h2>
                </div>
              </div>

              <button
                type="button"
                className="alert-detailClose"
                onClick={handleCloseAlert}
                aria-label="Close alert details"
              >
                <FontAwesomeIcon icon={faXmark} />
              </button>
            </div>

            {/* ==============================================
                DETAIL BODY
            ============================================== */}

            <div className="alert-detailBody">
              <div className="alert-detailBadges">
                <span
                  className={`alert-severityBadge alert-severity-${getSeverity(
                    selectedAlert,
                  ).toLowerCase()}`}
                >
                  <FontAwesomeIcon
                    icon={getSeverityIcon(getSeverity(selectedAlert))}
                  />

                  {getSeverityLabel(getSeverity(selectedAlert))}
                </span>

                <span
                  className={`alert-typeBadge alert-type-${getAlertType(
                    selectedAlert,
                  ).toLowerCase()}`}
                >
                  <FontAwesomeIcon
                    icon={getTypeIcon(getAlertType(selectedAlert))}
                  />

                  {getTypeLabel(getAlertType(selectedAlert))}
                </span>

                <span className="alert-detailStatus">
                  {getStatus(selectedAlert)}
                </span>
              </div>

              <div className="alert-detailMessage">
                <span className="alert-detailSectionLabel">Alert message</span>

                <p>
                  {selectedAlert.message ||
                    "No additional information was provided."}
                </p>
              </div>

              {/* ============================================
                  PAYOUT DETAILS
              ============================================ */}

              {getAlertType(selectedAlert) === ALERT_TYPES.PAYOUT && (
                <div className="alert-detailSection">
                  <div className="alert-detailSectionTitle">
                    <FontAwesomeIcon icon={faWallet} />

                    <span>Payout details</span>
                  </div>

                  <div className="alert-detailFinancialGrid">
                    {selectedAlert.amount !== null &&
                      selectedAlert.amount !== undefined && (
                        <div>
                          <span>Amount</span>

                          <strong>
                            {formatCurrency(selectedAlert.amount)}
                          </strong>
                        </div>
                      )}

                    {selectedAlert.courierObligations !== null &&
                      selectedAlert.courierObligations !== undefined && (
                        <div>
                          <span>Courier obligations</span>

                          <strong>
                            {formatCurrency(selectedAlert.courierObligations)}
                          </strong>
                        </div>
                      )}

                    {selectedAlert.paystackCosts !== null &&
                      selectedAlert.paystackCosts !== undefined && (
                        <div>
                          <span>Paystack costs</span>

                          <strong>
                            {formatCurrency(selectedAlert.paystackCosts)}
                          </strong>
                        </div>
                      )}

                    {selectedAlert.totalRequired !== null &&
                      selectedAlert.totalRequired !== undefined && (
                        <div className="highlight">
                          <span>Total required</span>

                          <strong>
                            {formatCurrency(selectedAlert.totalRequired)}
                          </strong>
                        </div>
                      )}

                    {selectedAlert.paystackBalance !== null &&
                      selectedAlert.paystackBalance !== undefined && (
                        <div>
                          <span>Paystack balance</span>

                          <strong>
                            {formatCurrency(selectedAlert.paystackBalance)}
                          </strong>
                        </div>
                      )}

                    {selectedAlert.topUpRequired !== null &&
                      selectedAlert.topUpRequired !== undefined && (
                        <div
                          className={
                            Number(selectedAlert.topUpRequired) > 0
                              ? "danger"
                              : ""
                          }
                        >
                          <span>Top-up required</span>

                          <strong>
                            {formatCurrency(selectedAlert.topUpRequired)}
                          </strong>
                        </div>
                      )}
                  </div>
                </div>
              )}

              {/* ============================================
                  EVENT INFORMATION
              ============================================ */}

              <div className="alert-detailSection">
                <div className="alert-detailSectionTitle">
                  <FontAwesomeIcon icon={faInfoCircle} />

                  <span>Event information</span>
                </div>

                <div className="alert-detailInformationGrid">
                  <div>
                    <span>Created</span>

                    <strong>{formatDate(selectedAlert.createdAt)}</strong>
                  </div>

                  <div>
                    <span>Status</span>

                    <strong>{getStatus(selectedAlert)}</strong>
                  </div>

                  {selectedAlert.readAt && (
                    <div>
                      <span>Read</span>

                      <strong>{formatDate(selectedAlert.readAt)}</strong>
                    </div>
                  )}

                  {selectedAlert.resolvedAt && (
                    <div>
                      <span>Resolved</span>

                      <strong>{formatDate(selectedAlert.resolvedAt)}</strong>
                    </div>
                  )}

                  {selectedAlert.affectedCourierCount !== null &&
                    selectedAlert.affectedCourierCount !== undefined && (
                      <div>
                        <span>Affected couriers</span>

                        <strong>{selectedAlert.affectedCourierCount}</strong>
                      </div>
                    )}

                  {selectedAlert.payoutSource && (
                    <div>
                      <span>Payout source</span>

                      <strong>{selectedAlert.payoutSource}</strong>
                    </div>
                  )}

                  {selectedAlert.payoutMethod && (
                    <div>
                      <span>Payout method</span>

                      <strong>{selectedAlert.payoutMethod}</strong>
                    </div>
                  )}

                  {selectedAlert.payoutID && (
                    <div>
                      <span>Payout ID</span>

                      <strong className="alert-detailMono">
                        {selectedAlert.payoutID}
                      </strong>
                    </div>
                  )}

                  {selectedAlert.courierID && (
                    <div>
                      <span>Courier ID</span>

                      <strong className="alert-detailMono">
                        {selectedAlert.courierID}
                      </strong>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ==============================================
                DETAIL FOOTER
            ============================================== */}

            <div className="alert-detailFooter">
              <button
                type="button"
                className="alert-detailSecondaryButton"
                onClick={handleCloseAlert}
              >
                Close
              </button>

              {getStatus(selectedAlert) !== ALERT_STATUSES.RESOLVED &&
                getStatus(selectedAlert) !== ALERT_STATUSES.DISMISSED && (
                  <button
                    type="button"
                    className="alert-detailResolveButton"
                    onClick={async () => {
                      await markAsResolved(selectedAlert);
                    }}
                  >
                    <FontAwesomeIcon icon={faCheck} />
                    Mark resolved
                  </button>
                )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AlertCenter;
