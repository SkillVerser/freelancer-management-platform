import React, { useEffect, useState } from "react";
import "./JobApplications.css"; // Importing CSS style file
//import { Card, Button, Badge } from "react-bootstrap";
//import { FaStar, FaMapMarkerAlt, FaEnvelope } from "react-icons/fa";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
import { Modal, Button } from "react-bootstrap";

const ViewFreelancers = () => {
  const { jobId } = useParams(); // Get the jobId from the URL parameters
  console.log("Job ID:", jobId); // Log the jobId for debugging
  const [applications, setApplications] = useState([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [pendingApplicationId, setPendingApplicationId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchApplications = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/api/applications/jobs/${jobId}`
        );
        setApplications(response.data);
        console.log("Applications:", response.data);
      } catch (error) {
        console.error("Error fetching applications:", error);
      }
    };

    fetchApplications();
  }, [jobId]);
  const handleShowConfirm = (applicationId) => {
    setPendingApplicationId(applicationId);
    setShowConfirmModal(true);
  };
const handleAcceptConfirmed = async () => {
  try {
    await axios.post(
      `${API_URL}/api/applications/jobs/accept/${pendingApplicationId}`,
      {},
      { withCredentials: true }
    );
    setShowConfirmModal(false);
    setShowSuccessModal(true); // Show success modal
  } catch (error) {
    console.error("Error accepting application:", error);
    alert("Error accepting application");
  }
};



  return (

<main className="available-jobs-main-jobRequest">
  <Navbar />
      <h2 className="available-jobs-title-jobRequest">Applications for this Job</h2>

      {applications.length === 0 ? (
        <p style={{ textAlign: "center", fontSize: "1.2rem" }}>
          No applications yet. Come back later!
        </p>
      ) : (
        <>
          <section className="applications-summary">
            <h3>Total Applications: {applications.length}</h3>
          </section>

          <section className="available-jobs-section-jobRequest">
            {applications.map((application) => (
              <article key={application._id} className="available-job-card-jobRequest">
                <p>
                  <strong>Freelancer:</strong>{" "}
                  {application.freelancerId?.username || "Unknown"}
                </p>
                <p>
                  <strong>Price:</strong> R{application.price}
                </p>

                <button
                  className="available-job-apply-button-jobRequest"
                  onClick={() => handleShowConfirm(application._id)}
                >
                  Accept Application
                </button>
              </article>
            ))}
          </section>
        </>
      )}
      <Modal show={showSuccessModal} onHide={() => setShowSuccessModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Application Accepted</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          The freelancer has been successfully hired for this job.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => {
              setShowSuccessModal(false);
              navigate("/client/home");
            }}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>


      {/* Modal */}
      <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Acceptance</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to <strong>accept this application</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            className="noButton"
            onClick={() => setShowConfirmModal(false)}
          >
            No
          </Button>
          <Button
            variant="primary"
            className="yesButton"
            onClick={handleAcceptConfirmed}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
      <Footer />
    </main>

);

};

export default ViewFreelancers;
