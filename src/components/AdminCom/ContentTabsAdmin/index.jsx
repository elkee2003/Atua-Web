import React from "react";
import { FaHome, FaBell, FaUser } from "react-icons/fa";
import { NavLink, useNavigate } from "react-router-dom";
import "./Sidebar.css";

function ContentTabsAdmin({ unreadCount }) {
  const navigate = useNavigate();

  return (
    <>
      {/* =========================================================
          DESKTOP SIDEBAR
      ========================================================= */}

      <aside className="admin-sidebar">
        {/* =======================================================
            ATUA LOGO
        ======================================================= */}

        <div
          className="admin-logoClick"
          onClick={() => navigate("/")}
          role="button"
          tabIndex={0}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              navigate("/");
            }
          }}
          aria-label="Go to Atua home"
        >
          <img src="/AtuaSoloLogoTrans.png" alt="Atua Logo" />
        </div>

        {/* =======================================================
            DESKTOP NAVIGATION
        ======================================================= */}

        <nav>
          <ul>
            {/* ===================================================
                HOME
            =================================================== */}

            <li>
              <NavLink
                to="/admin/home"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                <div className="admin-nav-container">
                  <FaHome aria-hidden="true" />

                  <span>Home</span>
                </div>
              </NavLink>
            </li>

            {/* ===================================================
                ALERTS
            =================================================== */}

            <li>
              <NavLink
                to="/admin/alert"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                <div className="admin-nav-container">
                  <FaBell aria-hidden="true" />

                  <span>Alerts</span>

                  {/* ---------------------------------------------
                      UNREAD ALERT BADGE
                  --------------------------------------------- */}

                  {unreadCount > 0 && (
                    <span
                      className="adminNotification-badge"
                      aria-label={`${unreadCount} unread alerts`}
                    >
                      {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                  )}
                </div>
              </NavLink>
            </li>

            {/* ===================================================
                PROFILE
            =================================================== */}

            <li>
              <NavLink
                to="/admin/profile"
                className={({ isActive }) => (isActive ? "active-link" : "")}
              >
                <div className="admin-nav-container">
                  <FaUser aria-hidden="true" />

                  <span>Profile</span>
                </div>
              </NavLink>
            </li>
          </ul>
        </nav>
      </aside>

      {/* =========================================================
          MOBILE BOTTOM NAVIGATION
      ========================================================= */}

      <div className="admin-bottom-nav">
        {/* =======================================================
            HOME
        ======================================================= */}

        <NavLink
          to="/admin/home"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <FaHome aria-hidden="true" />

          <span>Home</span>
        </NavLink>

        {/* =======================================================
            ALERTS
        ======================================================= */}

        <NavLink
          to="/admin/alert"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <div className="adminBottomNavBellCon">
            <FaBell aria-hidden="true" />

            <span>Alerts</span>

            {/* ---------------------------------------------
                UNREAD ALERT BADGE
            --------------------------------------------- */}

            {unreadCount > 0 && (
              <span
                className="adminNotification-badge"
                aria-label={`${unreadCount} unread alerts`}
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </div>
        </NavLink>

        {/* =======================================================
            PROFILE
        ======================================================= */}

        <NavLink
          to="/admin/profile"
          className={({ isActive }) => (isActive ? "active-link" : "")}
        >
          <FaUser aria-hidden="true" />

          <span>Profile</span>
        </NavLink>
      </div>
    </>
  );
}

export default ContentTabsAdmin;
