import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import FileUpload from "../components/FileUpload";
import FileList from "../components/FileList";
import API_URL from "../config/api";
import "./FreelancerJobDetails.css";

const FreelancerJobDetails = () => {
  const { jobId } = useParams();
  const [job, setJob] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [fileListKey, setFileListKey] = useState(0);

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        // Fetch job details using the job id assigned
        const jobRes = await fetch(
          `${API_URL}/api/service-requests/job/${jobId}`,
          {
            credentials: "include",
          }
        );

        if (!jobRes.ok) {
          throw new Error("Failed to fetch job details");
        }

        const jobData = await jobRes.json();
        setJob(jobData);

        // Fetch milestones for this job
        const milestonesRes = await fetch(
          `${API_URL}/api/milestones/job/${jobId}`,
          {
            credentials: "include",
          }
        );

        if (!milestonesRes.ok) {
          throw new Error("Failed to fetch milestones");
        }

        const milestonesData = await milestonesRes.json();
        setMilestones(milestonesData);
      } catch (err) {
        console.error("Error fetching job details:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchJobDetails();
  }, [jobId]);

  const formatDate = (dateString) => {
    const options = { year: "numeric", month: "long", day: "numeric" };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  const handleMilestoneComplete = async (milestoneId) => {
    try {
      const res = await fetch(
        `${API_URL}/api/milestones/complete/${milestoneId}`,
        {
          method: "PUT",
          credentials: "include",
        }
      );

      if (!res.ok) {
        throw new Error("Failed to update milestone status");
      }

      // Update the milestone status in the local state
      setMilestones(
        milestones.map((milestone) =>
          milestone._id === milestoneId
            ? { ...milestone, status: "Completed" }
            : milestone
        )
      );
    } catch (err) {
      console.error("Error updating milestone:", err);
      alert("Failed to update milestone status. Please try again.");
    }
  };

  // successful file upload
  const handleUploadSuccess = () => {
    //refresh file list
    setFileListKey((prevKey) => prevKey + 1);
  };

  if (loading) {
    return (
      <main className="freelancer-job-details">
        <Navbar />
        <section className="loading-container">
          <p>Loading job details...</p>
        </section>
        <Footer />
      </main>
    );
  }

  if (error) {
    return (
      <main className="freelancer-job-details">
        <Navbar />
        <section className="error-container">
          <h2>Error</h2>
          <p>{error}</p>
          <Link to="/freelancer/home" className="back-button">
            Back to Home
          </Link>
        </section>
        <Footer />
      </main>
    );
  }

  return (
    <main className="freelancer-job-details">
      <Navbar />
      <section className="job-details-container">
        <Link to="/freelancer/home" className="back-button">
          &larr; Back to Home
        </Link>

        <article className="job-header">
          <h1>{job.serviceType}</h1>
          <span
            className={`status-badge ${job.status
              .toLowerCase()
              .replace(/\s+/g, "-")}`}
          >
            {job.status}
          </span>
        </article>

        {/* Milestones Section */}
        <section className="job-info">
          <article className="job-info-card">
            <h2>Project Details</h2>
            <p>
              <strong>Client:</strong> {job.clientId?.username || "Unknown"}
            </p>
            <p>
              <strong>Total Due:</strong> {"R" + job.price}
            </p>
            <p>
              <strong>Amount Received:</strong> {"R" + job.paymentsMade}
            </p>
            <p>
              <strong>Amount Pending:</strong> {"R" + job.paymentsPending}
            </p>
            <p>
              <strong>Created On:</strong> {formatDate(job.createdAt)}
            </p>
          </article>

          <article className="milestones-card">
            <h2>Project Milestones</h2>
            {milestones.length > 0 ? (
              <ul className="milestones-list">
                {milestones.map((milestone) => (
                  <li
                    key={milestone._id}
                    className={`milestone-item ${milestone.status.toLowerCase()}`}
                  >
                    <h3>{milestone.description}</h3>
                    <p>
                      <strong>Due Date:</strong> {formatDate(milestone.dueDate)}
                    </p>
                    <p>
                      <strong>Status:</strong> {milestone.status}
                    </p>
                    {milestone.status === "Pending" && (
                      <button
                        className="complete-milestone-button"
                        onClick={() => handleMilestoneComplete(milestone._id)}
                      >
                        Mark as Completed
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            ) : (
              <p>No milestones have been set for this project yet.</p>
            )}
          </article>
        </section>

        {/* File Upload Section */}
        <section className="files-section">
          <FileUpload jobId={jobId} onUploadSuccess={handleUploadSuccess} />

          <FileList key={fileListKey} jobId={jobId} userRole="freelancer" />
        </section>
      </section>
      <Footer />
    </main>
  );
};

export default FreelancerJobDetails;
