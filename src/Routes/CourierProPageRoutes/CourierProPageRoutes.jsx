import React from "react";
import { Routes, Route } from "react-router-dom";

import GoogleMapsProvider from "../../../Providers/ClientProvider/GoogleMapsProvider";
import FleetProvider from "../../../Providers/CourierProProvider/FleetProvider";

import CourierProHome from "../../components/CourierPro/Home/CourierProHome";
import FleetRegistration from "../../components/CourierPro/Home/FleetRegistration/FleetRegistration";
import CourierProLogin from "../../components/CourierPro/Home/Auth/Login/Login";

import CourierProSignup from "../../components/CourierPro/Home/Auth/Signup/Signup";
import CourierProVerifyEmail from "../../components/CourierPro/Home/Auth/VerifyEmail/VerifyEmail";
import CourierProForgotPassword from "../../components/CourierPro/Home/Auth/ForgotPassword/ForgotPassword";
import CourierProConfirmCode from "../../components/CourierPro/Home/Auth/ConfirmCode/ConfirmCode";

import "./CourierProPageRoutes.css";

const CourierProPageRoutes = () => (
  <GoogleMapsProvider>
    <FleetProvider>
      <Routes>
        {/* Public Courier Pro homepage */}
        <Route path="/" element={<CourierProHome />} />

        {/* Courier Pro authentication */}
        {/* Courier Pro login */}
        <Route path="/login" element={<CourierProLogin />} />

        {/* Fleet registration */}
        <Route path="/register" element={<FleetRegistration />} />

        <Route path="/signup" element={<CourierProSignup />} />
        <Route path="/verify-email" element={<CourierProVerifyEmail />} />
        <Route path="/forgot-password" element={<CourierProForgotPassword />} />
        <Route path="/confirm-code" element={<CourierProConfirmCode />} />

        {/* Invalid Courier Pro routes */}
        <Route
          path="*"
          element={
            <div className="atuaCourierProRouteError404Con">
              <p>404 Not Found</p>
            </div>
          }
        />
      </Routes>
    </FleetProvider>
  </GoogleMapsProvider>
);

export default CourierProPageRoutes;
