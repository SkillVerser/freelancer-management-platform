import React, { useEffect, useState } from "react";
import { Table, Button, Badge, Alert } from "react-bootstrap";
import "./TicketSupport.css"; // link styles
import axios from "axios";
import API_URL from "../config/api";

function TicketSupport() {
  const [tickets, setTickets] = useState([]);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const res = await axios.get(`${API_URL}/users/alltickets`, {
          withCredentials: true,
        });

        console.log("Fetched tickets:", res.data);
        setTickets(res.data);
      } catch (err) {
        console.error("Error fetching tickets:", err);
        setError("Failed to fetch tickets. Please try again");
      }
    };

    fetchTickets();
  }, []);

  const handleDecision = async (ticketId, decision) => {
    try {
      //const response = await axios.post("http://localhost:5000/users/process-request", {ticketId, decision}, {withCredentials: true});
      setSuccess(
        `Request ${
          decision === "approve" ? "approved" : "rejected"
        } successfully`
      );
      setTickets(tickets.filter((ticket) => ticket._id !== ticketId));

      // Success message disappear after 3 secs
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error processing request:", err);
      setError(`Failed to ${decision} request. Please try again`);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "pending":
        return <Badge bg="warning">Pending</Badge>;
      case "approved":
        return <Badge bg="success">Approved</Badge>;
      case "rejected":
        return <Badge bg="danger">Rejected</Badge>;
      default:
        return <Badge bg="secondary">Unknown</Badge>;
    }
  };

  return (
    <main className="ticket-support-container">
      <h1 className="mb-4">Role Change Requests</h1>

      {error && (
        <Alert variant="danger" onClose={() => setError("")} dismissible>
          {error}
        </Alert>
      )}
      {success && (
        <Alert variant="success" onClose={() => setSuccess("")} dismissible>
          {success}
        </Alert>
      )}

      {tickets.length === 0 ? (
        <Alert variant="info">
          No pending role change requests at this time.
        </Alert>
      ) : (
        <Table striped bordered hover responsive className="tickets-table">
          <thead>
            <tr>
              <th>User</th>
              <th>Current Role</th>
              <th>Requested Role</th>
              <th>Reason</th>
              <th>Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tickets.map((ticket) => (
              <tr key={ticket._id}>
                <td>{ticket.user?.username || "Unknown User"}</td>
                <td className="text-capitalize">{ticket.currentRole}</td>
                <td className="text-capitalize">{ticket.requestedRole}</td>
                <td>{ticket.message || "No reason provided"}</td>
                <td>{new Date(ticket.createdAt).toLocaleDateString()}</td>
                <td>{getStatusBadge(ticket.status)}</td>
                <td className="action-buttons">
                  {ticket.status === "pending" && (
                    <>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleDecision(ticket._id, "approve")}
                        className="me-2"
                      >
                        Approve
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDecision(ticket._id, "reject")}
                      >
                        Reject
                      </Button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </main>
  );
}

export default TicketSupport;
