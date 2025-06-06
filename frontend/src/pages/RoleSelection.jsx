import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./RoleSelection.css";
import API_URL from "../config/api";

const RoleSelection = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          localStorage.setItem("user", JSON.stringify(data));
          console.log("User saved to localStorage:", data);
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (err) {
        console.error("Error fetching user:", err);
      }
    };

    fetchUser();
  }, []);

  const selectRole = async (role) => {
    try {
      const res = await fetch(`${API_URL}/users/set-role`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ role }),
      });

      if (res.ok) {
        const userRes = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",
        });

        if (userRes.ok) {
          const userData = await userRes.json();
          localStorage.setItem("user", JSON.stringify(userData));

          // Navigate to correct dashboard
          /*if (role === "client") navigate("/client/home");
          else if (role === "freelancer") navigate("/create-profile");*/
          navigate("/create-profile");
        } else {
          console.error("Failed to fetch user data");
        }
      } else {
        console.error("Failed to set role");
      }
    } catch (err) {
      console.error("Error setting role:", err);
    }
  };

  return (
    <main className="role-selection">
      <section className="role-body">
        <p>
          Welcome to <em>SkillVerse</em>! We're excited to have you on board
        </p>
        <h1>Choose Account Type</h1>
        <section className="roles-container">
          <section
            className="client-description"
            onClick={() => selectRole("client")}
          >
            <h2>Client</h2>
            <p>Find your dream freelancer — fast, easy, and Wi-Fi ready</p>
          </section>
          <section
            className="freelancer-description"
            onClick={() => selectRole("freelancer")}
          >
            <h2>Freelancer</h2>
            <p>Join the marketplace that gets you paid and praised</p>
          </section>
        </section>
      </section>
    </main>
  );
};

export default RoleSelection;
