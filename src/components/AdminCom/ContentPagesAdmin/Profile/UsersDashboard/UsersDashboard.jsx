import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { User, Courier, Order } from "../../../../../models";
import "./UsersDashboard.css";

function AtuaDashboard() {
  const navigate = useNavigate();

  const [userCount, setUserCount] = useState(0);
  const [courierCount, setCourierCount] = useState(0);
  const [orderCount, setOrderCount] = useState(0);
  const [activeOrders, setActiveOrders] = useState(0);
  const [completedOrders, setCompletedOrders] = useState(0);

  const fetchUsers = async () => {
    const users = await DataStore.query(User);
    setUserCount(users.length);
  };

  const fetchCouriers = async () => {
    const couriers = await DataStore.query(Courier);
    setCourierCount(couriers.length);
  };

  const fetchOrders = async () => {
    const orders = await DataStore.query(Order);

    setOrderCount(orders.length);

    const active = orders.filter(
      o => o.status !== "DELIVERED" && o.status !== "CANCELLED"
    );

    const completed = orders.filter(
      o => o.status === "DELIVERED"
    );

    setActiveOrders(active.length);
    setCompletedOrders(completed.length);
  };

  useEffect(() => {
    fetchUsers();
    fetchCouriers();
    fetchOrders();

    const subs = [
      DataStore.observe(User).subscribe(fetchUsers),
      DataStore.observe(Courier).subscribe(fetchCouriers),
      DataStore.observe(Order).subscribe(fetchOrders),
    ];

    return () => subs.forEach(sub => sub.unsubscribe());
  }, []);

  const totalEntities = userCount + courierCount;

  return (
    <div className="atua-dashboard">

      {/* HEADER */}
      <div className="dashboard-header">
        <div>
          <h1>Atua Admin Dashboard</h1>
          <p>Overview of platform activity and performance</p>
        </div>
      </div>

      {/* KPI GRID */}
      <div className="kpi-grid">

        <div
          className="kpi-card primary"
          onClick={() => navigate("/admin/user_dashboard")}
        >
          <div className="kpi-title">Users</div>
          <div className="kpi-value">{userCount}</div>
        </div>

        <div
          className="kpi-card secondary"
          onClick={() => navigate("/admin/courier_dashboard")}
        >
          <div className="kpi-title">Couriers</div>
          <div className="kpi-value">{courierCount}</div>
        </div>

        <div
          className="kpi-card dark"
          onClick={() => navigate("/admin/orders")}
        >
          <div className="kpi-title">Total Orders</div>
          <div className="kpi-value">{orderCount}</div>
        </div>

        <div className="kpi-card warning">
          <div className="kpi-title">Active Orders</div>
          <div className="kpi-value">{activeOrders}</div>
        </div>

        <div className="kpi-card success">
          <div className="kpi-title">Completed</div>
          <div className="kpi-value">{completedOrders}</div>
        </div>

        <div className="kpi-card neutral">
          <div className="kpi-title">Total Users + Couriers</div>
          <div className="kpi-value">{totalEntities}</div>
        </div>

      </div>

    </div>
  );
}

export default AtuaDashboard;