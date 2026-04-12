import React, { useEffect, useMemo, useState } from "react";
import { DataStore } from "aws-amplify/datastore";
import { useParams } from "react-router-dom";
import { Order } from "../../../../../../../../models";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
} from "recharts";
import "./Analytics.css";

function CourierAnalytics() {
  const { id } = useParams();
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders();
  }, [id]);

  const fetchOrders = async () => {
    const data = await DataStore.query(Order, (o) =>
      o.assignedCourierId.eq(id)
    );
    setOrders(data);
  };

  // ================= BASIC STATS =================
  const stats = useMemo(() => {
    const completed = orders.filter((o) => o.status === "DELIVERED");
    const cancelled = orders.filter((o) => o.status === "CANCELLED");

    const earnings = completed.reduce(
      (sum, o) => sum + (o.courierEarnings || 0),
      0
    );

    return {
      total: orders.length,
      completed: completed.length,
      cancelled: cancelled.length,
      successRate:
        orders.length > 0
          ? ((completed.length / orders.length) * 100).toFixed(1)
          : 0,
      earnings,
    };
  }, [orders]);

  // ================= BAR DATA =================
  const barData = [
    { name: "Total", value: stats.total },
    { name: "Completed", value: stats.completed },
    { name: "Cancelled", value: stats.cancelled },
  ];

  // ================= LINE DATA (DAILY EARNINGS) =================
  const lineData = useMemo(() => {
    const grouped = {};

    orders.forEach((o) => {
      if (!o.createdAt) return;

      const date = new Date(o.createdAt).toLocaleDateString();

      if (!grouped[date]) {
        grouped[date] = 0;
      }

      if (o.status === "DELIVERED") {
        grouped[date] += o.courierEarnings || 0;
      }
    });

    return Object.keys(grouped).map((date) => ({
      date,
      earnings: grouped[date],
    }));
  }, [orders]);

  return (
    <div className="analytics-page">

      <h1>📊 Performance Analytics</h1>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card"><h4>Total</h4><p>{stats.total}</p></div>
        <div className="stat-card"><h4>Completed</h4><p>{stats.completed}</p></div>
        <div className="stat-card"><h4>Cancelled</h4><p>{stats.cancelled}</p></div>
        <div className="stat-card"><h4>Success</h4><p>{stats.successRate}%</p></div>
        <div className="stat-card highlight">
          <h4>Earnings</h4>
          <p>₦{stats.earnings.toLocaleString()}</p>
        </div>
      </div>

      {/* BAR CHART */}
      <div className="chart-card">
        <h3>Orders Overview</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={barData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="value" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* LINE CHART */}
      <div className="chart-card">
        <h3>Earnings Trend</h3>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={lineData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="earnings" />
          </LineChart>
        </ResponsiveContainer>
      </div>

    </div>
  );
}

export default CourierAnalytics;