import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import {
  FaUsers,
  FaMotorcycle,
  FaBoxOpen,
  FaBroadcastTower,
  FaWallet,
  FaMoneyCheckAlt,
  FaCreditCard,
  FaChartLine,
  FaChartPie,
  FaArrowRight,
} from "react-icons/fa";

import { User, Courier, Order } from "../../../../models";

import "./AdminHome.css";

function AdminHome() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [couriers, setCouriers] = useState([]);
  const [orders, setOrders] = useState([]);

  const [loading, setLoading] = useState(true);

  //------------------------------------------------
  // Fetch
  //------------------------------------------------

  const fetchDashboard = async () => {
    setLoading(true);

    try {
      const [u, c, o] = await Promise.all([
        DataStore.query(User),
        DataStore.query(Courier),
        DataStore.query(Order),
      ]);

      setUsers(u);
      setCouriers(c);
      setOrders(o);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  //------------------------------------------------
  // Observe
  //------------------------------------------------

  useEffect(() => {
    fetchDashboard();

    const subscriptions = [
      DataStore.observe(User).subscribe(fetchDashboard),

      DataStore.observe(Courier).subscribe(fetchDashboard),

      DataStore.observe(Order).subscribe(fetchDashboard),
    ];

    return () => subscriptions.forEach((sub) => sub.unsubscribe());
  }, []);

  //------------------------------------------------
  // Metrics
  //------------------------------------------------

  const metrics = useMemo(() => {
    return {
      users: users.length,

      couriers: couriers.length,

      orders: orders.length,

      activeOrders: orders.filter(
        (o) => o.status !== "DELIVERED" && o.status !== "CANCELLED",
      ).length,
    };
  }, [users, couriers, orders]);

  //------------------------------------------------
  // Sections
  //------------------------------------------------

  const operations = [
    {
      title: "Users",
      subtitle: "Manage customer accounts",
      value: metrics.users,
      icon: <FaUsers />,
      path: "/admin/user_dashboard",
      color: "blue",
    },

    {
      title: "Couriers",
      subtitle: "Approve & manage riders",
      value: metrics.couriers,
      icon: <FaMotorcycle />,
      path: "/admin/courier_dashboard",
      color: "purple",
    },

    {
      title: "Orders",
      subtitle: "Delivery management",
      value: metrics.orders,
      icon: <FaBoxOpen />,
      path: "/admin/orders",
      color: "orange",
    },

    {
      title: "Live Operations",
      subtitle: "Control Tower",
      value: metrics.activeOrders,
      icon: <FaBroadcastTower />,
      path: "/admin/control_tower",
      color: "green",
    },
  ];

  const finance = [
    {
      title: "Payments",
      subtitle: "Customer payments",
      value: "--",
      icon: <FaCreditCard />,
      path: "/admin/payments",
      color: "emerald",
    },

    {
      title: "Wallets",
      subtitle: "Courier wallets",
      value: "--",
      icon: <FaWallet />,
      path: "/admin/wallets",
      color: "teal",
    },

    {
      title: "Payouts",
      subtitle: "Bank transfers",
      value: "--",
      icon: <FaMoneyCheckAlt />,
      path: "/admin/payouts",
      color: "indigo",
    },

    {
      title: "Revenue",
      subtitle: "Platform earnings",
      value: "--",
      icon: <FaChartLine />,
      path: "/admin/revenue",
      color: "yellow",
    },
  ];

  const analytics = [
    {
      title: "Reports",
      subtitle: "Operational reports",
      value: "--",
      icon: <FaChartPie />,
      path: "/admin/reports",
      color: "red",
    },

    {
      title: "Dashboard",
      subtitle: "Business analytics",
      value: "--",
      icon: <FaChartLine />,
      path: "/admin/dashboard",
      color: "gray",
    },
  ];

  //------------------------------------------------
  // Loading
  //------------------------------------------------

  if (loading) {
    return <div className="adminHomeLoading">Loading Admin...</div>;
  }

  //------------------------------------------------
  // Card
  //------------------------------------------------

  const renderCards = (cards) =>
    cards.map((item) => (
      <div
        key={item.title}
        className={`adminHomeCard ${item.color}`}
        onClick={() => navigate(item.path)}
      >
        <div className="adminHomeCardTop">
          <div className="adminHomeIcon">{item.icon}</div>

          <FaArrowRight />
        </div>

        <h3>{item.title}</h3>

        <p>{item.subtitle}</p>

        <span>{item.value}</span>
      </div>
    ));

  //------------------------------------------------
  // Render
  //------------------------------------------------

  return (
    <div className="adminHome">
      <div className="adminHomeHeader">
        <div>
          <h1>Atua Admin</h1>

          <p>Manage your logistics network from one place.</p>
        </div>
      </div>

      <section className="adminHomeSection">
        <h2>Operations</h2>

        <div className="adminHomeGrid">{renderCards(operations)}</div>
      </section>

      <section className="adminHomeSection">
        <h2>Finance</h2>

        <div className="adminHomeGrid">{renderCards(finance)}</div>
      </section>

      <section className="adminHomeSection">
        <h2>Analytics</h2>

        <div className="adminHomeGrid">{renderCards(analytics)}</div>
      </section>
    </div>
  );
}

export default AdminHome;
