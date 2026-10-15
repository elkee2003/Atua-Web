import { generateClient } from "aws-amplify/api";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  FaChevronDown,
  FaChevronUp,
  FaClock,
  FaCreditCard,
  FaMapMarkerAlt,
  FaRegFileAlt,
  FaTrashAlt,
} from "react-icons/fa";
import "./OrderHistoryList.css";

const client = generateClient();

const OrderHistoryList = ({ order, refreshOrders }) => {
  const navigate = useNavigate();

  const [expanded, setExpanded] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // Transportation type
  const transportationType = String(
    order?.transportationType || "",
  ).toUpperCase();

  const isMaxi = transportationType === "MAXI";

  const isMicroOrMoto = [
    "MOTO_EXPRESS",
    "MOTO_BATCH",
    "MICRO_EXPRESS",
    "MICRO_BATCH",
  ].includes(transportationType);

  // Maxi live bidding
  const showLiveBadge =
    isMaxi &&
    order?.status === "BIDDING" &&
    order?.hasNewOffer &&
    order?.lastOfferSenderType !== "USER";

  // Active order
  const isLive = order?.status === "ACCEPTED";

  // Micro / Moto awaiting payment
  const isAwaitingPayment =
    isMicroOrMoto && order?.status === "AWAITING_PAYMENT";

  // Delete eligibility
  const isMaxiUnpaid =
    isMaxi &&
    (order?.status === "BIDDING" ||
      (order?.status === "ACCEPTED" && order?.paymentStatus !== "PAID"));

  const canDelete =
    isMaxiUnpaid || (isMicroOrMoto && order?.status === "AWAITING_PAYMENT");

  const toggleExpand = () => {
    setExpanded((previous) => !previous);
  };

  // Navigation to order details
  const goToOrderDetails = () => {
    if (!order?.id) return;

    navigate(`/send/order_details/${order.id}`);
  };

  // Navigation to order tracking
  const goToTracking = () => {
    if (!order?.id) return;

    navigate(`/send/order_tracking/${order.id}`);
  };

  // Navigate to payment when the order is awaiting payment
  const goToPayment = () => {
    if (!isAwaitingPayment || !order?.id) return;

    navigate(`/send/payment/${order.id}`);
  };

  // Delete order through the backend mutation
  const deleteOrder = async () => {
    if (!canDelete || actionLoading || !order?.id) return;

    try {
      setActionLoading(true);

      const mutation = /* GraphQL */ `
        mutation PermanentlyDeleteOrder($orderID: ID!) {
          permanentlyDeleteOrder(orderID: $orderID)
        }
      `;

      const result = await client.graphql({
        query: mutation,
        authMode: "userPool",
        variables: {
          orderID: order.id,
        },
      });

      const deleted = result?.data?.permanentlyDeleteOrder;

      if (deleted !== true) {
        throw new Error("The order could not be deleted.");
      }

      refreshOrders?.();
    } catch (error) {
      console.error("Delete order error:", error);

      const errorMessage =
        error?.errors?.[0]?.message ||
        error?.graphQLErrors?.[0]?.message ||
        error?.message ||
        "We could not delete this order. Please try again.";

      window.alert(`Unable to Delete Order\n\n${errorMessage}`);
    } finally {
      setActionLoading(false);
    }
  };

  const confirmDelete = () => {
    if (!canDelete || actionLoading) return;

    const isUnpaidMaxi =
      isMaxi &&
      (order?.status === "BIDDING" ||
        (order?.status === "ACCEPTED" && order?.paymentStatus !== "PAID"));

    let message = "Are you sure you want to permanently delete this order?";

    if (isAwaitingPayment) {
      message =
        "This order has not been paid for yet. Are you sure you want to permanently delete it?";
    } else if (isUnpaidMaxi && order?.status === "BIDDING") {
      message =
        "This Maxi order is still bidding. Are you sure you want to permanently delete it?";
    } else if (isUnpaidMaxi) {
      message =
        "This Maxi order has been accepted but has not been paid for. Are you sure you want to permanently delete it?";
    }

    if (window.confirm(message)) {
      deleteOrder();
    }
  };

  // Status styling
  const getStatusClass = () => {
    switch (order?.status) {
      case "DELIVERED":
        return "orderHistoryList-statusDelivered";

      case "ACCEPTED":
      case "PICKED_UP":
        return "orderHistoryList-statusActive";

      case "CANCELLED":
        return "orderHistoryList-statusCancelled";

      default:
        return "orderHistoryList-statusPending";
    }
  };

  const getStatusLabel = () => {
    if (isAwaitingPayment) {
      return "AWAITING PAYMENT";
    }

    return order?.status || "UNKNOWN";
  };

  const getOrderPrice = () => {
    if (order?.totalPrice != null) {
      return Number(order.totalPrice).toLocaleString();
    }

    if (order?.initialOfferPrice != null) {
      return Number(order.initialOfferPrice).toLocaleString();
    }

    return "0";
  };

  const formattedDate = order?.createdAt
    ? String(order.createdAt).substring(0, 10)
    : "";

  return (
    <article
      className={`orderHistoryList-card ${
        isLive ? "orderHistoryList-cardActive" : ""
      }`}
    >
      {/* Collapsed order summary */}
      <button
        type="button"
        className="orderHistoryList-summary"
        onClick={toggleExpand}
        aria-expanded={expanded}
      >
        <div className="orderHistoryList-topRow">
          <span className="orderHistoryList-date">{formattedDate}</span>

          <div className="orderHistoryList-badges">
            {showLiveBadge && (
              <span className="orderHistoryList-liveBadge">
                <span className="orderHistoryList-liveDot" />
                LIVE
              </span>
            )}

            <span
              className={`orderHistoryList-statusBadge ${getStatusClass()}`}
            >
              {getStatusLabel()}
            </span>
          </div>
        </div>

        <div className="orderHistoryList-recipient">
          {order?.recipientName || "Recipient"}
        </div>

        <div className="orderHistoryList-bottomRow">
          <span className="orderHistoryList-price">₦{getOrderPrice()}</span>

          <span className="orderHistoryList-transport">
            {order?.transportationType || ""}
          </span>
        </div>

        <div className="orderHistoryList-expandHint">
          <span>{expanded ? "Tap to collapse" : "Tap to expand"}</span>

          {expanded ? <FaChevronUp /> : <FaChevronDown />}
        </div>
      </button>

      {/* Expanded content */}
      {expanded && (
        <div className="orderHistoryList-expanded">
          <div className="orderHistoryList-sectionHeading">
            <FaRegFileAlt />
            <span>Order Details</span>
          </div>

          <p className="orderHistoryList-details">
            {order?.orderDetails || "No order details available."}
          </p>

          <div className="orderHistoryList-divider" />

          {isAwaitingPayment && (
            <div className="orderHistoryList-paymentNotice">
              <div className="orderHistoryList-paymentNoticeIcon">
                <FaCreditCard />
              </div>

              <div>
                <h4>Payment Required</h4>
                <p>
                  This order has not been paid for yet. Complete payment to
                  continue with your delivery.
                </p>
              </div>
            </div>
          )}

          <div className="orderHistoryList-buttonRow">
            <button
              type="button"
              className="orderHistoryList-primaryButton"
              disabled={actionLoading}
              onClick={goToTracking}
            >
              <FaMapMarkerAlt />
              Track
            </button>

            <button
              type="button"
              className="orderHistoryList-secondaryButton"
              disabled={actionLoading}
              onClick={goToOrderDetails}
            >
              <FaRegFileAlt />
              Details
            </button>
          </div>

          {isAwaitingPayment && (
            <button
              type="button"
              className="orderHistoryList-payButton"
              disabled={actionLoading}
              onClick={goToPayment}
            >
              <FaCreditCard />
              Pay ₦{getOrderPrice()}
            </button>
          )}

          {canDelete && (
            <button
              type="button"
              className="orderHistoryList-dangerButton"
              disabled={actionLoading}
              onClick={confirmDelete}
            >
              <FaTrashAlt />
              {actionLoading ? "Deleting..." : "Delete Order"}
            </button>
          )}
        </div>
      )}
    </article>
  );
};

export default OrderHistoryList;
