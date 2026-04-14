import React from "react";
import { useAuthContext } from "../../../../../Providers/ClientProvider/AuthProvider";
import ProfileLoading from "./ProfileLoading";
import EditProfile from "./EditProfile/EditProfile";
import MainProfile from "./MainProfile/MainProfile";
import "./Profile.css"

function Profile() {
  const { authUser, dbUser, loadingUser } = useAuthContext();

  if (loadingUser) {
    return (
      <div className="profileParent-container">
        <ProfileLoading/>
      </div>
    );
  }

  // 🔥 NOT LOGGED IN
  if (!authUser) {
    return (
      <div className="profileParent-container">
        <MainProfile/>
      </div>
    ); // we will handle empty state inside
  }

  // 🔥 LOGGED IN BUT NO DB USER YET
  if (!dbUser) {
    return (
      <div className="profileParent-container">
        <EditProfile/>
      </div>
    );
  }

  // 🔥 FULL PROFILE
  return (
    <div className="profileParent-container">
      <MainProfile/>
    </div>
  );
}

export default Profile;