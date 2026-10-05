import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";

import { AdminAlert } from "../../../models";

import { useAuthContext } from "../../../../Providers/ClientProvider/AuthProvider";

import "./ContentLayout.css";

import ContentTabsAdmin from "../ContentTabsAdmin";

function ContentLayout() {
  const [unreadCount, setUnreadCount] = useState(0);

  const { dbUser } = useAuthContext();

  useEffect(() => {
    let isMounted = true;

    /* =========================================================
       LOAD UNREAD ADMIN ALERT COUNT
    ========================================================= */

    const loadUnreadCount = async () => {
      try {
        const alerts = await DataStore.query(AdminAlert);

        if (!isMounted) return;

        const unreadAlerts = alerts.filter(
          (alert) =>
            alert &&
            !alert._deleted &&
            String(alert.status || "").toUpperCase() === "UNREAD",
        );

        setUnreadCount(unreadAlerts.length);
      } catch (error) {
        console.error("[AdminAlert] Failed to load unread alert count:", error);

        if (isMounted) {
          setUnreadCount(0);
        }
      }
    };

    /* =========================================================
       INITIAL LOAD
    ========================================================= */

    loadUnreadCount();

    /* =========================================================
       REAL-TIME ADMIN ALERT SUBSCRIPTION
    =========================================================

       Listen for AdminAlert changes so the notification
       badge in ContentTabsAdmin updates automatically.

       This covers:

       - CREATE
       - UPDATE
       - DELETE

       No page refresh is required.
    ========================================================= */

    const subscription = DataStore.observe(AdminAlert).subscribe({
      next: (change) => {
        console.log(
          "[AdminAlert] Real-time change detected:",
          change?.opType,
          change?.element?.id,
        );

        loadUnreadCount();
      },

      error: (error) => {
        console.error("[AdminAlert] Real-time subscription error:", error);
      },
    });

    /* =========================================================
       CLEANUP
    ========================================================= */

    return () => {
      isMounted = false;
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <div className="admin-layoutCon">
      {/* =======================================================
          ADMIN NAVIGATION

          ContentTabsAdmin contains BOTH:

          1. Desktop sidebar
          2. Mobile bottom navigation

          The existing Sidebar.css controls when each one
          is displayed.
      ======================================================= */}

      <ContentTabsAdmin unreadCount={unreadCount} />

      {/* =======================================================
          ADMIN PAGE CONTENT

          The existing ContentLayout.css controls:

          Desktop:
          - 270px sidebar offset

          Mobile:
          - full width
          - bottom navigation spacing
      ======================================================= */}

      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
}

export default ContentLayout;
