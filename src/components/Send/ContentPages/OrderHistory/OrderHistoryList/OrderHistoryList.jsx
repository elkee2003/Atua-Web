import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { Order } from "../../../../../../src/models";
import "./orderHistoryList.css";

const OrderHistoryList = ({ order, refreshOrders }) => {
  const [expanded, setExpanded] = useState(false);
  const navigate = useNavigate();

  const isLive = order.status === "ACCEPTED";

  const toggleExpand = () => {
    setExpanded((prev) => !prev);
  };

  const goToOrderDetails = (e) => {
    e.stopPropagation();
    navigate(`/orderdetails/${order.id}`);
  };

  const goToTracking = (e) => {
    e.stopPropagation();
    navigate(`/order-tracking/${order.id}`);
  };

  const deleteOrder = async (e) => {
    e.stopPropagation();

    const confirm = window.confirm(
      "Are you sure you want to permanently delete this order?"
    );
    if (!confirm) return;

    try {
      const orderToDelete = await DataStore.query(Order, order.id);
      if (orderToDelete) {
        await DataStore.delete(orderToDelete);
        refreshOrders?.();
      }
    } catch (error) {
      console.log("Delete error:", error);
    }
  };

  const cancelOrder = async (e) => {
    e.stopPropagation();

    const confirm = window.confirm("Do you want to cancel this delivery?");
    if (!confirm) return;

    try {
      const orderToCancel = await DataStore.query(Order, order.id);
      if (orderToCancel) {
        await DataStore.save(
          Order.copyOf(orderToCancel, (updated) => {
            updated.status = "READY_FOR_PICKUP";
            updated.assignedCourierId = null;
          })
        );
        refreshOrders?.();
      }
    } catch (error) {
      console.log("Cancel error:", error);
    }
  };

  const getStatusClass = () => {
    switch (order.status) {
      case "DELIVERED":
        return "orderHistoryList-statusDelivered";
      case "ACCEPTED":
      case "PICKEDUP":
        return "orderHistoryList-statusActive";
      case "CANCELLED":
        return "orderHistoryList-statusCancelled";
      default:
        return "orderHistoryList-statusPending";
    }
  };

  return (
    <div
      className={`orderHistoryList-card ${
        isLive ? "orderHistoryList-cardActive" : ""
      }`}
      onClick={toggleExpand}
    >
      {/* HEADER */}
      <div className="orderHistoryList-topRow">
        <span className="orderHistoryList-date">
          {order?.createdAt?.substring(0, 10)}
        </span>

        <div
          className={`orderHistoryList-statusBadge ${getStatusClass()}`}
        >
          {order.status}
        </div>
      </div>

      {/* SUMMARY */}
      <h3 className="orderHistoryList-recipient">
        {order.recipientName}
      </h3>

      <div className="orderHistoryList-bottomRow">
        <span className="orderHistoryList-price">
          ₦
          {order?.totalPrice?.toLocaleString() ||
            order?.initialOfferPrice?.toLocaleString()}
        </span>

        <span className="orderHistoryList-transport">
          {order.transportationType}
        </span>
      </div>

      <p className="orderHistoryList-expandHint">
        {expanded ? "Click to collapse ▲" : "Click to expand ▼"}
      </p>

      {/* COLLAPSIBLE CONTENT */}
      <div
        className={`orderHistoryList-collapsible ${
          expanded ? "expanded" : ""
        }`}
      >
        <div className="orderHistoryList-expandedContent">
          <p className="orderHistoryList-details">
            {order.orderDetails}
          </p>

          <div className="orderHistoryList-divider" />

          {/* BUTTONS */}
          <div className="orderHistoryList-buttonRow">
            <button
              className="orderHistoryList-primaryButton"
              onClick={goToTracking}
            >
              Track
            </button>

            <button
              className="orderHistoryList-secondaryButton"
              onClick={goToOrderDetails}
            >
              Details
            </button>
          </div>

          {/* CONDITIONAL ACTIONS */}
          {order.status === "READY_FOR_PICKUP" && (
            <button
              className="orderHistoryList-dangerButton"
              onClick={deleteOrder}
            >
              Delete Order
            </button>
          )}

          {order.status === "ACCEPTED" && (
            <button
              className="orderHistoryList-warningButton"
              onClick={cancelOrder}
            >
              Cancel Delivery
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderHistoryList;