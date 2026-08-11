import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import ContentTabsAdmin from "../ContentTabsAdmin";
import "./ContentLayout.css";
import { useAuthContext } from "../../../../Providers/ClientProvider/AuthProvider";

const Layout = () => {
  const [unreadCount] = useState(0);
  const { dbUser } = useAuthContext();

  /*
    Notification logic will be re-enabled later.

    useEffect(() => {
      ...
    }, [dbUser]);
  */

  return (
    <div className="admin-layoutCon">
      {/* Sidebar */}
      <ContentTabsAdmin unreadCount={unreadCount} admin={dbUser} />

      {/* Main Content */}
      <main className="admin-main-content">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;
