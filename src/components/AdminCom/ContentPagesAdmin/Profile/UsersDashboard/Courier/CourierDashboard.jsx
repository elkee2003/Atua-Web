import React, { useEffect, useState } from "react";
import { getSignedUrl } from "../../../../../../utils/s3";
import "./CourierDashboard.css";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../../../../Providers/ClientProvider/AuthProvider";
import { DataStore } from "aws-amplify/datastore";
import { Courier } from "../../../../../../models";

function CourierDashboard() {
  const navigate = useNavigate();

  const { dbUser  } = useAuthContext();

  const [couriers, setCouriers] = useState([]);
  const [filteredCouriers, setFilteredCouriers] = useState([]);
  const [profileUrls, setProfileUrls] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loadingId, setLoadingId] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchCouriers = async () => {
    setLoading(true);
    try {
      const result = await DataStore.query(Courier);

      const sorted = result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setCouriers(sorted);
      setFilteredCouriers(sorted);

      // ✅ Fetch profile images using helper
      const urls = {};
      await Promise.all(
        sorted.map(async (c) => {
          if (!c.profilePic) return;

          const url = await getSignedUrl(c.profilePic);
          if (url) urls[c.id] = url;
        })
      );

      setProfileUrls(urls);

    } catch (error) {
      console.error("Error fetching couriers:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCouriers();
    const sub = DataStore.observe(Courier).subscribe(fetchCouriers);
    return () => sub.unsubscribe();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query) return setFilteredCouriers(couriers);

    const lower = query.toLowerCase();

    const filtered = couriers.filter((c) =>
      [
        c.firstName,
        c.lastName,
        c.phoneNumber,
        c.vehicleClass,
        c.plateNumber,
        c.transportationType,
      ]
        .join(" ")
        .toLowerCase()
        .includes(lower)
    );

    setFilteredCouriers(filtered);
  };

  const toggleApproval = async (courier) => {
    setLoadingId(courier.id);

    try {
      const freshCourier = await DataStore.query(Courier, courier.id);
      const newApprovalStatus = !freshCourier.isApproved;

      await DataStore.save(
        Courier.copyOf(freshCourier, (updated) => {
          updated.isApproved = newApprovalStatus;
          updated.approvedById = newApprovalStatus ? dbUser?.id : null;

          // ✅ FORCE OFFLINE IF UNAPPROVED
          if (!newApprovalStatus) {
            updated.isOnline = false;
          }

          // ✅ USE UPDATED VALUE (NOT freshCourier.isOnline)
          updated.statusKey = `${updated.isOnline ? "ONLINE" : "OFFLINE"}#${
            newApprovalStatus ? "APPROVED" : "NOT_APPROVED"
          }`;
        })
      );
    } catch (error) {
      console.error(error);
    } finally {
      setLoadingId(null);
    }
  };

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-top">
        <div>
          <h1>Courier Management</h1>
          <p>Manage, approve and monitor all couriers</p>
        </div>

        <button className="refresh-btn" onClick={fetchCouriers}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Search by name, phone, vehicle, plate..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="loading">Loading couriers...</div>
      ) : filteredCouriers.length === 0 ? (
        <div className="empty">No couriers found</div>
      ) : (
        <div className="grid">
          {filteredCouriers.map((courier) => (
            <div
              key={courier.id}
              className="card"
              onClick={() =>
                navigate(`/admin/courier_full_profile/${courier.id}`)
              }
            >

              {/* HEADER */}
              <div className="card-header">

                <div className="left">
                  <div className="avatar">
                    {profileUrls[courier.id] ? (
                      <img src={profileUrls[courier.id]} alt="" />
                    ) : (
                      courier.firstName?.charAt(0)
                    )}
                  </div>

                  <div>
                    <h3>
                      {courier.firstName} {courier.lastName}
                      <span className="transport">
                        {courier.transportationType}
                      </span>
                    </h3>
                    <span className="phone">{courier.phoneNumber}</span>
                  </div>
                </div>

                <div className={`status ${courier.isOnline ? "online" : "offline"}`}>
                  {courier.isOnline ? "Online" : "Offline"}
                </div>
              </div>

              {/* BODY */}
              <div className="card-body">

                <div className="row">
                  <span>Vehicle</span>
                  <strong>{courier.vehicleClass}</strong>
                </div>

                <div className="row">
                  <span>Plate</span>
                  <strong>{courier.plateNumber}</strong>
                </div>

                <div className="row">
                  <span>Status</span>
                  <span className={`badge ${courier.isApproved ? "approved" : "pending"}`}>
                    {courier.isApproved ? "Approved" : "Pending"}
                  </span>
                </div>

              </div>

              {/* ACTION */}
              <button
                className={`action-btn ${
                  courier.isApproved ? "danger" : "primary"
                }`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleApproval(courier);
                }}
                disabled={loadingId === courier.id}
              >
                {loadingId === courier.id
                  ? "Updating..."
                  : courier.isApproved
                  ? "Unapprove"
                  : "Approve"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default CourierDashboard;