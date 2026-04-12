import React, { useEffect, useState } from "react";
import { getSignedUrl } from "../../../../../../utils/s3";
import "./UserDashboard.css";
import { useNavigate } from "react-router-dom";
import { DataStore } from "aws-amplify/datastore";
import { User } from "../../../../../../models";


function UserDashboard() {
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [profileUrls, setProfileUrls] = useState({});
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const result = await DataStore.query(User);

      const sorted = result.sort(
        (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
      );

      setUsers(sorted);
      setFilteredUsers(sorted);

      // ✅ Fetch profile images
      const urls = {};
      await Promise.all(
        sorted.map(async (u) => {
          if (!u.profilePic) return;

          const url = await getSignedUrl(u.profilePic);
          if (url) urls[u.id] = url;
        })
      );

      setProfileUrls(urls);

    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
    const sub = DataStore.observe(User).subscribe(fetchUsers);
    return () => sub.unsubscribe();
  }, []);

  const handleSearch = (query) => {
    setSearchQuery(query);

    if (!query) return setFilteredUsers(users);

    const lower = query.toLowerCase();

    const filtered = users.filter((u) =>
      [
        u.firstName,
        u.lastName,
        u.phoneNumber,
        u.email,
        u.address,
      ]
        .join(" ")
        .toLowerCase()
        .includes(lower)
    );

    setFilteredUsers(filtered);
  };

  return (
    <div className="dashboard">

      {/* HEADER */}
      <div className="dashboard-top">
        <div>
          <h1>User Management</h1>
          <p>View and manage all registered users</p>
        </div>

        <button className="refresh-btn" onClick={fetchUsers}>
          {refreshing ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      {/* SEARCH */}
      <div className="search-wrapper">
        <input
          type="text"
          placeholder="Search by name, phone, email, address..."
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
      </div>

      {/* CONTENT */}
      {loading ? (
        <div className="loading">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty">No users found</div>
      ) : (
        <div className="grid">
          {filteredUsers.map((user) => (
            <div
              key={user.id}
              className="card"
              onClick={() =>
                navigate(`/admin/user_full_profile/${user.id}`)
              }
            >

              {/* HEADER */}
              <div className="card-header">
                <div className="left">
                  <div className="avatar">
                    {profileUrls[user.id] ? (
                      <img src={profileUrls[user.id]} alt="" />
                    ) : (
                      user.firstName?.charAt(0)
                    )}
                  </div>

                  <div>
                    <h3>
                      {user.firstName} {user.lastName}
                    </h3>
                    <span className="phone">{user.phoneNumber}</span>
                  </div>
                </div>
              </div>

              {/* BODY */}
              <div className="card-body">

                <div className="row">
                  <span>Email</span>
                  <strong>{user.email || "—"}</strong>
                </div>

                <div className="row">
                  <span>Address</span>
                  <strong>{user.address || "—"}</strong>
                </div>

                <div className="row">
                  <span>Exact</span>
                  <strong>{user.exactAddress || "—"}</strong>
                </div>

              </div>

            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default UserDashboard;