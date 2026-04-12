import React, { useEffect, useMemo, useState } from "react";
import { DataStore } from "aws-amplify/datastore";
import { Order, Courier, Offer } from "../../../../models";
import "./Alerts.css";

function AlertCenter() {
  const [orders, setOrders] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [offers, setOffers] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH ----------------
  const fetchData = async () => {
    setLoading(true);

    const [o, c, of] = await Promise.all([
      DataStore.query(Order),
      DataStore.query(Courier),
      DataStore.query(Offer),
    ]);

    setOrders(o);
    setCouriers(c);
    setOffers(of);

    setLoading(false);
  };

  useEffect(() => {
    fetchData();

    const subs = [
      DataStore.observe(Order).subscribe(fetchData),
      DataStore.observe(Courier).subscribe(fetchData),
      DataStore.observe(Offer).subscribe(fetchData),
    ];

    return () => subs.forEach((s) => s.unsubscribe());
  }, []);

  // ---------------- ALERT ENGINE ----------------
  const alerts = useMemo(() => {
    const list = [];

    // 🚨 STUCK ORDERS
    const stuckOrders = orders.filter(
      (o) =>
        o.status === "ACCEPTED" ||
        o.status === "ARRIVED_PICKUP" ||
        o.status === "LOADING"
    );

    stuckOrders.forEach((o) => {
      list.push({
        type: "danger",
        title: "Order Stuck in Pipeline",
        message: `Order ${o.id} is stuck at ${o.status}`,
      });
    });

    // 🚨 UNAPPROVED COURIERS BACKLOG
    const unapproved = couriers.filter((c) => !c.isApproved);
    if (unapproved.length > 10) {
      list.push({
        type: "warning",
        title: "Courier Approval Backlog",
        message: `${unapproved.length} couriers pending approval`,
      });
    }

    // 🚨 NO ONLINE COURIERS
    const online = couriers.filter((c) => c.isOnline);
    if (online.length === 0) {
      list.push({
        type: "danger",
        title: "No Active Couriers",
        message: "All couriers are offline — delivery system at risk",
      });
    }

    // 🚨 HIGH OFFER REJECTION RATE
    const rejected = offers.filter((o) => o.status === "REJECTED");
    if (offers.length > 0 && rejected.length / offers.length > 0.5) {
      list.push({
        type: "warning",
        title: "High Offer Rejection Rate",
        message: "More than 50% of offers are being rejected",
      });
    }

    // 🚨 DELIVERY FAILURE RISK
    const cancelledOrders = orders.filter(
      (o) => o.status === "CANCELLED"
    );

    if (cancelledOrders.length > 20) {
      list.push({
        type: "danger",
        title: "High Cancellation Rate",
        message: `${cancelledOrders.length} orders cancelled`,
      });
    }

    return list;
  }, [orders, couriers, offers]);

  if (loading) {
    return <div className="loading">Loading Alert Center...</div>;
  }

  return (
    <div className="alert-page">

      {/* HEADER */}
      <div className="alert-header">
        <h1>System Alert Center</h1>
        <p>Real-time operational risk monitoring</p>
      </div>

      {/* SUMMARY STRIP */}
      <div className="summary-strip">
        <div>
          <h3>{orders.length}</h3>
          <p>Total Orders</p>
        </div>

        <div>
          <h3>{couriers.length}</h3>
          <p>Couriers</p>
        </div>

        <div>
          <h3>{offers.length}</h3>
          <p>Offers</p>
        </div>

        <div className="danger">
          <h3>{alerts.length}</h3>
          <p>Active Alerts</p>
        </div>
      </div>

      {/* ALERT LIST */}
      <div className="alert-container">

        {alerts.length === 0 ? (
          <div className="no-alerts">
            ✅ System operating normally — no critical issues detected
          </div>
        ) : (
          alerts.map((alert, index) => (
            <div key={index} className={`alert-card ${alert.type}`}>
              <h3>{alert.title}</h3>
              <p>{alert.message}</p>
            </div>
          ))
        )}

      </div>

    </div>
  );
}

export default AlertCenter;