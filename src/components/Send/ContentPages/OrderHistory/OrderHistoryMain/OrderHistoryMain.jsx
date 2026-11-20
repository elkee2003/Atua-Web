import { useAuthContext } from "../../../../../../Providers/ClientProvider/AuthProvider";
import { DataStore } from "aws-amplify/datastore";
import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaBoxOpen, FaRedoAlt } from "react-icons/fa";
import { Order } from "../../../../../../src/models";
import OrderHistoryList from "../OrderHistoryList/OrderHistoryList";
import "./OrderHistoryMain.css";

const OrderHistoryMain = () => {
  const { authUser, dbUser } = useAuthContext();
  const navigate = useNavigate();

  const redirectHandled = useRef(false);

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Handle authentication and profile requirements.
  useEffect(() => {
    // Wait for the initial authentication check.
    if (authUser === undefined) return;

    // User is signed out.
    if (authUser === null) {
      if (redirectHandled.current) return;

      redirectHandled.current = true;

      alert("Kindly sign in to continue.");

      navigate("/", {
        replace: true,
        state: { scrollTo: "signIn" },
      });

      return;
    }

    // Wait for the database profile to finish loading.
    if (dbUser === undefined) return;

    // User is signed in but has no database profile.
    if (!dbUser?.id) {
      if (redirectHandled.current) return;

      redirectHandled.current = true;

      alert("Kindly complete your profile before continuing.");

      navigate("/send/edit_profile", {
        replace: true,
      });
    }
  }, [authUser, dbUser, navigate]);

  // Load and observe orders only for authenticated users with a profile.
  useEffect(() => {
    if (authUser === undefined || authUser === null || !dbUser?.id) {
      setOrders([]);
      setLoading(true);
      return;
    }

    let isMounted = true;

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

          if (isMounted) {
            setOrders(ordersWithCouriers);
          }
        } catch (error) {
          console.error("[OrderHistory] Error processing orders:", error);
        } finally {
          if (isMounted) {
            setLoading(false);
            setRefreshing(false);
          }
        }
      },
      (error) => {
        console.error("[OrderHistory] observeQuery subscription error:", error);

        if (isMounted) {
          setLoading(false);
          setRefreshing(false);
        }
      },
    );

    return () => {
      isMounted = false;
      console.log("[OrderHistory] Unsubscribing");
      subscription.unsubscribe();
    };
  }, [authUser, dbUser?.id]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);

    // observeQuery already listens for local DataStore changes.
    // This triggers a UI update, not a fresh server fetch.
    setOrders((currentOrders) => [...currentOrders]);
    setRefreshing(false);
  }, []);

  // Wait for authentication and profile checks before rendering.
  if (
    authUser === undefined ||
    authUser === null ||
    dbUser === undefined ||
    !dbUser?.id
  ) {
    return null;
  }

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
