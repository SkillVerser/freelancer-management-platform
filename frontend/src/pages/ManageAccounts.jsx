import React, { useEffect, useState } from "react";
import API_URL from "../config/api";
import { Modal, Button } from "react-bootstrap";
import "./ManageAccounts.css";
const ManageAccounts = () => {
  const [users, setUsers] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
//this use effect will fettch every user in the users collection
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${API_URL}/api/users`);
        const data = await res.json();
        if (res.ok) {
          const filteredUsers = data.filter((user) => user.role !== "admin"); //dont show me other admins in this list
          setUsers(filteredUsers); //show all users except admins
        } else {
          console.error("Failed to fetch users");
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };

    fetchUsers();
  }, []);

  //function to delete a user
  const deleteUser = async (userId) => {
    try {
      const res = await fetch(`${API_URL}/api/users/${userId}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        // Successfully deleted, update the users state
        setUsers(users.filter((user) => user._id !== userId));
        alert("User deleted successfully.");
      } else {
        // If not successful, get the error message
        const data = await res.json();
        alert(data.message || "Failed to delete user.");
      }
    } catch (err) {
      console.error(err);
      alert("Error deleting user.");
    }
  };

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <section className="container mt-4">
      <h2>Manage User Accounts</h2>
      <table className="table table-bordered mt-3">
        <thead>
          <link
            href="https://cdn.jsdelivr.net/npm/bootstrap-icons/font/bootstrap-icons.css"
            rel="stylesheet"
            link
          />

          <tr>
            <th>Username</th>
            <th>Role</th>
            <th>User ID</th>
            <th>Account Created</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {users.length === 0 ? (
            <tr>
              <td colSpan="4">No users found.</td>
            </tr>
          ) : (
            users.map((user) => (
              <tr key={user._id}>
                <td>{user.username}</td>
                <td>{user.role}</td>
                <td>{user._id}</td>
                <td>{formatDate(user.createdAt)}</td>
                <td>
                  <button
                    className="deleteicn"
                    onClick={() => {
                      setUserToDelete(user);
                      setShowDeleteModal(true);
                    }}
                  >
                    <i className="bi bi-trash"></i> {/* Trash bin icon */}Delete
                  </button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* Delete Confirmation Modal */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Deletion</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to delete the account of{" "}
          <strong>{userToDelete ? userToDelete.username : ""}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="noButton"
            variant="secondary"
            onClick={() => setShowDeleteModal(false)}
          >
            No
          </Button>
          <Button
            className="yesButton"
            variant="danger"
            onClick={() => {
              if (userToDelete) {
                deleteUser(userToDelete._id);
              }
              setShowDeleteModal(false); 
            }}
          >
            Yes, Delete
          </Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default ManageAccounts;
