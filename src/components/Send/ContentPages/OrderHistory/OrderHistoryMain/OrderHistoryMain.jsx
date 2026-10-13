import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { DataStore } from "aws-amplify/datastore";
import { useEffect, useState, useCallback } from "react";
import { FaBoxOpen, FaRedoAlt } from "react-icons/fa";
import { Order } from "../../../../../../src/models";
import OrderHistoryList from "../OrderHistoryList/OrderHistoryList";
import "./OrderHistoryMain.css";

const OrderHistoryMain = () => {
  // const GOOGLE_API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
  const { dbUser } = useAuthContext();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!dbUser?.id) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);

    console.log("[OrderHistory] Starting observeQuery for user:", dbUser.id);

    const subscription = DataStore.observeQuery(Order, (order) =>
      order.userID.eq(dbUser.id),
    ).subscribe(
      async ({ items }) => {
        try {
          const sortedOrders = [...items].sort(
            (a, b) =>
              new Date(b.createdAt ?? 0).getTime() -
              new Date(a.createdAt ?? 0).getTime(),
          );

          const ordersWithCouriers = await Promise.all(
            sortedOrders.map(async (order) => {
              let courier = null;

              if (order.assignedCourierId && order.status !== "DELIVERED") {
                courier = await order.assignedCourier;
              }

              return { ...order, courier };
            }),
          );

          setOrders(ordersWithCouriers);
        } catch (error) {
          console.error("[OrderHistory] Error processing orders:", error);
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      (error) => {
        console.error("[OrderHistory] observeQuery subscription error:", error);
        setLoading(false);
        setRefreshing(false);
      },
    );

    return () => {
      console.log("[OrderHistory] Unsubscribing");
      subscription.unsubscribe();
    };
  }, [dbUser?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // observeQuery already listens for local DataStore changes.
    // This button simply lets the user request a fresh UI update.
    // It does not fetch new server data by itself.
    setOrders((currentOrders) => [...currentOrders]);
    setRefreshing(false);
  }, []);

  if (loading) {
    return (
      <div className="orderHistoryMain">
        <div className="orderHistoryMain-loader">
          <span className="orderHistoryMain-spinner" />
          <p>Fetching your orders...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="orderHistoryMain">
      <div className="orderHistoryMain-container">
        <header className="orderHistoryMain-heading">
          <div>
            <h1>Order History</h1>
            <p>Track your ongoing and completed deliveries</p>
          </div>

          <button
            type="button"
            className="orderHistoryMain-refresh"
            onClick={onRefresh}
            disabled={refreshing}
            aria-label="Refresh order list"
            title="Refresh order list"
          >
            <FaRedoAlt className={refreshing ? "isRefreshing" : ""} />
            <span>Refresh</span>
          </button>
        </header>

        {orders.length === 0 ? (
          <section className="orderHistoryMain-empty">
            <div className="orderHistoryMain-emptyIcon">
              <FaBoxOpen />
            </div>

            <h2>No Orders Yet</h2>

            <p>Once you place an order, it will appear here.</p>
          </section>
        ) : (
          <div className="orderHistoryMain-list">
            {orders.map((order) => (
              <OrderHistoryList key={order.id} order={order} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

export default OrderHistoryMain;
