import React, { useState } from "react";
import Dropdown from "react-bootstrap/Dropdown";
import { Modal, Button, Form } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";
import "./Navbar.css";

const Navbar = () => {
  const [showModal, setShowModal] = useState(false);
  const [requestedRole, setRequestedRole] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState(null);

  const navigate = useNavigate();

  // Go to profile page
  const showProfile = () => {
    console.log("Showing profile...");
    navigate("/profile");
  };

  // Go to home page
  const showHomePage = () => {
    console.log("Showing home page...");
    const user = JSON.parse(localStorage.getItem("user"));
    if (user && user.role === "freelancer") {
      navigate("/freelancer/home");
    } else if (user && user.role === "client") {
      navigate("/client/home");
    } else {
      navigate("/");
    }
  };

  // Open modal
  const handleShowModal = () => setShowModal(true);

  // Close modal
  const handleCloseModal = () => setShowModal(false);

  // Logout handler
  const handleLogout = async () => {
    try {
      console.log("Logging out...");

      const res = await fetch(`${API_URL}/auth/logout`, {
        method: "GET",
        credentials: "include",
      });

      if (res.ok) {
        console.log("Logout successful");
        navigate("/");
      } else {
        console.error("Logout failed:", res.status);
      }
    } catch (error) {
      console.error("Error during logout:", error);
    }
  };

  // Handle role change form submission
  const handleSubmitReason = async (e) => {
    console.log("Reason for changing roles:", message);
    e.preventDefault();

    const payload = {
      requestedRole,
      message,
    };

    try {
      const response = await fetch(`${API_URL}/users/request-role-change`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        setStatus("success");
        console.log(status);
        setRequestedRole("");
        setMessage("");
      } else {
        setStatus("error");
      }
    } catch (err) {
      console.error("Submission error:", err);
      setStatus("error");
    }

    handleCloseModal();
  };

  return (
    <nav className="bg-slate-800 text-white px-8 py-4">
      <div className="navbar-flex">
        {/* Left side: Home and Profile buttons */}
        <div className="navbar-left">
          <Button className="ms-3 navbar-btn" onClick={showHomePage}>
            <i className="bi bi-house-door-fill me-2"></i>
            Home
          </Button>
          <Button className="ms-3 navbar-btn" onClick={showProfile}>
            <i className="bi bi-person-circle me-2"></i>
            My Profile
          </Button>
        </div>
        {/* Right side: Settings Dropdown */}
        <div className="navbar-right">
          <Dropdown align="end">
            <Dropdown.Toggle
              className="text-white navbar-btn"
              id="settings-dropdown"
            >
              <i className="bi bi-gear-fill"></i>
              Settings
            </Dropdown.Toggle>
            <Dropdown.Menu>
              <Dropdown.Item onClick={handleShowModal}>
                Change Roles
              </Dropdown.Item>
              <Dropdown.Item onClick={handleLogout}>Logout</Dropdown.Item>
            </Dropdown.Menu>
          </Dropdown>
        </div>
      </div>
      {/* Modal for asking reason for changing roles */}
      <Modal show={showModal} onHide={handleCloseModal}>
        <Modal.Header closeButton>
          <Modal.Title>Change Roles</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Form.Group controlId="formReason">
              <Form.Label>Why do you want to change roles?</Form.Label>
              <Form.Control
                as="textarea"
                rows={3}
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  setRequestedRole("freelancer");
                }}
                placeholder="Enter your reason here..."
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseModal}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleSubmitReason}>
            Submit
          </Button>
        </Modal.Footer>
      </Modal>
    </nav>
  );
};

export default Navbar;
