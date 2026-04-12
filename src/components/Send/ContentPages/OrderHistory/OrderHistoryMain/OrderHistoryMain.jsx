import React, { useState, useEffect } from "react";
import '../../Home/SendStyles/OrderHistoryMain.css';
import { DataStore } from "aws-amplify/datastore";
import { Order, Courier } from "../../../../../models";
import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import OrderHistoryList from "../OrderHistoryList/OrderHistoryList";

const OrderHistoryMain = () => {
  const { dbUser } = useAuthContext();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const userOrders = await DataStore.query(Order, (order) =>
        order.userID.eq(dbUser.id)
      );
      const sortedOrders = userOrders.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      // Fetch courier data for each order
      const ordersWithCouriers = await Promise.all(
        sortedOrders.map(async (order) => {
          if (order.orderCourierId && order.status !== "DELIVERED") {
            const courier = await DataStore.query(Courier, (c) =>
              c.id.eq(order.orderCourierId)
            );
            return { ...order, courier: courier[0] || null };
          }
          return { ...order, courier: null };
        })
      );

      setOrders(ordersWithCouriers);
    } catch (e) {
      console.error("Error fetching orders", e.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteOrder = async (orderId) => {
    try {
      const orderToDelete = await DataStore.query(Order, orderId);
      if (orderToDelete && orderToDelete.status !== "ACCEPTED") {
        await DataStore.delete(orderToDelete);
      }
    } catch (e) {
      console.error("Error deleting order", e);
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      const orderToCancel = await DataStore.query(Order, orderId);
      if (orderToCancel && orderToCancel.status === "ACCEPTED") {
        await DataStore.save(
          Order.copyOf(orderToCancel, (updated) => {
            updated.status = "READY_FOR_PICKUP";
            updated.orderCourierId = null;
          })
        );
        alert(
          "Order Canceled\nThe order is now available for other couriers to pick up."
        );
        fetchOrders();
      }
    } catch (e) {
      console.error("Error canceling order", e);
    }
  };

  useEffect(() => {
    fetchOrders();

    const subscription = DataStore.observe(Order).subscribe(({ opType }) => {
      if (opType === "INSERT" || opType === "UPDATE" || opType === "DELETE") {
        fetchOrders();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner" /> 
      </div>
    );
  }

  return (
    <div className="orderHistoryMainContainer">
      {/* Header */}
      <div>
        <h2 className="orderHistoryMainHeader">Order History</h2>
      </div>

      {orders.length === 0 ? (
        <div className="noOrdersCon">
          <p className="noOrders">No Orders</p>
        </div>
      ) : (
        <div className="flatList">
          {orders.map((item) => (
            <OrderHistoryList
              key={item.id}
              order={item}
              onDelete={() => deleteOrder(item.id)}
              onCancel={() => cancelOrder(item.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryMain;
