import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthLogin from "./pages/AuthLogin";
import ClientHome from "./pages/ClientHome";
import RoleSelection from "./pages/RoleSelection";
import Navbar from "./components/Navbar";
import FreelancerHome from "./pages/FreelancerHome";

function App() {
  return (
    <Router>
      <Navbar /> 
      <Routes>
        <Route path="/" element={<AuthLogin />} />
        <Route path="/client/home" element={<ClientHome />} />
        <Route path="/roles" element={<RoleSelection />} />
        <Route path="/freelancer/home" element={<FreelancerHome />} />
      </Routes>
    </Router>
  );
}

export default App;
