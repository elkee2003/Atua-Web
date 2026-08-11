import React from "react";
import {
  FaArrowRight,
  FaBox,
  FaCalendarAlt,
  FaMapMarkerAlt,
  FaMotorcycle,
} from "react-icons/fa";

import "./CourierOrderCard.css";

function CourierOrderCard({ order, onViewOrder }) {
  /*
    ==========================================================
    ORDER SAFETY
    ==========================================================
    */

  if (!order) {
    return null;
  }

  /*
    ==========================================================
    ORDER ID
    ==========================================================
    */

  const orderId = order.id ? order.id.slice(0, 8).toUpperCase() : "N/A";

  /*
    ==========================================================
    STATUS
    ==========================================================
    */

  const rawStatus = order.status || "UNKNOWN";

  const normalizedStatus = String(rawStatus).toLowerCase().replace(/\s+/g, "_");

  const formattedStatus = String(rawStatus)
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (letter) => letter.toUpperCase());

  /*
    ==========================================================
    PRICE
    ==========================================================
    */

  const price =
    order.totalPrice != null ? Number(order.totalPrice).toLocaleString() : "0";

  /*
    ==========================================================
    DATE
    ==========================================================
    */

  const orderDate = order.createdAt
    ? new Date(order.createdAt).toLocaleDateString("en-NG", {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    : "Date unavailable";

  /*
    ==========================================================
    TRANSPORTATION
    ==========================================================
    */

  const transportationType =
    order.transportationType || order.vehicleClass || "Courier";

  /*
    ==========================================================
    VIEW ORDER
    ==========================================================
    */

  const handleViewOrder = () => {
    if (typeof onViewOrder === "function") {
      onViewOrder(order);
    }
  };

  /*
    ==========================================================
    RENDER
    ==========================================================
    */

  return (
    <article
      className={`courierOrderCard courierOrderCard-status-${normalizedStatus}`}
    >
      {/* ==================================================
                TOP
            ================================================== */}

      <div className="courierOrderCard-top">
        <div className="courierOrderCard-orderIdentity">
          <div className="courierOrderCard-orderIcon">
            <FaBox />
          </div>

          <div>
            <span className="courierOrderCard-orderLabel">Order</span>

            <strong className="courierOrderCard-orderId">#{orderId}</strong>
          </div>
        </div>

        {/* ==================================================
                    STATUS
                ================================================== */}

        <span
          className={`courierOrderCard-status courierOrderCard-statusBadge-${normalizedStatus}`}
        >
          <span className="courierOrderCard-statusDot" />

          {formattedStatus}
        </span>
      </div>

      {/* ==================================================
                ROUTE
            ================================================== */}

      <div className="courierOrderCard-route">
        {/* ==================================================
                    ORIGIN
                ================================================== */}

        <div className="courierOrderCard-location">
          <div className="courierOrderCard-locationIcon courierOrderCard-pickupIcon">
            <FaMapMarkerAlt />
          </div>

          <div className="courierOrderCard-locationContent">
            <span className="courierOrderCard-locationLabel">Pickup</span>

            <p>{order.originAddress || "Pickup address unavailable"}</p>
          </div>
        </div>

        {/* ==================================================
                    ROUTE CONNECTOR
                ================================================== */}

        <div className="courierOrderCard-routeConnector">
          <span />
        </div>

        {/* ==================================================
                    DESTINATION
                ================================================== */}

        <div className="courierOrderCard-location">
          <div className="courierOrderCard-locationIcon courierOrderCard-destinationIcon">
            <FaMapMarkerAlt />
          </div>

          <div className="courierOrderCard-locationContent">
            <span className="courierOrderCard-locationLabel">Destination</span>

            <p>
              {order.destinationAddress || "Destination address unavailable"}
            </p>
          </div>
        </div>
      </div>

      {/* ==================================================
                META
            ================================================== */}

      <div className="courierOrderCard-meta">
        {/* Transportation */}

        <div className="courierOrderCard-metaItem">
          <FaMotorcycle />

          <div>
            <span>Vehicle</span>

            <strong>{transportationType}</strong>
          </div>
        </div>

        {/* Date */}

        <div className="courierOrderCard-metaItem">
          <FaCalendarAlt />

          <div>
            <span>Created</span>

            <strong>{orderDate}</strong>
          </div>
        </div>

        {/* Price */}

        <div className="courierOrderCard-price">
          <span>Order Value</span>

          <strong>₦{price}</strong>
        </div>
      </div>

      {/* ==================================================
                FOOTER
            ================================================== */}

      <div className="courierOrderCard-footer">
        <span className="courierOrderCard-footerText">
          View complete order details
        </span>

        <button
          type="button"
          className="courierOrderCard-viewButton"
          onClick={handleViewOrder}
        >
          <span>View Order</span>

          <FaArrowRight />
        </button>
      </div>
    </article>
  );
}

export default CourierOrderCard;
