import React, { useEffect, useState } from "react";
import { getSignedUrl } from "../../../../../../../utils/s3";
import { useParams, useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { User } from "../../../../../../../models";
import "./UserFullProfile.css";

function UserFullProfile() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [profileUrl, setProfileUrl] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const result = await DataStore.query(User, id);
      setUser(result);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUser();
  }, [id]);

  // ✅ fetch profile image
  useEffect(() => {
    if (!user?.profilePic) return;

    const loadImage = async () => {
      try {
        const url = await getSignedUrl(user.profilePic);
        setProfileUrl(url);
      } catch (err) {
        console.log(err);
      }
    };

    loadImage();
  }, [user]);

  if (loading) return <div className="loading">Loading...</div>;
  if (!user) return <div className="empty">User not found</div>;

  return (
    <div className="page">

      {/* TOP BAR */}
      <div className="topbar">
        <button onClick={() => navigate(-1)}>← Back</button>
      </div>

      {/* HERO */}
      <div className="hero">
        <div className="hero-left">

          <div className="avatar-lg">
            {profileUrl ? (
              <img src={profileUrl} alt="" />
            ) : (
              user.firstName?.charAt(0)
            )}
          </div>

          <div>
            <h1>{user.firstName} {user.lastName}</h1>
            <p>{user.phoneNumber}</p>
            <p>{user.email}</p>
          </div>

        </div>
      </div>

      {/* GRID */}
      <div className="grid">

        <div className="card">
          <h3>Basic Info</h3>
          <p><strong>First Name:</strong> {user.firstName}</p>
          <p><strong>Last Name:</strong> {user.lastName}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Phone:</strong> {user.phoneNumber}</p>
        </div>

        <div className="card">
          <h3>Address</h3>
          <p><strong>Address:</strong> {user.address}</p>
          <p><strong>Exact:</strong> {user.exactAddress}</p>
        </div>

        <div className="card">
          <h3>Account Info</h3>
          <p><strong>User ID:</strong> {user.id}</p>
          <p><strong>Sub:</strong> {user.sub}</p>
        </div>

      </div>
    </div>
  );
}

export default UserFullProfile;