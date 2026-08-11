import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";

import { Courier } from "../../../../../../../models";
import { getSignedUrl } from "../../../../../../../utils/s3";

import { useAuthContext } from "../../../../../../../../Providers/ClientProvider/AuthProvider";

import CourierStats from "./Components/CourierStats/CourierStats";
import CourierSearch from "./Components/CourierSearch/CourierSearch";
import CourierFilters from "./Components/CourierFilters/CourierFilters";
import CourierCard from "./Components/CourierCard/CourierCard";
import EmptyState from "./Components/EmptyState/EmptyState";

import "./CourierDashboard.css";

function CourierDashboard() {
  const navigate = useNavigate();

  const { dbUser } = useAuthContext();

  /*
    =====================================================
    STATE
    =====================================================
    */

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [loadingId, setLoadingId] = useState(null);

  const [couriers, setCouriers] = useState([]);
  const [profileUrls, setProfileUrls] = useState({});

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");

  /*
    =====================================================
    FETCH COURIERS
    =====================================================
    */

  const fetchCouriers = async ({ showLoading = false } = {}) => {
    try {
      if (showLoading) {
        setLoading(true);
      }

      const data = await DataStore.query(Courier);

      const sorted = [...data].sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
      );

      setCouriers(sorted);

      /*
            ==========================================
            PROFILE IMAGES
            ==========================================
            */

      const urls = {};

      await Promise.all(
        sorted.map(async (courier) => {
          if (!courier.profilePic) return;

          try {
            const url = await getSignedUrl(courier.profilePic);

            if (url) {
              urls[courier.id] = url;
            }
          } catch (error) {
            console.error(
              `Failed to load profile image for courier ${courier.id}:`,
              error,
            );
          }
        }),
      );

      setProfileUrls(urls);
    } catch (error) {
      console.error("Failed to fetch couriers:", error);
    } finally {
      if (showLoading) {
        setLoading(false);
      }
    }
  };

  /*
    =====================================================
    INITIAL LOAD
    =====================================================
    */

  useEffect(() => {
    fetchCouriers({
      showLoading: true,
    });

    const subscription = DataStore.observe(Courier).subscribe(() => {
      fetchCouriers();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  /*
    =====================================================
    REFRESH
    =====================================================
    */

  const handleRefresh = async () => {
    try {
      setRefreshing(true);

      await fetchCouriers();
    } finally {
      setRefreshing(false);
    }
  };

  /*
    =====================================================
    APPROVAL
    =====================================================
    */

  const toggleApproval = async (courier) => {
    try {
      setLoadingId(courier.id);

      const freshCourier = await DataStore.query(Courier, courier.id);

      if (!freshCourier) {
        console.warn("Courier no longer exists:", courier.id);

        return;
      }

      const approved = !freshCourier.isApproved;

      await DataStore.save(
        Courier.copyOf(freshCourier, (updated) => {
          updated.isApproved = approved;

          updated.approvedById = approved ? (dbUser?.id ?? null) : null;

          /*
                        ==================================
                        UNAPPROVING A COURIER
                        ==================================
                        */

          if (!approved) {
            updated.isOnline = false;
          }

          /*
                        ==================================
                        STATUS KEY
                        ==================================
                        */

          updated.statusKey = `${updated.isOnline ? "ONLINE" : "OFFLINE"}#${
            approved ? "APPROVED" : "NOT_APPROVED"
          }`;
        }),
      );
    } catch (error) {
      console.error("Failed to update courier approval:", error);
    } finally {
      setLoadingId(null);
    }
  };

  /*
    =====================================================
    FILTERED COURIERS
    =====================================================
    */

  const filteredCouriers = useMemo(() => {
    let data = [...couriers];

    /*
        ================================================
        SEARCH
        ================================================
        */

    const query = searchQuery.trim().toLowerCase();

    if (query) {
      data = data.filter((courier) =>
        [
          courier.firstName,
          courier.lastName,
          courier.phoneNumber,
          courier.vehicleClass,
          courier.plateNumber,
          courier.transportationType,
        ]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query),
      );
    }

    /*
        ================================================
        FILTER
        ================================================
        */

    switch (statusFilter) {
      case "ONLINE":
        data = data.filter((courier) => courier.isOnline);
        break;

      case "OFFLINE":
        data = data.filter((courier) => !courier.isOnline);
        break;

      case "APPROVED":
        data = data.filter((courier) => courier.isApproved);
        break;

      case "PENDING":
        data = data.filter((courier) => !courier.isApproved);
        break;

      case "MICRO":
        data = data.filter((courier) =>
          courier.transportationType?.toLowerCase().includes("micro"),
        );
        break;

      case "MOTO":
        data = data.filter((courier) =>
          courier.transportationType?.toLowerCase().includes("moto"),
        );
        break;

      case "MAXI":
        data = data.filter((courier) =>
          courier.transportationType?.toLowerCase().includes("maxi"),
        );
        break;

      case "ALL":
      default:
        break;
    }

    return data;
  }, [couriers, searchQuery, statusFilter]);

  /*
    =====================================================
    KPI STATS
    =====================================================
    */

  const courierStats = useMemo(() => {
    const total = couriers.length;

    const online = couriers.filter((courier) => courier.isOnline).length;

    const offline = total - online;

    const approved = couriers.filter((courier) => courier.isApproved).length;

    const pending = total - approved;

    const ratedCouriers = couriers.filter(
      (courier) =>
        courier.averageRating !== null &&
        courier.averageRating !== undefined &&
        !Number.isNaN(Number(courier.averageRating)),
    );

    const averageRating =
      ratedCouriers.length > 0
        ? (
            ratedCouriers.reduce(
              (sum, courier) => sum + Number(courier.averageRating),
              0,
            ) / ratedCouriers.length
          ).toFixed(1)
        : "0.0";

    return {
      total,
      online,
      offline,
      approved,
      pending,
      averageRating,
    };
  }, [couriers]);

  /*
    =====================================================
    EMPTY STATE
    =====================================================
    */

  const emptyState = useMemo(() => {
    if (searchQuery.trim()) {
      return {
        title: "No Couriers Found",
        description: `No couriers match "${searchQuery}".`,
      };
    }

    switch (statusFilter) {
      case "ONLINE":
        return {
          title: "No Online Couriers",
          description: "There are currently no couriers online.",
        };

      case "OFFLINE":
        return {
          title: "No Offline Couriers",
          description: "There are currently no offline couriers.",
        };

      case "APPROVED":
        return {
          title: "No Approved Couriers",
          description: "There are currently no approved couriers.",
        };

      case "PENDING":
        return {
          title: "No Pending Couriers",
          description: "All courier applications have been reviewed.",
        };

      case "MICRO":
        return {
          title: "No Micro Couriers",
          description: "There are currently no Micro couriers.",
        };

      case "MOTO":
        return {
          title: "No Moto Couriers",
          description: "There are currently no Moto couriers.",
        };

      case "MAXI":
        return {
          title: "No Maxi Couriers",
          description: "There are currently no Maxi couriers.",
        };

      case "ALL":
      default:
        return {
          title: "No Couriers Yet",
          description: "There are currently no couriers registered on Atua.",
        };
    }
  }, [searchQuery, statusFilter]);

  /*
    =====================================================
    RESET SEARCH + FILTER
    =====================================================
    */

  const handleViewAll = () => {
    setSearchQuery("");
    setStatusFilter("ALL");
  };

  /*
    =====================================================
    RENDER
    =====================================================
    */

  return (
    <div className="courierDashboard">
      {/* ==========================================
                HEADER
            ========================================== */}

      <div className="courierDashboard-header">
        <div className="courierDashboard-headerLeft">
          <h1 className="courierDashboard-title">Courier Management</h1>

          <p className="courierDashboard-description">
            Monitor, approve and manage every courier on Atua.
          </p>
        </div>

        <div className="courierDashboard-headerRight">
          <button
            type="button"
            className="courierDashboard-refreshButton"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            {refreshing ? "Refreshing..." : "Refresh"}
          </button>
        </div>
      </div>

      {/* ==========================================
                STATISTICS
            ========================================== */}

      <CourierStats
        stats={courierStats}
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ==========================================
                SEARCH
            ========================================== */}

      <CourierSearch
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* ==========================================
                FILTERS
            ========================================== */}

      <CourierFilters
        statusFilter={statusFilter}
        setStatusFilter={setStatusFilter}
      />

      {/* ==========================================
                CONTENT
            ========================================== */}

      {loading ? (
        <div className="courierDashboard-loading">Loading couriers...</div>
      ) : filteredCouriers.length === 0 ? (
        <EmptyState
          title={emptyState.title}
          description={emptyState.description}
          actionLabel={
            searchQuery || statusFilter !== "ALL"
              ? "View All Couriers"
              : undefined
          }
          onAction={
            searchQuery || statusFilter !== "ALL" ? handleViewAll : undefined
          }
        />
      ) : (
        <div className="courierDashboard-grid">
          {filteredCouriers.map((courier) => (
            <CourierCard
              key={courier.id}
              courier={courier}
              profileUrl={profileUrls[courier.id]}
              loading={loadingId === courier.id}
              onApprove={() => toggleApproval(courier)}
              onViewProfile={() =>
                navigate(`/admin/courier_full_profile/${courier.id}`)
              }
              onTrack={() =>
                navigate(`/admin/courier_live_tracking/${courier.id}`)
              }
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default CourierDashboard;
