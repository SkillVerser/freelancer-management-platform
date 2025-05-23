//App.js

import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthLogin from "./pages/AuthLogin";
import ClientHome from "./pages/ClientHome";
import RoleSelection from "./pages/RoleSelection";
import JobRequests from "./pages/JobRequests";
import FreelancerHome from "./pages/FreelancerHome";
import FreelancerProfile from "./pages/FreelancerProfile";
import CreateProfile from "./pages/CreateProfile";
import TicketSupport from "./pages/TicketSupport";
import AdminHome from "./pages/AdminHome";
import JobApplications from "./pages/JobApplications";
import ManageAccounts from "./pages/ManageAccounts";
import ManageJobs from "./pages/ManageJobs";
import FreelancerJobDetails from "./pages/FreelancerJobDetails";
import ClientJobDetails from "./pages/ClientJobDetails";
import "bootstrap/dist/css/bootstrap.min.css";

function App() {
  const user = JSON.parse(localStorage.getItem("user")); // Retrieve user data from localStorage
  const [role, setRole] = useState(""); // Store the selected role

  return (
    <Router>
      <Routes>
        {/* Authentication/Login Page */}
        <Route path="/" element={<AuthLogin />} />
        {/* Client Home Page */}
        <Route path="/client/home" element={<ClientHome user={user} />} />
        {/* Freelancer Home Page */}
        <Route
          path="/freelancer/home"
          element={<FreelancerHome user={user} />}
        />
        {/*route for admin home page */}
        <Route path="/admin/home" element={<AdminHome />} />
        {/* route for role selection */}
        <Route path="/roles" element={<RoleSelection setRole={setRole} />} />
        {/* this is the page for job requests from clients */}
        <Route path="/freelancer/jobs" element={<JobRequests />} />
        {/* page that lets uu create a profile after logging in */}
        <Route path="/create-profile" element={<CreateProfile role={role} />} />
        {/* profile page for a freelancer */}
        <Route path="/profile" element={<FreelancerProfile />} />
        {/* ticket support page for admins */}
        <Route path="/admin/support" element={<TicketSupport />} />
        <Route
          path="/applications/:jobId"
          element={<JobApplications user={user} />}
        />
        <Route path="/myjobs/:jobId" element={<ClientJobDetails />} />
        <Route
          path="/freelancer/job/:jobId"
          element={<FreelancerJobDetails />}
        />
        {/* route to show all user accounts on admin dashboard */}
        <Route path="/admin/manage-accounts" element={<ManageAccounts />} />
        <Route path="/admin/manage-jobs" element={<ManageJobs />} />
      </Routes>
    </Router>
  );
}

export default App;
