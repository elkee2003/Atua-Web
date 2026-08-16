// import Layout and Sidebar for client
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import "./SendRoutes.css";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";

import SendLayout from "../../components/Send/ContentLayout";
import CourierReviewGate from "../../components/Send/ContentPages/CourierReviewGate/CourierReviewGate";
import HomeScreen from "../../../src/components/Send/ContentPages/Home/HomeScreen/HomeScreen";
import DestinationSearch from "../../../src/components/Send/ContentPages/Home/DestinationSearch/Destination";
import ParcelNotes from "../../components/Send/ContentPages/Home/OrderComs/ParcelNotes";
import GoogleMapsProvider from "../../../Providers/ClientProvider/GoogleMapsProvider";
import SearchResult from "../../components/Send/ContentPages/Home/SearchResult/SearchResult";
import Checkout from "../../components/Send/ContentPages/Home/SearchResult/Checkout";
import Payment from "../../components/Send/ContentPages/Home/PaymentCom/Payment";
import OrderTrackingScreen from "../../components/Send/ContentPages/Home/OrderTrackingScreen/OrderTrackingScreen";

// Order Page
import OrderHistoryMain from "../../components/Send/ContentPages/OrderHistory/OrderHistoryMain/OrderHistoryMain";
import OrderHistoryList from "../../components/Send/ContentPages/OrderHistory/OrderHistoryList/OrderHistoryList";
import OrderLiveUpdate from "../../components/Send/ContentPages/OrderHistory/OrderLiveUpdate/OrderLiveUpdate";

// Profile Page
import UserProfile from "../../components/Send/ContentPages/Profile/Profile";
import EditProfile from "../../components/Send/ContentPages/Profile/EditProfile/EditProfile";
import ReviewProfileEdit from "../../components/Send/ContentPages/Profile/EditProfile/ReviewProfile";
import AddressPage from "../../components/Send/ContentPages/Profile/EditProfile/AddressPage";

// Profile Buttons

import Support from "../../components/Send/ContentPages/Profile/ProfileBtnsCom/Support/Support";
import DeleteAccount from "../../components/Send/ContentPages/Profile/ProfileBtnsCom/DeleteAccount/DeleteAccount";

const SendRoutes = () => (
  <GoogleMapsProvider>
    <CourierReviewGate />

    <Routes>
      {/* Layout wrapper */}
      <Route path="/" element={<SendLayout />}>
        {/* Redirect /send → /send/home */}
        <Route index element={<Navigate to="home" replace />} />

        {/* Home */}
        <Route path="home" element={<HomeScreen />} />

        {/* Destination Search */}
        <Route path="destination_search" element={<DestinationSearch />} />

        {/* Search Result*/}
        <Route path="search_results" element={<SearchResult />} />

        {/* Parcel Notes */}
        <Route path="parcel_notes" element={<ParcelNotes />} />

        {/* Checkout*/}
        <Route path="checkout" element={<Checkout />} />

        {/* Payment*/}
        <Route path="payment/:orderId" element={<Payment />} />

        {/* Order Tracking Screen*/}
        <Route
          path="order_tracking_screen/:orderId"
          element={<OrderTrackingScreen />}
        />

        {/* OrderHistory Main */}
        <Route path="orders" element={<OrderHistoryMain />} />

        {/* Order Live Update */}
        <Route path="order_live_update" element={<OrderHistoryMain />} />

        {/* User Profile */}
        <Route path="profile" element={<UserProfile />} />

        <Route path="edit_profile" element={<EditProfile />} />

        <Route path="address_page" element={<AddressPage />} />

        <Route path="review_edit" element={<ReviewProfileEdit />} />

        {/* User Profile Options Buttons */}

        <Route path="support" element={<Support />} />

        <Route path="delete_account" element={<DeleteAccount />} />

        {/* 404 */}
        <Route
          path="*"
          element={
            <div className="error404Con">
              {/* <p>404 Not Found</p> */}
              <DotLottieReact
                src="https://lottie.host/ce256115-23fd-4107-bf6b-c962f7ca030a/p1k0hD4Rgc.lottie"
                loop
                autoplay
                className="errorLottie"
              />
            </div>
          }
        />
      </Route>
    </Routes>
  </GoogleMapsProvider>
);

export default SendRoutes;
