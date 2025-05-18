import React, { useState, useEffect } from "react";
import "./FreelancerHome.css";
import Navbar from "../components/Navbar";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

const FreelancerHome = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [visibleAnswer, setVisibleAnswer] = useState(null); // State to track which answer is visible
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [loading, setLoading] = useState(true);

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
          console.log("User data:", userData);

          // After fetching user, fetch their accepted jobs
          if (userData && userData._id) {
            fetchAcceptedJobs(userData._id);
          }
        } else {
          console.error("Failed to fetch user info");
          setLoading(false);
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
        setLoading(false);
      }
    };

    fetchUser();
  }, []);
  console.log("User:", user);

  const fetchAcceptedJobs = async (freelancerId) => {
    try {
      const res = await fetch(
        `${API_URL}/api/service-requests/freelancer/jobs/${freelancerId}`,
        {
          credentials: "include",
        }
      );

      if (res.ok) {
        const jobsData = await res.json();
        setAcceptedJobs(jobsData);
        console.log("Accepted jobs:", jobsData);
      } else {
        console.error("Failed to fetch accepted jobs");
      }
    } catch (err) {
      console.error("Error fetching accepted jobs:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionClick = (index) => {
    setVisibleAnswer(visibleAnswer === index ? null : index); //toggle visibility of answer
  };

  const handleProjectClick = (jobId) => {
    navigate(`/freelancer/job/${jobId}`);
  };

  return (
    <main className="freelancer-home">
      <Navbar />
      <section className="welcome">
        <h1 className="heading">SkillVerse</h1>
        <p className="welcome-freelancer">
          One platform to find new clients, efficiently manage your projects and
          handle payments
        </p>
      </section>

      <h2 className="how">How it works</h2>
      <section className="worklist">
        <h3 className="howbox">Create an assignment</h3>
        <h3 className="howbox"> Deliver great work</h3>
        <h3 className="howbox"> Get paid</h3>
      </section>

      <h2 className="servheading">Popular Services</h2>
      <section className="services">
        <h3 className="servbox">Software Development</h3>
        <h3 className="servbox">Data Science</h3>
        <h3 className="servbox">Creating Logos</h3>
        <h3 className="servbox">Graphic Design</h3>
        <h3 className="servbox">Digital Marketing</h3>
      </section>

      <section>
        <button
          className="findjobbutton"
          onClick={() => navigate("/freelancer/jobs")}
        >
          Find Jobs
        </button>
      </section>

      <h2 className="Qs">FAQ's</h2>
      <section className="questions">
        <section className="faq1">
          <button className="Qbutton1" onClick={() => handleQuestionClick(1)}>
            What can I sell?
          </button>
          {visibleAnswer === 1 && (
            <p className="answer1">
              You may sell any service that you are good at or qualified in,
              such as graphic design, programming, writing etc.
            </p>
          )}
        </section>

        <section className="faq2">
          <button className="Qbutton2" onClick={() => handleQuestionClick(2)}>
            How much money can I make?
          </button>
          {visibleAnswer === 2 && (
            <p className="answer2">
              Depends on the services you offer and the demand for those
              services.
            </p>
          )}
        </section>

        <section className="faq3">
          <button className="Qbutton3" onClick={() => handleQuestionClick(3)}>
            How do payments work?
          </button>
          {visibleAnswer === 3 && (
            <p className="answer3">
              Payments are processed through our secure platform.
            </p>
          )}
        </section>
        <section className="faq4">
          <button className="Qbutton4" onClick={() => handleQuestionClick(4)}>
            Can I set my own rates?
          </button>
          {visibleAnswer === 4 && (
            <p className="answer4">Yes, based on your skills and experience.</p>
          )}
        </section>
      </section>

      <section className="projects">
        <h2 className="projectheading">Your Projects</h2>
      </section>
      <section className="projectlist">
        {loading ? (
          <p className="loading">Loading your projects...</p>
        ) : acceptedJobs.length > 0 ? (
          acceptedJobs.map((job) => (
            <article
              key={job._id}
              className="projectbox"
              onClick={() => handleProjectClick(job._id)}
            >
              <h3>{job.serviceType}</h3>
              <p>
                <span>Client:</span>
                <span>{job.clientId?.username || "Unknown"}</span>
              </p>
              <p>
                <span>Price: R</span>
                <span>{job.price}</span>
              </p>
              <p>
                <span>Status:</span>
                <span className={`status-${job.status?.toLowerCase()}`}>
                  {job.status}
                </span>
              </p>
            </article>
          ))
        ) : (
          <p>No active projects found. Try applying to new jobs!</p>
        )}
      </section>
      <footer className="footer">
        <p>© 2025 SkillVerse. All rights reserved. </p>
      </footer>
    </main>
  );
};

export default FreelancerHome;
