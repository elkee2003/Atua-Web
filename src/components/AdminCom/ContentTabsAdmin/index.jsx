import React from "react";
import { FaHome, FaBell, FaUser } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function ContentTabsAdmin({ unreadCount }) {
  const navigate = useNavigate();

  return (
    <>
      {/* ===========================
                Desktop Sidebar
            =========================== */}
      <aside className="admin-sidebar">
        <div className="admin-logoClick" onClick={() => navigate("/")}>
          <img src="/AtuaSoloLogoTrans.png" alt="Atua Logo" />
        </div>

        <nav>
          <ul>
            <li>
              <NavLink
                to="/admin/home"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                <div className="admin-nav-container">
                  <FaHome />
                  <span>Home</span>
                </div>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/alert"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                <div className="admin-nav-container">
                  <FaBell />
                  <span>Alerts</span>

                  {unreadCount > 0 && (
                    <span className="adminNotification-badge">
                      {unreadCount}
                    </span>
                  )}
                </div>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/admin/profile"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                <div className="admin-nav-container">
                  <FaUser />
                  <span>Profile</span>
                </div>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* ===========================
                Mobile Bottom Navigation
            =========================== */}

      <div className="admin-bottom-nav">
        <NavLink
          to="/admin/home"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <FaHome />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/admin/alert"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <div className="adminBottomNavBellCon">
            <FaBell />
            <span>Alerts</span>

            {unreadCount > 0 && (
              <span className="adminNotification-badge">{unreadCount}</span>
            )}
          </div>
        </NavLink>

        <NavLink
          to="/admin/profile"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <FaUser />
          <span>Profile</span>
        </NavLink>
      </div>
    </>
  );
}

export default ContentTabsAdmin;
