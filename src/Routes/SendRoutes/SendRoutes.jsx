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

// Maxi
import MaxiTypes from "../../components/Send/ContentPages/Home/SearchResult/MaxiTypes/MaxiTypeCategories/MaxiVehicleCategories";
import MaxiVehicleGallery from "../../components/Send/ContentPages/Home/SearchResult/MaxiTypes/MaxiTypeCategories/MaxiVehicleGallery/MaxiVehicleGallery";

import MaxiCargoDetails from "../../components/Send/ContentPages/Home/SearchResult/MaxiTypes/MaxiDetails/MaxiCargoDetailsCom/MaxiCargoDetails";

import MaxiLoadingDetails from "../../components/Send/ContentPages/Home/SearchResult/MaxiTypes/MaxiDetails/MaxiLoadingDetailsCom/MaxiLoadingDetails";

import MaxiRecipient from "../../components/Send/ContentPages/Home/SearchResult/MaxiTypes/MaxiDetails/MaxiRecipientCom/MaxiRecipient";

import MaxiSubmit from "../../components/Send/ContentPages/Home/SearchResult/MaxiTypes/MaxiSubmitCom/MaxiSubmit";

// Order Page
import OrderHistoryMain from "../../components/Send/ContentPages/OrderHistory/OrderHistoryMain/OrderHistoryMain";
import OrderDetails from "../../components/Send/ContentPages/OrderHistory/OrderDetails/OrderDetails";

import OrderTrackingScreen from "../../components/Send/ContentPages/OrderHistory/OrderTrackingScreen/OrderTrackingScreen";

import RecipientTrackingPage from "../../components/Send/ContentPages/RecipientTracking/RecipientTracking";

// Profile Page
import UserProfile from "../../components/Send/ContentPages/Profile/Profile";
import EditProfile from "../../components/Send/ContentPages/Profile/EditProfile/EditProfile";
import ReviewUserProfileEdit from "../../components/Send/ContentPages/Profile/EditProfile/ReviewUserProfile";
import AddressPage from "../../components/Send/ContentPages/Profile/EditProfile/AddressPage";
import ReviewUserProfile from "../../components/Send/ContentPages/Profile/ReviewUserProfile/ReviewUserProfile";

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

        {/* Maxi Type */}
        <Route path="maxitypes" element={<MaxiTypes />} />

        {/* Maxi Vehicle Gallery */}
        <Route path="maxi_vehicle_gallery" element={<MaxiVehicleGallery />} />

        {/* Maxi Vehicle Gallery */}
        <Route path="maxi_vehicle_gallery" element={<MaxiVehicleGallery />} />

        {/* Maxi Cargo Details */}
        <Route path="maxicargodetails" element={<MaxiCargoDetails />} />

        {/* Maxi Loading Details */}
        <Route path="maxi_loading_details" element={<MaxiLoadingDetails />} />

        {/* Maxi Recipient */}
        <Route path="maxi_recipient_details" element={<MaxiRecipient />} />

        {/* Maxi Submit */}
        <Route path="maxi_submit" element={<MaxiSubmit />} />

        {/* Payment*/}
        <Route path="payment/:orderId" element={<Payment />} />

        {/* Order Tracking Screen*/}
        <Route
          path="order_tracking_screen/:orderId"
          element={<OrderTrackingScreen />}
        />

        {/* Recipient Tracking Screen */}
        <Route
          path="track/:trackingToken"
          element={<RecipientTrackingPage />}
        />

        {/* OrderHistory Main */}
        <Route path="orders" element={<OrderHistoryMain />} />

        {/* Order Tracking Screen*/}
        <Route
          path="order_tracking/:orderId"
          element={<OrderTrackingScreen />}
        />

        {/* Order Details */}
        <Route path="order_details/:orderId" element={<OrderDetails />} />

        {/* User Profile */}
        <Route path="profile" element={<UserProfile />} />

        <Route path="edit_profile" element={<EditProfile />} />

        <Route path="address_page" element={<AddressPage />} />

        <Route path="review_edit" element={<ReviewUserProfileEdit />} />

        <Route path="review_profile" element={<ReviewUserProfile />} />

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
