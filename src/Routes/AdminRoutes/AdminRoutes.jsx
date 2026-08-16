// import Layout and Sidebar for client
import React from "react";
import { Routes, Route } from "react-router-dom";
import GoogleMapsProvider from "../../../Providers/ClientProvider/GoogleMapsProvider";
import "./AdminRoutes.css";
import AdminLayout from "../../components/AdminCom/ContentLayout";
import AdminHome from "../../components/AdminCom/ContentPagesAdmin/Home/AdminHome";
import ControlTower from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/ControlTower/ControlTower";
import Alerts from "../../components/AdminCom/ContentPagesAdmin/Alerts/Alerts";
import Profile from "../../components/AdminCom/ContentPagesAdmin/Profile/Profile";
import UsersDashboard from "../../components/AdminCom/ContentPagesAdmin/Profile/UsersDashboard/UsersDashboard";
import CourierDashboard from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierDashboard/CourierDashboard";
import UserDashboard from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/User/UserDashboard";
import CourierFullProfile from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierFullProfile/CourierFullProfile";
import CourierOrders from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierOrders/CourierOrders";
import CourierAnalytics from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierAnalytics/CourierAnalytics";
import CourierWallet from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierWallet/CourierWallet";
import CourierPayouts from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierPayouts/CourierPayouts";
import CourierReviews from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierReviews/CourierReviews";
import CourierReports from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierReports/CourierReports";
import CourierDocuments from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierDocuments/CourierDocuments";
import CourierLiveTrackingPage from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Courier/CourierLiveTracking/CourierLiveTracking";
import OrderDetails from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/Order/OrderDetails/OrderDetails";
import UserFullProfile from "../../components/AdminCom/ContentPagesAdmin/Home/Operations/User/FullDetails.jsx/UserFullProfile";

const AdminRoutes = () => (
  <GoogleMapsProvider>
    <Routes>
      <Route path="/" element={<AdminLayout />}>
        {/* Admin Home */}
        <Route path="home" element={<AdminHome />} />

        {/* Control Tower */}
        <Route path="control_tower" element={<ControlTower />} />

        {/* Alerts */}
        <Route path="alert" element={<Alerts />} />

        {/* Profile */}
        <Route path="profile" element={<Profile />} />

        {/* Users Dashboard */}
        <Route path="users_dashboard" element={<UsersDashboard />} />

        {/* Courier Dashboard */}
        <Route path="courier_dashboard" element={<CourierDashboard />} />
        {/* User Dashboard */}
        <Route path="user_dashboard" element={<UserDashboard />} />

        {/* Full Courier Profile */}
        <Route
          path="courier_full_profile/:id"
          element={<CourierFullProfile />}
        />
        {/* Courier Orders Specific */}
        <Route path="courier_orders/:id" element={<CourierOrders />} />

        {/* Courier Wallet Specific */}
        <Route path="courier_wallet/:id" element={<CourierWallet />} />

        {/* Courier Payouts Specific */}
        <Route path="courier_payouts/:id" element={<CourierPayouts />} />

        {/* Courier Reviews Specific */}
        <Route path="courier_reviews/:id" element={<CourierReviews />} />

        {/* Courier Reports Specific */}
        <Route path="courier_reports/:id" element={<CourierReports />} />

        {/* Courier documents */}
        <Route path="courier_documents/:id" element={<CourierDocuments />} />

        {/* Courier Analytics */}
        <Route path="courier_analytics/:id" element={<CourierAnalytics />} />

        {/* Courier Live Update*/}
        <Route
          path="courier_live_tracking/:id"
          element={<CourierLiveTrackingPage />}
        />

        {/* Order Details */}
        <Route path="order_details/:id" element={<OrderDetails />} />

        {/* Full User Profile */}
        <Route path="user_full_profile/:id" element={<UserFullProfile />} />

        {/* for invalid route */}
        <Route
          path="*"
          element={
            <div className="adminError404Con">
              <p>404 Not Found</p>
            </div>
          }
        />
      </Route>
    </Routes>
  </GoogleMapsProvider>
);

export default AdminRoutes;
