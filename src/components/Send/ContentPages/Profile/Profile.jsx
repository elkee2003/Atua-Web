import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthContext } from "../../../../../Providers/ClientProvider/AuthProvider";
import ProfileLoading from "./ProfileLoading";
import MainProfile from "./MainProfile/MainProfile";
import "./Profile.css";

function Profile() {
  const { authUser, dbUser, loadingUser } = useAuthContext();
  const navigate = useNavigate();

  const [initialCheckComplete, setInitialCheckComplete] = useState(false);
  const redirectHandled = useRef(false);

  // Allow the provider's initial authentication check to run.
  useEffect(() => {
    const timer = setTimeout(() => {
      setInitialCheckComplete(true);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!initialCheckComplete || redirectHandled.current) return;

    // Still checking authentication or loading the database profile.
    if (loadingUser) return;

    // User is not signed in.
    if (!authUser) {
      redirectHandled.current = true;

      alert("Kindly sign in to continue.");

      navigate("/", {
        replace: true,
        state: { scrollTo: "signIn" },
      });

      return;
    }

    // User is signed in, but the database profile is still loading.
    if (dbUser === null || dbUser === undefined) {
      // Wait for the provider to finish loading the profile.
      return;
    }
  }, [authUser, dbUser, loadingUser, initialCheckComplete, navigate]);

  // Show shimmer only during the initial check.
  if (!initialCheckComplete || loadingUser) {
    return (
      <div className="profileParent-container">
        <ProfileLoading />
      </div>
    );
  }

  // Signed-out user: redirect is handled by the effect.
  if (!authUser) {
    return null;
  }

  // Signed-in user without a database profile.
  if (!dbUser) {
    if (!redirectHandled.current) {
      redirectHandled.current = true;

      alert("Kindly complete your profile before continuing.");

      navigate("/send/edit_profile", {
        replace: true,
      });
    }

    return null;
  }

  // Signed-in user with a completed profile.
  return (
    <div className="profileParent-container">
      <MainProfile />
    </div>
  );
}

export default Profile;
