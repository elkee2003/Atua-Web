import React, { useEffect, useState } from "react";
import { getSignedUrl } from "../../../../../../../utils/s3";
import { useParams, useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../../../../../Providers/ClientProvider/AuthProvider";
import { DataStore } from "aws-amplify/datastore";
import { list, remove } from "aws-amplify/storage";

import { Courier, Offer } from "../../../../../../../models";
import "./CourierFullProfile.css";

function CourierFullProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { dbUser  } = useAuthContext();

  const [courier, setCourier] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);
  const [ninUrl, setNinUrl] = useState(null);
  const [guarantorNinUrl, setGuarantorNinUrl] = useState(null);
  const [vehicleUrls, setVehicleUrls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchCourier = async () => {
    try {
      const result = await DataStore.query(Courier, id);
      setCourier(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourier();
  }, [id]);

  const toggleApproval = async () => {
    if (!courier) return;

    setActionLoading(true);
    try {
      const fresh = await DataStore.query(Courier, courier.id);

      await DataStore.save(
        Courier.copyOf(fresh, (u) => {
          const newStatus = !fresh.isApproved;

          u.isApproved = newStatus;
          u.approvedById = newStatus ? dbUser?.id : null;

          // ✅ FORCE OFFLINE IF UNAPPROVED
          if (!newStatus) {
            u.isOnline = false;
          }

          u.statusKey = `${u.isOnline ? "ONLINE" : "OFFLINE"}#${
            newStatus ? "APPROVED" : "NOT_APPROVED"
          }`;
        })
      );

      fetchCourier();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // function to reset currentBatchCount
  const resetBatchCount = async () => {
    const fresh = await DataStore.query(Courier, courier.id);
    await DataStore.save(
      Courier.copyOf(fresh, (u) => {
        u.currentBatchCount = 0;
        u.lastBatchAssignedAt = null;
      })
    );
    fetchCourier();
  };

  // function to reset currentExpressCount
  const resetExpressCount = async () => {
    const fresh = await DataStore.query(Courier, courier.id);
    await DataStore.save(
      Courier.copyOf(fresh, (u) => {
        u.currentExpressCount = 0;
        u.lastBatchAssignedAt = null;
      })
    );
    fetchCourier();
  };

  // function to reset currentMaxiCount
  const resetMaxiCount = async () => {
    const fresh = await DataStore.query(Courier, courier.id);

    await DataStore.save(
      Courier.copyOf(fresh, (u) => {
        u.currentMaxiCount = 0;
        u.lastBatchAssignedAt = null;
      })
    );

    fetchCourier();
  };

  // function to reset timer, I have to add the currentBatchCount and currentExpressCount, if not standing alone (resetting lastBatchAssignedAt alone) is useless, in my courier side there is always likely going to be an active order
  const resetDispatchTimer = async () => {
    setActionLoading(true);

    try {
      const fresh = await DataStore.query(Courier, courier.id);

      await DataStore.save(
        Courier.copyOf(fresh, (u) => {
          u.lastBatchAssignedAt = new Date().toISOString();
          u.currentMaxiCount = 0;
          u.currentBatchCount = 0;
          u.currentExpressCount = 0;
        })
      );

      fetchCourier();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  // function to force dispatch
  const forceDispatchNow = async () => {
    setActionLoading(true);

    try {
      const fresh = await DataStore.query(Courier, courier.id);

      await DataStore.save(
        Courier.copyOf(fresh, (u) => {
          u.lastBatchAssignedAt = new Date(0).toISOString();
        })
      );

      fetchCourier();
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  const deleteCourierMedia = async () => {
    const prefixes = [
      `public/profilePhoto/${courier.sub}/`,
      `public/maxiImages/${courier.sub}/`,
      `public/courierNIN/${courier.sub}/`,
      `public/guarantorNIN/${courier.sub}/`,
    ];

    await Promise.all(
      prefixes.map(async (prefix) => {
        const result = await list({ path: prefix, options: { listAll: true } });
        await Promise.all(result.items.map((f) => remove({ path: f.path })));
      })
    );
  };

  const handleDeleteCourier = async () => {
    if (!window.confirm("Delete courier permanently?")) return;

    setActionLoading(true);
    try {
      await deleteCourierMedia();

      const offers = await DataStore.query(Offer, (o) =>
        o.courierID.eq(courier.id)
      );

      await Promise.all(offers.map((o) => DataStore.delete(o)));
      await DataStore.delete(courier);

      navigate("/admin/courier_dashboard");
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  useEffect(() => {
    if (!courier) return;

    const load = async () => {
      if (courier.profilePic)
        setProfileUrl(await getSignedUrl(courier.profilePic));

      if (courier.courierNINImage)
        setNinUrl(await getSignedUrl(courier.courierNINImage));

      if (courier.guarantorNINImage)
        setGuarantorNinUrl(await getSignedUrl(courier.guarantorNINImage));

      if (courier.maxiImages?.length) {
        const urls = await Promise.all(
          courier.maxiImages.map((img) => getSignedUrl(img))
        );
        setVehicleUrls(urls);
      }
    };

    load();
  }, [courier]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!courier) return <div>No courier found</div>;

  return (
    <div className="page">
      <div className="topbar">
        <button onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left">
          <div className="avatar-lg">
            {profileUrl ? <img src={profileUrl} alt="" /> : courier.firstName[0]}
          </div>

          <div>
            <h1>{courier.firstName} {courier.lastName}</h1>
            <p>{courier.phoneNumber}</p>

            <div className="badges">
              <span className={`badge ${courier.isOnline ? "online" : "offline"}`}>
                {courier.isOnline ? "Online" : "Offline"}
              </span>

              <span className={`badge ${courier.isApproved ? "approved" : "pending"}`}>
                {courier.isApproved ? "Approved" : "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div className="hero-actions">

          {/* EXISTING ACTIONS */}
          <div className="action-row">
            <button className="btn primary" onClick={toggleApproval}>
              {courier.isApproved ? "Unapprove" : "Approve"}
            </button>

            <button className="btn batch" onClick={resetBatchCount}>
              Reset Batch
            </button>

            <button className="btn express" onClick={resetExpressCount}>
              Reset Express
            </button>

            <button className="btn maxi" onClick={resetMaxiCount}>
              Reset Maxi
            </button>

            <button 
              className="btn warning"
              disabled={actionLoading} 
              onClick={resetDispatchTimer}
            >
              {actionLoading ? "Resetting..." : "Reset All Counts / Timer"}
            </button>

            <button 
              className="btn force" 
              disabled={actionLoading}
              onClick={() => {
                if (window.confirm("Force dispatch all orders for this courier?")) {
                  forceDispatchNow();
                }
              }}
            >
               {actionLoading ? "Dispatching..." : "⚡ Force Dispatch"}
            </button>

            <button className="btn danger" onClick={handleDeleteCourier}>
              Delete
            </button>
          </div>

          {/* NEW NAVIGATION ACTIONS */}
          <div className="action-row secondary">
            <button
              className="btn nav"
              onClick={() => navigate(`/admin/courier_orders/${id}`)}
            >
              📦 Orders
            </button>

            <button
              className="btn nav"
              onClick={() => navigate(`/admin/courier_analytics/${id}`)}
            >
              📊 Analytics
            </button>

            <button
              className="btn nav live"
              onClick={() => navigate(`/admin/courier_live_tracking/${id}`)}
            >
              🟢 Live
            </button>
          </div>

        </div>
      </div>

      {/* SECTIONS */}
      <div className="section-grid">

        <div className="card">
          <h3>Personal Info</h3>
          <p>Email: {courier.email}</p>
          <p>Address: {courier.address}</p>
          <p>Landmark: {courier.landMark}</p>
        </div>

        <div className="card">
          <h3>Vehicle</h3>
          <p>{courier.transportationType}</p>
          <p>{courier.vehicleClass}</p>
          <p>{courier.model}</p>
          <p>{courier.vehicleColour}</p>
          <p>{courier.plateNumber}</p>
        </div>

        <div className="card">
          <h3>Bank</h3>
          <p>{courier.bankName}</p>
          <p>{courier.accountName}</p>
          <p>{courier.accountNumber}</p>
        </div>

        <div className="card">
          <h3>Stats</h3>
          <p>Batch: {courier.currentBatchCount}</p>
          <p>Express: {courier.currentExpressCount}</p>
        </div>

        <div className="card full">
          <h3>Verification</h3>
          {ninUrl && <img src={ninUrl} className="doc-img" />}
        </div>

        <div className="card full">
          <h3>Guarantor</h3>
          <p>{courier.guarantorName} {courier.guarantorLastName}</p>
          <p>{courier.guarantorProfession}</p>
          <p>{courier.guarantorNumber}</p>
          <p>{courier.guarantorRelationship}</p>
          <p>{courier.guarantorAddress}</p>
          <p>{courier.guarantorEmail}</p>
          {guarantorNinUrl && <img src={guarantorNinUrl} className="doc-img" />}
        </div>

        <div className="card full">
          <h3>Vehicle Images</h3>
          <div className="image-grid">
            {vehicleUrls.map((url, i) => (
              <img key={i} src={url} alt="" />
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}

export default CourierFullProfile;