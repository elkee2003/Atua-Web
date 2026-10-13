import { StrictMode } from "react";
import { createRoot } from "react-dom/client";

import "./index.css";

import App from "./App.jsx";

import { Amplify } from "aws-amplify";
import { AuthModeStrategyType, DataStore } from "@aws-amplify/datastore";

import amplifyconfig from "./amplifyconfiguration.json";

import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

//-----------------------------------------
// Amplify Configuration
//-----------------------------------------

Amplify.configure(amplifyconfig);

//-----------------------------------------
// DataStore Multi-Auth Configuration
//-----------------------------------------

DataStore.configure({
  authModeStrategyType: AuthModeStrategyType.MULTI_AUTH,
});

//-----------------------------------------
// Render Application
//-----------------------------------------

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <App />

    <ToastContainer position="top-right" autoClose={4000} />
  </StrictMode>,
);
