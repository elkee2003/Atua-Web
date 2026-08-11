import React from "react";
import {
  FaUsers,
  FaCheckCircle,
  FaClock,
  FaWifi,
  FaPowerOff,
  FaStar,
} from "react-icons/fa";

import "./CourierStats.css";

function CourierStats({ stats, statusFilter, setStatusFilter }) {
  const statCards = [
    {
      key: "ALL",
      title: "Total Couriers",
      value: stats.total,
      subtitle: "All registered couriers",
      icon: <FaUsers />,
      color: "#2563eb",
      clickable: true,
    },

    {
      key: "APPROVED",
      title: "Approved",
      value: stats.approved,
      subtitle: "Ready to receive jobs",
      icon: <FaCheckCircle />,
      color: "#16a34a",
      clickable: true,
    },

    {
      key: "PENDING",
      title: "Pending",
      value: stats.pending,
      subtitle: "Awaiting approval",
      icon: <FaClock />,
      color: "#f59e0b",
      clickable: true,
    },

    {
      key: "ONLINE",
      title: "Online",
      value: stats.online,
      subtitle: "Currently active",
      icon: <FaWifi />,
      color: "#10b981",
      clickable: true,
    },

    {
      key: "OFFLINE",
      title: "Offline",
      value: stats.offline,
      subtitle: "Currently unavailable",
      icon: <FaPowerOff />,
      color: "#6b7280",
      clickable: true,
    },

    {
      key: "RATING",
      title: "Average Rating",
      value: stats.averageRating,
      subtitle: "Overall courier rating",
      icon: <FaStar />,
      color: "#facc15",
      clickable: false,
    },
  ];

  const handleStatClick = (card) => {
    if (!card.clickable) return;

    setStatusFilter(card.key);
  };

  return (
    <div className="courierStats">
      {statCards.map((item) => {
        const isActive = item.clickable && statusFilter === item.key;

        return (
          <button
            key={item.title}
            type="button"
            className={[
              "courierStats-card",
              item.clickable
                ? "courierStats-cardClickable"
                : "courierStats-cardStatic",
              isActive ? "courierStats-cardActive" : "",
            ]
              .filter(Boolean)
              .join(" ")}
            onClick={() => handleStatClick(item)}
            disabled={!item.clickable}
            aria-pressed={item.clickable ? isActive : undefined}
          >
            <div
              className="courierStats-icon"
              style={{
                backgroundColor: item.color,
              }}
            >
              {item.icon}
            </div>

            <div className="courierStats-content">
              <span className="courierStats-title">{item.title}</span>

              <h2 className="courierStats-value">{item.value}</h2>

              <p className="courierStats-subtitle">{item.subtitle}</p>
            </div>

            {isActive && (
              <span className="courierStats-activeIndicator">Active</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export default CourierStats;
