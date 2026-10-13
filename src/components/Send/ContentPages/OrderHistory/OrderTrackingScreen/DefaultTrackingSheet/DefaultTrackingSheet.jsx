import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./DefaultTrackingSheet.css";

const DefaultTrackingSheet = ({
  order,
  courier,
  courierImageUrl,
  onCancel,
}) => {
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();

  const renderStatusTitle = () => {
    switch (order?.status) {
      case "READY_FOR_PICKUP":
        return "Searching for a courier...";

      case "BIDDING":
        return "Finding the best offer...";

      case "ACCEPTED":
        return "Courier is on the way";

      case "ARRIVED_PICKUP":
        return "Courier has arrived";

      case "LOADING":
        return "Your shipment is being loaded";

      case "PICKED_UP":
        return "Shipment picked up";

      case "IN_TRANSIT":
        return "Package in transit";

      case "ARRIVED_DROPOFF":
        return "Courier has arrived at destination";

      case "UNLOADING":
        return "Your shipment is being unloaded";

      case "DELIVERED":
        return "Delivered successfully";

      case "CANCELLED":
        return "Delivery cancelled";

      case "DISPUTED":
        return "Delivery under review";

      default:
        return "Processing...";
    }
  };

  const renderSubtitle = () => {
    switch (order?.status) {
      case "READY_FOR_PICKUP":
        return "Notifying nearby couriers.";

      case "BIDDING":
        return "Couriers are reviewing your delivery.";

      case "ACCEPTED":
        return `${courier?.firstName || "Courier"} is heading to pickup`;

      case "ARRIVED_PICKUP":
        return `${
          courier?.firstName || "Your courier"
        } has arrived at the pickup location`;

      case "LOADING":
        return "Your shipment is being loaded onto the vehicle";

      case "PICKED_UP":
        return "Your shipment has been collected and is ready for delivery";

      case "IN_TRANSIT":
        return "Your package is on the way to its destination";

      case "ARRIVED_DROPOFF":
        return `${
          courier?.firstName || "Your courier"
        } has arrived at the delivery location`;

      case "UNLOADING":
        return "Your shipment is being unloaded";

      case "DELIVERED":
        return "Delivery completed successfully";

      case "CANCELLED":
        return "This delivery has been cancelled";

      case "DISPUTED":
        return "Your delivery is currently under review";

      default:
        return null;
    }
  };

  const copyPhone = async () => {
    if (!courier?.phoneNumber) return;

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(courier.phoneNumber);
      } else {
        const textArea = document.createElement("textarea");
        textArea.value = courier.phoneNumber;
        textArea.style.position = "fixed";
        textArea.style.opacity = "0";

        document.body.appendChild(textArea);
        textArea.select();

        const successful = document.execCommand("copy");
        document.body.removeChild(textArea);

        if (!successful) {
          throw new Error("Clipboard copy failed.");
        }
      }

      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("COPY PHONE ERROR:", error);
      window.alert("Unable to copy the phone number. Please copy it manually.");
    }
  };

  const activeCourierStatuses = [
    "ACCEPTED",
    "ARRIVED_PICKUP",
    "LOADING",
    "PICKED_UP",
    "IN_TRANSIT",
    "ARRIVED_DROPOFF",
    "UNLOADING",
  ];

  const showDriverCard =
    activeCourierStatuses.includes(order?.status) && Boolean(courier);

  const canShowPhone =
    Boolean(courier?.phoneNumber) &&
    (order?.transportationType !== "MAXI" || order?.paymentStatus === "PAID");

  const canCancelOrder =
    (order?.status === "READY_FOR_PICKUP" && order?.paymentStatus === "PAID") ||
    (order?.transportationType === "MAXI" &&
      order?.status === "ACCEPTED" &&
      order?.paymentStatus === "PAID");

  const totalPrice = Number(order?.totalPrice || 0);

  return (
    <div className="default-tracking-content">
      {/* STATUS */}

      <section className="tracking-status-container">
        <div className="tracking-status-row">
          <span className="tracking-status-dot" />

          <h2 className="tracking-status-title">{renderStatusTitle()}</h2>
        </div>

        {renderSubtitle() && (
          <p className="tracking-status-subtitle">{renderSubtitle()}</p>
        )}
      </section>

      {/* ORDER HISTORY */}

      <button
        type="button"
        className="tracking-order-history"
        onClick={() => navigate("/send/orders")}
      >
        Order History
        <span aria-hidden="true">→</span>
      </button>

      {/* CANCEL ORDER */}

      {canCancelOrder && (
        <button
          type="button"
          className="tracking-cancel-button"
          onClick={onCancel}
        >
          Cancel Order
        </button>
      )}

      {/* COURIER CARD */}

      {showDriverCard && (
        <section className="tracking-driver-card">
          <img
            src={courierImageUrl || "/placeholder.png"}
            alt={`${courier?.firstName || "Courier"} profile`}
            className="tracking-driver-image"
            onError={(event) => {
              event.currentTarget.onerror = null;
              event.currentTarget.src = "/placeholder.png";
            }}
          />

          <div className="tracking-driver-info">
            <h3 className="tracking-driver-name">
              {courier?.firstName || "Your courier"}
            </h3>

            <p className="tracking-driver-subtitle">
              {[courier?.transportationType, courier?.vehicleClass]
                .filter(Boolean)
                .join(" • ")}
            </p>

            {courier?.vehicleColour && (
              <p className="tracking-driver-meta">
                {[courier.vehicleColour, courier.plateNumber]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
            )}

            {/* PHONE NUMBER */}

            {canShowPhone && (
              <button
                type="button"
                className="tracking-phone-button"
                onClick={copyPhone}
                title="Copy phone number"
              >
                <span className="tracking-phone-number">
                  {courier.phoneNumber}
                </span>

                <span className="tracking-copy-hint">
                  {copied ? "Copied!" : "Tap to copy"}
                </span>
              </button>
            )}

            {/* PRICE */}

            <div className="tracking-price-badge">
              <span className="tracking-price-text">
                ₦{totalPrice.toLocaleString("en-NG")}
              </span>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default DefaultTrackingSheet;
