import React, { useEffect, useState } from "react";
import "./AdminHome.css";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

const AdminHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });
        if (res.ok) {
          const userData = await res.json();
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUser();
  }, []);

  console.log("User in useEffect:", user); // Debugging line to check user data
  console.log("User in localStorage:", localStorage.getItem("user")); // Debugging line to check localStorage

  const handleTicketSupport = () => {
    navigate("/admin/support");
  };

  return (
    <>
      <section className="container-fluid">
        <section className="banner">
          <h1 className="banner-title">Dashboard</h1>
          <h2>Manage Your Site As an Admin</h2>
        </section>
        <section className="descriptionAdmin"></section>
        <section className="admin-analytics-section">
          <section className="admin-analytics-card">
            <h5>Total Users</h5>
            <p>1,245</p>
          </section>
          <section className="admin-analytics-card">
            <h5>Open Tickets</h5>
            <p>32</p>
          </section>
          <section className="admin-analytics-card">
            <h5>Job Listings</h5>
            <p>87</p>
          </section>
          <section className="admin-analytics-card">
            <h5>System Status</h5>
            <p className="admin-system-status">✅ Operational</p>
          </section>
        </section>

        <section className="container">
          <section className="row">
            <section className="col-4">
              <section className="card">
                <section className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-input-cursor-text"></i>View Support
                    Tickets
                  </h5>
                  <p className="card-text">
                    View and manage user support requests
                  </p>
                  <button
                    className="btn btn-outline-primary"
                    onClick={handleTicketSupport}
                  >
                    Support Tickets
                  </button>
                </section>
              </section>
            </section>

            <section className="col-4">
              <section className="card">
                <section className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-people"></i>Manage Users
                  </h5>
                  <p className="card-text">View and manage user accounts</p>
                  <button className="btn btn-outline-primary">
                    Manage Accounts
                  </button>
                </section>
              </section>
            </section>

            <section class="col-4">
              <section className="card">
                <section className="card-body">
                  <h5 className="card-title">
                    <i className="bi bi-person-workspace"></i>Manage Job
                    Listings
                  </h5>
                  <p className="card-text">View and manage job listings</p>
                  <button className="btn btn-outline-primary">
                    Manage Job Listings
                  </button>
                </section>
              </section>
            </section>
          </section>
        </section>
      </section>
      <section className="admin-bottom-section">
        <section className="admin-recent-activity">
          <h5>📝 Recent Activity</h5>
          <ul>
            <li>User JohnDoe registered</li>
            <li>Ticket #432 resolved</li>
            <li>New job listing posted</li>
          </ul>
        </section>

        <section className="admin-announcements">
          <h5>📢 Announcements</h5>
          <p>🚀 New features coming soon! Stay tuned.</p>
        </section>
      </section>
    </>
  );
};

export default AdminHome;
