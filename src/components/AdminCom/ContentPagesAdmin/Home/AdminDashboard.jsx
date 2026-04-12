import React, { useEffect, useState, useMemo } from "react";
import { DataStore } from "aws-amplify/datastore";
import { User, Courier, Order } from "../../../../models";
import "./AdminDashboard.css";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // ---------------- FETCH ----------------
  const fetchAll = async () => {
    setLoading(true);

    const [u, c, o] = await Promise.all([
      DataStore.query(User),
      DataStore.query(Courier),
      DataStore.query(Order),
    ]);

    setUsers(u);
    setCouriers(c);
    setOrders(o);

    setLoading(false);
  };

  useEffect(() => {
    fetchAll();

    const subs = [
      DataStore.observe(User).subscribe(fetchAll),
      DataStore.observe(Courier).subscribe(fetchAll),
      DataStore.observe(Order).subscribe(fetchAll),
    ];

    return () => subs.forEach((s) => s.unsubscribe());
  }, []);

  // ---------------- DERIVED METRICS ----------------
  const metrics = useMemo(() => {
    const totalUsers = users.length;
    const totalCouriers = couriers.length;
    const totalOrders = orders.length;

    const activeOrders = orders.filter(
      (o) =>
        o.status !== "DELIVERED" &&
        o.status !== "CANCELLED"
    );

    const deliveredOrders = orders.filter(
      (o) => o.status === "DELIVERED"
    );

    const pendingCouriers = couriers.filter(
      (c) => !c.isApproved
    );

    const onlineCouriers = couriers.filter(
      (c) => c.isOnline
    );

    const inTransit = orders.filter(
      (o) => o.status === "IN_TRANSIT"
    );

    const stuckOrders = orders.filter(
      (o) =>
        o.status === "ACCEPTED" ||
        o.status === "ARRIVED_PICKUP"
    );

    return {
      totalUsers,
      totalCouriers,
      totalOrders,
      activeOrders: activeOrders.length,
      deliveredOrders: deliveredOrders.length,
      pendingCouriers: pendingCouriers.length,
      onlineCouriers: onlineCouriers.length,
      inTransit: inTransit.length,
      stuckOrders: stuckOrders.length,
      deliveryRate: totalOrders
        ? Math.round((deliveredOrders.length / totalOrders) * 100)
        : 0,
    };
  }, [users, couriers, orders]);

  // ---------------- ALERT ENGINE ----------------
  const alerts = useMemo(() => {
    const a = [];

    if (metrics.pendingCouriers > 10) {
      a.push({
        type: "danger",
        msg: `${metrics.pendingCouriers} couriers pending approval`,
      });
    }

    if (metrics.stuckOrders > 20) {
      a.push({
        type: "warning",
        msg: "High number of stuck orders detected",
      });
    }

    if (metrics.activeOrders > 100) {
      a.push({
        type: "info",
        msg: "High system load: active orders spike",
      });
    }

    return a;
  }, [metrics]);

  if (loading) {
    return <div className="loading-screen">Loading Control Center...</div>;
  }

  return (
    <div className="enterprise">

      {/* HEADER */}
      <div className="header">
        <h1>Atua Logistics Control Tower</h1>
        <p>Real-time operational intelligence system</p>
      </div>

      {/* KPI STRIP */}
      <div className="kpi-grid">

        <div className="kpi">
          <h3>Users</h3>
          <p>{metrics.totalUsers}</p>
        </div>

        <div className="kpi">
          <h3>Couriers</h3>
          <p>{metrics.totalCouriers}</p>
        </div>

        <div className="kpi highlight">
          <h3>Orders</h3>
          <p>{metrics.totalOrders}</p>
        </div>

        <div className="kpi good">
          <h3>Delivered</h3>
          <p>{metrics.deliveredOrders}</p>
        </div>

        <div className="kpi warn">
          <h3>Active</h3>
          <p>{metrics.activeOrders}</p>
        </div>

        <div className="kpi danger">
          <h3>Pending Couriers</h3>
          <p>{metrics.pendingCouriers}</p>
        </div>

        <div className="kpi">
          <h3>Delivery Rate</h3>
          <p>{metrics.deliveryRate}%</p>
        </div>
      </div>

      {/* OPERATION GRID */}
      <div className="grid">

        <div className="panel large">
          <h2>Live Operations</h2>

          <div className="row">
            <span>🚚 Online Couriers</span>
            <b>{metrics.onlineCouriers}</b>
          </div>

          <div className="row">
            <span>📦 In Transit</span>
            <b>{metrics.inTransit}</b>
          </div>

          <div className="row">
            <span>⏳ Stuck Orders</span>
            <b>{metrics.stuckOrders}</b>
          </div>
        </div>

        <div className="panel">
          <h2>System Alerts</h2>

          {alerts.length === 0 ? (
            <p className="ok">System stable</p>
          ) : (
            alerts.map((a, i) => (
              <div key={i} className={`alert ${a.type}`}>
                {a.msg}
              </div>
            ))
          )}
        </div>

      </div>

      {/* FOOTER INSIGHT */}
      <div className="footer-insight">
        <p>
          System is processing {metrics.activeOrders} active deliveries
          across {metrics.totalCouriers} couriers.
        </p>
      </div>

    </div>
  );
}

export default AdminDashboard;