import React from "react";
import '../../Home/SendStyles/OrderHistoryList.css';
import { useNavigate } from "react-router-dom";

const OrderHistoryList = ({ order, onDelete, onCancel }) => {
  const navigate = useNavigate();

  const goToOrderLiveUpdate = () => {
    if (order.status === "ACCEPTED" || order.status === "PICKEDUP") {
      navigate(`/send/order_live_update/${order.id}`);
    }
  };

  const handleCopyPhoneNumber = async () => {
    if (order.courier && order.courier.phoneNumber) {
      await navigator.clipboard.writeText(order.courier.phoneNumber);
      alert("Phone Number Copied! You can paste it into the dialer to make a call.");
    }
  };

  const getStatusText = (status) => {
    if (status === "DELIVERED") return "Completed";
    if (status === "ACCEPTED") return "Accepted";
    return "Pending";
  };

  return (
    <div className="orderHistoryListContainer" onClick={goToOrderLiveUpdate}>
      <p className="subHeading">Date:</p>
      <p className="detail">{order?.createdAt ? order?.createdAt.substring(0, 10) : ""}</p>

      <p className="subHeading">Recipient Name:</p>
      <p className="detail">{order.recipientName}</p>

      <p className="subHeading">Item Sent:</p>
      <p className="detail">{order.orderDetails}</p>

      <p className="subHeading">Destination:</p>
      <p className="detail">
        {order?.parcelDestination
          ? order?.parcelDestination.length > 20
            ? `${order.parcelDestination.substring(0, 30)}...`
            : order.parcelDestination
          : ""}
      </p>

      <p className="subHeading">Status:</p>
      <div className="statusRow">
        <p className="detail">{getStatusText(order.status)}</p>
        {(order.status === "DELIVERED" || order.status === "ACCEPTED") ? (
          <div className="greenIcon"></div>
        ) : (
          <div className="redIcon"></div>
        )}
      </div>

      {order.courier && order.status !== "DELIVERED" && (
        <div>
          <p className="subHeading">Courier Name:</p>
          <p className="detail">{order.courier.firstName}</p>

          <p className="subHeading">Courier Phone number:</p>
          <p className="detail phoneNumber" onClick={handleCopyPhoneNumber}>
            {order.courier.phoneNumber}
          </p>
        </div>
      )}

      <div className="priceTypeRow">
        <div>
          <p className="subHeading">Price:</p>
          <p className="priceType">₦{order?.price?.toLocaleString()}</p>
        </div>

        <div>
          <p className="subHeading">Transport Type:</p>
          <p className="priceType">{order?.transportationType}</p>
        </div>
      </div>

      {order.status === "READY_FOR_PICKUP" && (
        <button
          className="deleteButtonCon"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this order?")) onDelete();
          }}
        >
          <span className="deleteButtonTxt">Delete Order</span>
        </button>
      )}

      {order.status === "ACCEPTED" && (
        <button
          className="cancelButtonCon"
          onClick={(e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to cancel this order?")) onCancel();
          }}
        >
          <span className="cancelButtonTxt">Cancel Order</span>
        </button>
      )}
    </div>
  );
};

export default OrderHistoryList;
