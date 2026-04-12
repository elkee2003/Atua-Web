import React, { useEffect, useState } from "react";
import { DataStore } from "aws-amplify/datastore";
import { useParams } from "react-router-dom";
import { Order } from "../../../../../../../../models";
import "./CourierOrders.css";

function CourierOrders() {
  const { id } = useParams();

  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("ALL");

  useEffect(() => {
    fetchOrders();
  }, [id]);

  const fetchOrders = async () => {
    const data = await DataStore.query(Order, (o) =>
      o.assignedCourierId.eq(id)
    );
    setOrders(data);
  };

  const filtered = orders.filter((o) => {
    const matchSearch =
      o.originAddress?.toLowerCase().includes(search.toLowerCase()) ||
      o.destinationAddress?.toLowerCase().includes(search.toLowerCase());

    const matchStatus = status === "ALL" || o.status === status;

    return matchSearch && matchStatus;
  });

  return (
    <div className="orders-page">

      <h1>📦 Courier Orders</h1>

      {/* FILTERS */}
      <div className="filters">
        <input
          placeholder="Search address..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="ALL">All</option>
          <option value="DELIVERED">Delivered</option>
          <option value="IN_TRANSIT">In Transit</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {/* TABLE */}
      <div className="orders-table">
        {filtered.map((o) => (
          <div key={o.id} className="order-card">

            <div className="route">
              <p className="from">{o.originAddress}</p>
              <p className="to">{o.destinationAddress}</p>
            </div>

            <div className="meta">
              <span className={`status ${o.status.toLowerCase()}`}>
                {o.status}
              </span>
              <span className="price">₦{o.totalPrice}</span>
            </div>

          </div>
        ))}
      </div>

    </div>
  );
}

export default CourierOrders;