import React from "react";
import {
  FaUsers,
  FaWifi,
  FaPowerOff,
  FaCheckCircle,
  FaClock,
  FaMotorcycle,
  FaTruck,
  FaBicycle,
} from "react-icons/fa";

import "./CourierFilters.css";

function CourierFilters({ statusFilter, setStatusFilter }) {
  const filters = [
    {
      key: "ALL",
      label: "All Couriers",
      icon: <FaUsers />,
    },
    {
      key: "ONLINE",
      label: "Online",
      icon: <FaWifi />,
    },
    {
      key: "OFFLINE",
      label: "Offline",
      icon: <FaPowerOff />,
    },
    {
      key: "APPROVED",
      label: "Approved",
      icon: <FaCheckCircle />,
    },
    {
      key: "PENDING",
      label: "Pending",
      icon: <FaClock />,
    },
    {
      key: "MICRO",
      label: "Micro",
      icon: <FaBicycle />,
    },
    {
      key: "MOTO",
      label: "Moto",
      icon: <FaMotorcycle />,
    },
    {
      key: "MAXI",
      label: "Maxi",
      icon: <FaTruck />,
    },
  ];

  return (
    <div className="courierFilters">
      <div className="courierFilters-header">
        <div className="courierFilters-heading">
          <span className="courierFilters-title">Filter Couriers</span>

          <span className="courierFilters-description">
            Narrow down the courier list
          </span>
        </div>

        {statusFilter !== "ALL" && (
          <button
            type="button"
            className="courierFilters-reset"
            onClick={() => setStatusFilter("ALL")}
          >
            Clear filter
          </button>
        )}
      </div>

      <div className="courierFilters-list">
        {filters.map((filter) => {
          const isActive = statusFilter === filter.key;

          return (
            <button
              key={filter.key}
              type="button"
              className={`courierFilters-button ${
                isActive ? "courierFilters-buttonActive" : ""
              }`}
              onClick={() => setStatusFilter(filter.key)}
              aria-pressed={isActive}
            >
              <span className="courierFilters-icon">{filter.icon}</span>

              <span className="courierFilters-label">{filter.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CourierFilters;
