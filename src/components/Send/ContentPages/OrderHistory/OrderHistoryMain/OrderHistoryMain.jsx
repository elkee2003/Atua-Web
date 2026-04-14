import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { DataStore } from "aws-amplify/datastore";
import { useCallback, useEffect, useState } from "react";
import { Courier, Order } from "../../../../../../src/models";
import OrderHistoryList from "../OrderHistoryList/OrderHistoryList";
import "./orderHistoryMain.css";

const OrderHistoryMain = () => {
  const { dbUser } = useAuthContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchOrders = useCallback(async () => {
    if (!dbUser?.id) return;

    try {
      setLoading(true);

      const userOrders = await DataStore.query(Order, (order) =>
        order.userID.eq(dbUser.id)
      );

      const sortedOrders = userOrders.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() -
          new Date(a.createdAt).getTime()
      );

      const ordersWithCouriers = await Promise.all(
        sortedOrders.map(async (order) => {
          if (order.assignedCourierId && order.status !== "DELIVERED") {
            const courier = await DataStore.query(Courier, (c) =>
              c.id.eq(order.assignedCourierId)
            );
            return { ...order, courier: courier[0] || null };
          }
          return { ...order, courier: null };
        })
      );

      setOrders(ordersWithCouriers);
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [dbUser?.id]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchOrders();
  };

  useEffect(() => {
    fetchOrders();

    const subscription = DataStore.observe(Order).subscribe(() => {
      fetchOrders();
    });

    return () => subscription.unsubscribe();
  }, [fetchOrders]);

  // 🔥 LOADING STATE
  if (loading) {
    return (
      <div className="orderHistory-loaderContainer">
        <div className="spinner" />
        <p>Fetching your orders...</p>
      </div>
    );
  }

  return (
    <div className="orderHistory-container">
      <div className="orderHistory-header">
        <h1>Order History</h1>
        <p>Track your ongoing and completed deliveries</p>

        <button
          className="refreshBtn"
          onClick={onRefresh}
          disabled={refreshing}
        >
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {orders.length === 0 ? (
        <div className="orderHistory-empty">
          <h2>No Orders Yet</h2>
          <p>Once you place an order, it will appear here.</p>
        </div>
      ) : (
        <div className="orderHistory-list">
          {orders.map((item) => (
            <OrderHistoryList
              key={item.id}
              order={item}
              refreshOrders={fetchOrders}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistoryMain;