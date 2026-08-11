import React, { useCallback, useEffect, useMemo, useState } from "react";

import { FaArrowLeft, FaExclamationTriangle, FaSyncAlt } from "react-icons/fa";

import { useNavigate, useParams } from "react-router-dom";

import { DataStore } from "aws-amplify/datastore";

import { getUrl } from "aws-amplify/storage";

import { Courier, CourierReport } from "../../../../../../../models";

import CourierReportsHeader from "./Components/CourierReportsHeader/CourierReportsHeader";

import CourierReportsStats from "./Components/CourierReportsStats/CourierReportsStats";

import CourierReportsSummary from "./Components/CourierReportsSummary/CourierReportsSummary";

import CourierReportsSearch from "./Components/CourierReportsSearch/CourierReportsSearch";

import CourierReportsFilters from "./Components/CourierReportsFilters/CourierReportsFilters";

import CourierReportsList from "./Components/CourierReportsList/CourierReportsList";

import "./CourierReports.css";

function CourierReports() {
  /*
  ==========================================================
  ROUTING
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

  /*
  ==========================================================
  PROFILE IMAGE
  ==========================================================
  */

  const [profileUrl, setProfileUrl] = useState(null);

  /*
  ==========================================================
  REPORTS
  ==========================================================
  */

  const [reports, setReports] = useState([]);

  /*
  ==========================================================
  LOADING
  ==========================================================
  */

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [loadingMore, setLoadingMore] = useState(false);

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

  const [searchValue, setSearchValue] = useState("");

  /*
  ==========================================================
  FILTERS
  ==========================================================
  */

  const [statusFilter, setStatusFilter] = useState("ALL");

  const [periodFilter, setPeriodFilter] = useState("ALL");

  const [reasonFilter, setReasonFilter] = useState("ALL");

  /*
  ==========================================================
  SORT
  ==========================================================
  */

  const [sortFilter, setSortFilter] = useState("NEWEST");

  /*
  ==========================================================
  PAGINATION
  ==========================================================
  */

  const [hasMore, setHasMore] = useState(false);

  /*
  ==========================================================
  LOAD PROFILE IMAGE
  ==========================================================
  */

  const loadProfileImage = useCallback(async (courierData) => {
    /*
        ------------------------------------------------------
        RESET IMAGE
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
        GET PROFILE IMAGE PATH
        ------------------------------------------------------
        */

    const profilePath =
      courierData.profilePic ||
      courierData.profilePhoto ||
      courierData.profileUrl ||
      null;

    /*
        ------------------------------------------------------
        NO PROFILE IMAGE
        ------------------------------------------------------
        */

    if (!profilePath) {
      console.log("Courier has no profile picture.");

      return;
    }

    console.log("Courier Reports profile picture:", profilePath);

    /*
        ------------------------------------------------------
        ALREADY A FULL URL
        ------------------------------------------------------
        */

    if (
      typeof profilePath === "string" &&
      (profilePath.startsWith("http://") ||
        profilePath.startsWith("https://") ||
        profilePath.startsWith("blob:"))
    ) {
      setProfileUrl(profilePath);

      return;
    }

    /*
        ------------------------------------------------------
        AMPLIFY STORAGE
        ------------------------------------------------------
        */

    try {
      const result = await getUrl({
        path: profilePath,

        options: {
          validateObjectExistence: true,
        },
      });

      if (result?.url) {
        const resolvedUrl = result.url.toString();

        console.log("Courier Reports profile image URL:", resolvedUrl);

        setProfileUrl(resolvedUrl);
      } else {
        console.warn("Amplify did not return a profile image URL.");

        setProfileUrl(null);
      }
    } catch (imageError) {
      console.error("Error loading courier profile image:", imageError);

      setProfileUrl(null);
    }
  }, []);

  /*
  ==========================================================
  LOAD COURIER
  ==========================================================
  */

  const loadCourier = useCallback(async () => {
    if (!courierId) {
      throw new Error("Courier ID is missing from the URL.");
    }

    const result = await DataStore.query(Courier, courierId);

    if (!result) {
      throw new Error("Courier could not be found.");
    }

    console.log("Courier loaded for reports:", result);

    console.log("Courier profilePic:", result.profilePic);

    /*
        ------------------------------------------------------
        SAVE COURIER
        ------------------------------------------------------
        */

    setCourier(result);

    /*
        ------------------------------------------------------
        LOAD PROFILE IMAGE
        ------------------------------------------------------
        */

    await loadProfileImage(result);

    return result;
  }, [courierId, loadProfileImage]);

  /*
  ==========================================================
  LOAD COURIER REPORTS
  ==========================================================
  */

  const loadReports = useCallback(async () => {
    if (!courierId) {
      throw new Error("Courier ID is missing from the URL.");
    }

    /*
        ======================================================
        QUERY COURIER REPORTS
        ======================================================
        */

    const result = await DataStore.query(CourierReport);

    /*
        ======================================================
        FIND REPORTS BELONGING TO THIS COURIER
        ======================================================
        */

    const courierReports = result.filter((report) => {
      const reportCourierId =
        report?.courierID || report?.courierId || report?.courier?.id;

      return reportCourierId === courierId;
    });

    /*
        ======================================================
        SORT NEWEST FIRST
        ======================================================
        */

    courierReports.sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();

      const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();

      return dateB - dateA;
    });

    setReports(courierReports);

    /*
        ======================================================
        CURRENT PAGINATION

        All locally available CourierReport records
        are loaded at once.
        ======================================================
        */

    setHasMore(false);

    return courierReports;
  }, [courierId]);

  /*
  ==========================================================
  LOAD PAGE
  ==========================================================
  */

  const loadPage = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setError(null);

        await Promise.all([loadCourier(), loadReports()]);
      } catch (err) {
        console.error("Error loading courier reports:", err);

        setError(err?.message || "Unable to load courier reports.");
      } finally {
        if (showLoading) {
          setLoading(false);
        }
      }
    },
    [loadCourier, loadReports],
  );

  /*
  ==========================================================
  INITIAL LOAD
  ==========================================================
  */

  useEffect(() => {
    loadPage(true);
  }, [loadPage]);

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
            RELOAD PROFILE IMAGE WHEN COURIER CHANGES
            --------------------------------------------------
            */

        loadProfileImage(element);
      },
    );

    /*
      --------------------------------------------------------
      COURIER REPORT OBSERVER
      --------------------------------------------------------
      */

    const reportSubscription = DataStore.observe(CourierReport).subscribe(
      ({ opType }) => {
        if (["INSERT", "UPDATE", "DELETE"].includes(opType)) {
          loadReports();
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

      reportSubscription.unsubscribe();
    };
  }, [courierId, loadProfileImage, loadReports]);

  /*
  ==========================================================
  REFRESH
  ==========================================================
  */

  const handleRefresh = async () => {
    if (refreshing) {
      return;
    }

    try {
      setRefreshing(true);

      setError(null);

      await Promise.all([loadCourier(), loadReports()]);
    } catch (err) {
      console.error("Error refreshing courier reports:", err);

      setError(err?.message || "Unable to refresh courier reports.");
    } finally {
      setRefreshing(false);
    }
  };

  /*
  ==========================================================
  SEARCH
  ==========================================================
  */

  const handleSearchChange = (value) => {
    setSearchValue(value || "");
  };

  const handleClearSearch = () => {
    setSearchValue("");
  };

  /*
  ==========================================================
  STATUS FILTER
  ==========================================================
  */

  const handleStatusChange = (value) => {
    setStatusFilter(value || "ALL");
  };

  /*
  ==========================================================
  PERIOD FILTER
  ==========================================================
  */

  const handlePeriodChange = (value) => {
    setPeriodFilter(value || "ALL");
  };

  /*
  ==========================================================
  REASON FILTER
  ==========================================================
  */

  const handleReasonChange = (value) => {
    setReasonFilter(value || "ALL");
  };

  /*
  ==========================================================
  SORT FILTER
  ==========================================================
  */

  const handleSortChange = (value) => {
    setSortFilter(value || "NEWEST");
  };

  /*
  ==========================================================
  CLEAR FILTERS
  ==========================================================
  */

  const handleClearFilters = () => {
    setStatusFilter("ALL");

    setPeriodFilter("ALL");

    setReasonFilter("ALL");

    setSortFilter("NEWEST");
  };

  /*
  ==========================================================
  ACTIVE FILTERS
  ==========================================================
  */

  const hasActiveFilters =
    statusFilter !== "ALL" ||
    periodFilter !== "ALL" ||
    reasonFilter !== "ALL" ||
    sortFilter !== "NEWEST";

  /*
  ==========================================================
  PERIOD HELPER
  ==========================================================
  */

  const isWithinPeriod = useCallback((dateValue, period) => {
    if (period === "ALL") {
      return true;
    }

    if (!dateValue) {
      return false;
    }

    const reportDate = new Date(dateValue);

    if (Number.isNaN(reportDate.getTime())) {
      return false;
    }

    const now = new Date();

    /*
        ======================================================
        TODAY
        ======================================================
        */

    if (period === "TODAY") {
      return reportDate.toDateString() === now.toDateString();
    }

    const millisecondsPerDay = 24 * 60 * 60 * 1000;

    const difference = now.getTime() - reportDate.getTime();

    /*
        ======================================================
        LAST 7 DAYS
        ======================================================
        */

    if (period === "7_DAYS") {
      return difference >= 0 && difference <= 7 * millisecondsPerDay;
    }

    /*
        ======================================================
        LAST 30 DAYS
        ======================================================
        */

    if (period === "30_DAYS") {
      return difference >= 0 && difference <= 30 * millisecondsPerDay;
    }

    /*
        ======================================================
        LAST 90 DAYS
        ======================================================
        */

    if (period === "90_DAYS") {
      return difference >= 0 && difference <= 90 * millisecondsPerDay;
    }

    /*
        ======================================================
        THIS YEAR
        ======================================================
        */

    if (period === "THIS_YEAR") {
      return reportDate.getFullYear() === now.getFullYear();
    }

    return true;
  }, []);

  /*
  ==========================================================
  FILTERED REPORTS
  ==========================================================
  */

  const filteredReports = useMemo(() => {
    const search = searchValue.trim().toLowerCase();

    const filtered = reports.filter((report) => {
      /*
              ================================================
              REASON
              ================================================
              */

      const reason = String(report?.reason || "");

      /*
              ================================================
              DESCRIPTION
              ================================================
              */

      const description = String(report?.description || "");

      /*
              ================================================
              STATUS
              ================================================
              */

      const status = String(report?.status || "OPEN").toUpperCase();

      /*
              ================================================
              ORDER ID
              ================================================
              */

      const orderId = String(
        report?.orderID || report?.orderId || report?.order?.id || "",
      );

      /*
              ================================================
              CUSTOMER ID
              ================================================
              */

      const userId = String(
        report?.userID || report?.userId || report?.user?.id || "",
      );

      /*
              ================================================
              SEARCHABLE TEXT
              ================================================
              */

      const searchableText = `
                  ${reason}
                  ${description}
                  ${status}
                  ${orderId}
                  ${userId}
                `.toLowerCase();

      if (search && !searchableText.includes(search)) {
        return false;
      }

      /*
              ================================================
              STATUS FILTER
              ================================================
              */

      if (statusFilter !== "ALL" && status !== statusFilter) {
        return false;
      }

      /*
              ================================================
              REASON FILTER
              ================================================
              */

      if (reasonFilter !== "ALL") {
        const normalizedReason = reason.trim().toLowerCase();

        if (normalizedReason !== String(reasonFilter).trim().toLowerCase()) {
          return false;
        }
      }

      /*
              ================================================
              DATE FILTER
              ================================================
              */

      const reportDate = report?.createdAt || report?.updatedAt;

      if (!isWithinPeriod(reportDate, periodFilter)) {
        return false;
      }

      return true;
    });

    /*
        ======================================================
        SORT
        ======================================================
        */

    filtered.sort((a, b) => {
      const dateA = new Date(a?.createdAt || a?.updatedAt || 0).getTime();

      const dateB = new Date(b?.createdAt || b?.updatedAt || 0).getTime();

      if (sortFilter === "OLDEST") {
        return dateA - dateB;
      }

      return dateB - dateA;
    });

    return filtered;
  }, [
    reports,
    searchValue,
    statusFilter,
    periodFilter,
    reasonFilter,
    sortFilter,
    isWithinPeriod,
  ]);

  /*
  ==========================================================
  REPORT STATISTICS
  ==========================================================
  */

  const reportStats = useMemo(() => {
    const total = reports.length;

    const open = reports.filter(
      (report) => String(report?.status || "").toUpperCase() === "OPEN",
    ).length;

    const underReview = reports.filter(
      (report) => String(report?.status || "").toUpperCase() === "UNDER_REVIEW",
    ).length;

    const resolved = reports.filter(
      (report) => String(report?.status || "").toUpperCase() === "RESOLVED",
    ).length;

    const dismissed = reports.filter(
      (report) => String(report?.status || "").toUpperCase() === "DISMISSED",
    ).length;

    const withEvidence = reports.filter((report) => {
      const hasPhotos =
        Array.isArray(report?.evidencePhotos) &&
        report.evidencePhotos.length > 0;

      const hasVideo = Boolean(report?.evidenceVideo);

      return hasPhotos || hasVideo;
    }).length;

    const withComments = reports.filter(
      (report) => String(report?.adminComment || "").trim().length > 0,
    ).length;

    return {
      total,
      open,
      underReview,
      resolved,
      dismissed,
      withEvidence,
      withComments,
    };
  }, [reports]);

  /*
  ==========================================================
  REASON DISTRIBUTION
  ==========================================================
  */

  const reasonDistribution = useMemo(() => {
    const distribution = {};

    reports.forEach((report) => {
      const reason = String(report?.reason || "Other").trim();

      const key = reason || "Other";

      distribution[key] = (distribution[key] || 0) + 1;
    });

    return distribution;
  }, [reports]);

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
  VIEW REPORT
  ==========================================================
  */

  const handleViewReport = (report) => {
    if (!report?.id) {
      return;
    }

    navigate(`/courier_report/${report.id}`);
  };

  /*
  ==========================================================
  VIEW ORDER
  ==========================================================
  */

  const handleViewOrder = (report) => {
    const orderId = report?.orderID || report?.orderId || report?.order?.id;

    if (!orderId) {
      return;
    }

    navigate(`/order/${orderId}`);
  };

  /*
  ==========================================================
  VIEW CUSTOMER
  ==========================================================
  */

  const handleViewCustomer = (report) => {
    const customerId = report?.userID || report?.userId || report?.user?.id;

    if (!customerId) {
      return;
    }

    navigate(`/customer/${customerId}`);
  };

  /*
  ==========================================================
  START REVIEW
  ==========================================================
  */

  const handleStartReview = async (report) => {
    if (!report?.id) {
      return;
    }

    try {
      const updated = await DataStore.save(
        CourierReport.copyOf(report, (draft) => {
          draft.status = "UNDER_REVIEW";
        }),
      );

      setReports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      console.error("Error starting report review:", err);

      setError(err?.message || "Unable to update this report.");
    }
  };

  /*
  ==========================================================
  RESOLVE REPORT
  ==========================================================
  */

  const handleResolve = async (report) => {
    if (!report?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to mark this report as resolved?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const updated = await DataStore.save(
        CourierReport.copyOf(report, (draft) => {
          draft.status = "RESOLVED";
        }),
      );

      setReports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      console.error("Error resolving report:", err);

      setError(err?.message || "Unable to resolve this report.");
    }
  };

  /*
  ==========================================================
  DISMISS REPORT
  ==========================================================
  */

  const handleDismiss = async (report) => {
    if (!report?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to dismiss this report?",
    );

    if (!confirmed) {
      return;
    }

    try {
      const updated = await DataStore.save(
        CourierReport.copyOf(report, (draft) => {
          draft.status = "DISMISSED";
        }),
      );

      setReports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      console.error("Error dismissing report:", err);

      setError(err?.message || "Unable to dismiss this report.");
    }
  };

  /*
  ==========================================================
  REOPEN REPORT
  ==========================================================
  */

  const handleReopen = async (report) => {
    if (!report?.id) {
      return;
    }

    try {
      const updated = await DataStore.save(
        CourierReport.copyOf(report, (draft) => {
          draft.status = "OPEN";
        }),
      );

      setReports((current) =>
        current.map((item) => (item.id === updated.id ? updated : item)),
      );
    } catch (err) {
      console.error("Error reopening report:", err);

      setError(err?.message || "Unable to reopen this report.");
    }
  };

  /*
  ==========================================================
  REMOVE REPORT
  ==========================================================
  */

  const handleRemove = async (report) => {
    if (!report?.id) {
      return;
    }

    const confirmed = window.confirm(
      "Are you sure you want to remove this report?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await DataStore.delete(CourierReport, report.id);

      setReports((current) => current.filter((item) => item.id !== report.id));
    } catch (err) {
      console.error("Error removing courier report:", err);

      setError(err?.message || "Unable to remove this report.");
    }
  };

  /*
  ==========================================================
  LOAD MORE
  ==========================================================
  */

  const handleLoadMore = async () => {
    if (loadingMore || !hasMore) {
      return;
    }

    setLoadingMore(true);

    try {
      /*
        ------------------------------------------------------
        FUTURE PAGINATION

        CourierReport records are currently loaded locally.
        ------------------------------------------------------
        */
    } finally {
      setLoadingMore(false);
    }
  };

  /*
  ==========================================================
  ERROR STATE
  ==========================================================
  */

  if (!loading && error) {
    return (
      <div className="courierReports">
        <div className="courierReports-error">
          <div className="courierReports-errorIcon">
            <FaExclamationTriangle />
          </div>

          <h2>Unable to Load Reports</h2>

          <p>{error}</p>

          <div className="courierReports-errorActions">
            <button
              type="button"
              className="courierReports-errorBackButton"
              onClick={handleBack}
            >
              <FaArrowLeft />

              <span>Back to Courier</span>
            </button>

            <button
              type="button"
              className="courierReports-errorRetryButton"
              onClick={() => loadPage(true)}
            >
              <FaSyncAlt />

              <span>Try Again</span>
            </button>
          </div>
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
    <div className="courierReports">
      {/* ==================================================
          HEADER
      ================================================== */}

      <CourierReportsHeader
        courier={courier}
        profileUrl={profileUrl}
        loading={loading}
        onBack={handleBack}
        onRefresh={handleRefresh}
        refreshing={refreshing}
      />

      {/* ==================================================
          STATISTICS
      ================================================== */}

      <div className="courierReports-statsSection">
        <CourierReportsStats
          courier={courier}
          reports={reports}
          totalReports={reportStats.total}
          openReports={reportStats.open}
          underReviewReports={reportStats.underReview}
          resolvedReports={reportStats.resolved}
          dismissedReports={reportStats.dismissed}
          evidenceReports={reportStats.withEvidence}
          loading={loading}
        />
      </div>

      {/* ==================================================
          SUMMARY
      ================================================== */}

      <div className="courierReports-summarySection">
        <CourierReportsSummary
          totalReports={reportStats.total}
          openReports={reportStats.open}
          underReviewReports={reportStats.underReview}
          resolvedReports={reportStats.resolved}
          dismissedReports={reportStats.dismissed}
          reasonDistribution={reasonDistribution}
          loading={loading}
        />
      </div>

      {/* ==================================================
          SEARCH
      ================================================== */}

      <div className="courierReports-searchSection">
        <CourierReportsSearch
          value={searchValue}
          onChange={handleSearchChange}
          onClear={handleClearSearch}
          loading={loading}
        />
      </div>

      {/* ==================================================
          FILTERS
      ================================================== */}

      <div className="courierReports-filterSection">
        <CourierReportsFilters
          status={statusFilter}
          period={periodFilter}
          reason={reasonFilter}
          sort={sortFilter}
          reports={reports}
          onStatusChange={handleStatusChange}
          onPeriodChange={handlePeriodChange}
          onReasonChange={handleReasonChange}
          onSortChange={handleSortChange}
          onClear={handleClearFilters}
          loading={loading}
        />
      </div>

      {/* ==================================================
          REPORTS LIST
      ================================================== */}

      <div className="courierReports-listSection">
        <CourierReportsList
          reports={filteredReports}
          loading={loading}
          refreshing={refreshing}
          searchValue={searchValue}
          hasActiveFilters={hasActiveFilters}
          onRefresh={handleRefresh}
          onViewReport={handleViewReport}
          onViewOrder={handleViewOrder}
          onViewCustomer={handleViewCustomer}
          onStartReview={handleStartReview}
          onResolve={handleResolve}
          onDismiss={handleDismiss}
          onReopen={handleReopen}
          onRemove={handleRemove}
          onLoadMore={handleLoadMore}
          hasMore={hasMore}
          loadingMore={loadingMore}
        />
      </div>
    </div>
  );
}

export default CourierReports;
