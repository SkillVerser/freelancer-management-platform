import React, { useEffect, useState } from "react";
import { Modal, Button, Form } from "react-bootstrap";
import "./JobRequests.css";
import API_URL from "../config/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";  

function JobRequests() {
  const [jobs, setJobs] = useState([]);
  const [error, setError] = useState("");
  const [selectedJob, setSelectedJob] = useState(null);
  const [coverLetter, setCoverLetter] = useState("");
  const [applicationError, setApplicationError] = useState("");
  const [applicationSuccess, setApplicationSuccess] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [freelancer, setFreelancer] = useState(null); //freelancer state
  const [fee, setFee] = useState(""); //price state

  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      setFreelancer(JSON.parse(storedUser));
    }

    const fetchJobs = async () => {
      try {
        const res = await fetch(`${API_URL}/api/service-requests/all`, {
          credentials: "include",
        });

        if (res.ok) {
          const data = await res.json();
          setJobs(data);
        } else {
          setError("Failed to fetch jobs");
        }
      } catch (err) {
        console.error("Error fetching jobs:", err);
        setError("An error occurred while fetching jobs");
      }
    };

    fetchJobs();
  }, []);

  const handleJobSelection = (job) => {
    setSelectedJob(job);
    setCoverLetter("");
    setApplicationError("");
    setApplicationSuccess(false);
    setShowModal(true);
  };

  const handleApply = async (event) => {
    event.preventDefault();

    if (!coverLetter) {
      setApplicationError("Please provide a cover letter.");
      return;
    }

    if (!freelancer || !freelancer._id) {
      setApplicationError("Freelancer not logged in.");
      return;
    }

    try {
      const res = await fetch(`${API_URL}/api/service-requests/applications`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          jobId: selectedJob._id,
          freelancerId: freelancer._id, // use the logged-in freelancer ID
          coverLetter: coverLetter,
          price: fee,
        }),
      });

      if (res.ok) {
        setApplicationSuccess(true);
        setApplicationError("");
        setShowModal(false);
        setShowResultModal(true);
      } else {
        const data = await res.json();
        setApplicationError(data.message || "An error occurred while applying");
        setApplicationSuccess(false);
        setShowResultModal(true);
      }
    } catch (err) {
      console.error("Error applying for job:", err);
      setApplicationError(
        "An error occurred while submitting your application"
      );
      setApplicationSuccess(false);
      setShowResultModal(true);
    }
  };

  return (
    <main className="available-jobs-main-jobRequest">
      <Navbar />
      <h1 className="available-jobs-title-jobRequest">Available Jobs</h1>
      {error && <p>{error}</p>}

      {jobs.length === 0 ? (
        <p>No available jobs at the moment.</p>
      ) : (
        <section className="available-jobs-section-jobRequest">
          {jobs.map((job) => (
            <article key={job._id} className="available-job-card-jobRequest">
              <strong>Service Type:</strong> {job.serviceType} <br />
              <strong>Client:</strong> {job.clientId?.username || "N/A"} <br />
              <button
                className="available-job-apply-button-jobRequest"
                onClick={() => handleJobSelection(job)}
              >
                Apply
              </button>
            </article>
          ))}
        </section>
      )}

      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Apply for: {selectedJob?.serviceType}</Modal.Title>
        </Modal.Header>

        <Modal.Body>
          <Form onSubmit={handleApply}>
            <Form.Group controlId="formCoverLetter">
              <Form.Label>Reason for applying:</Form.Label>
              <Form.Control
                as="textarea"
                rows={4}
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="State your reason here..."
              />
            </Form.Group>

            <Form.Group controlId="formFee" style={{ marginTop: "1rem" }}>
              <Form.Label>Proposed Fee (in Rands)</Form.Label>
              <Form.Control
                type="number"
                value={fee}
                onChange={(e) => setFee(e.target.value)}
                placeholder="Enter your fee..."
                min="0"
              />
            </Form.Group>

            {applicationError && (
              <article style={{ color: "red", marginTop: "1rem" }}>
                {applicationError}
              </article>
            )}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleApply}>
            Submit Application
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal show={showResultModal} onHide={() => setShowResultModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Application Status</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {applicationSuccess ? (
            <p style={{ color: "green" }}>
              Your application was submitted successfully!
            </p>
          ) : (
            <p style={{ color: "red" }}>
              Your application could not be submitted. Please try again.
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowResultModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Footer />
    </main>
  );
}

export default JobRequests;
