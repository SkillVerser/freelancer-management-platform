import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { BsArrowRight, BsBriefcase } from "react-icons/bs";
import "./FreelancerHome.css";
import API_URL from "../config/api";

const user = JSON.parse(localStorage.getItem("user"));
console.log(user);

const FreelancerHome = () => {
  const [visibleAnswer, setVisibleAnswer] = useState(null);

  const navigate = useNavigate();
  const [acceptedJobs, setAcceptedJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const handleProjectClick = (id) => {
    navigate(`/freelancer/job/${id}`);
  };
  const handleQuestionClick = (num) =>
    setVisibleAnswer(num === visibleAnswer ? null : num);

  useEffect(() => {//this use effect is to fetch user data
    const fetchUser = async () => {
      try {
        const res = await fetch(`${API_URL}/auth/me`, {
          credentials: "include",//this essentailly includes everything from the model
        });
        if (res.ok) {
          const userData = await res.json();
          localStorage.setItem("user", JSON.stringify(userData));
          setUser(userData);
          console.log("User data:", userData);

          //after fetching user, fetch their accepted jobs
          if (userData && userData._id) {
            fetchAcceptedJobs(userData._id);//if user isnt null fetch info
          }
        } else {
          console.error("Failed to fetch user info");//couldnt fetch (probably null)
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
//this is to fetch any jobs that are assigned to the freelancer
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
        console.error("Failed to fetch accepted jobs");//this will fail if field is null
      }
    } catch (err) {
      console.error("Error fetching accepted jobs:", err);
    } finally {
      setLoading(false);
    }
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
        <section className="howbox-flip">
          <section className="howbox-inner">
            <section className="howbox howbox-front">Find a project</section>
            <section className="howbox howbox-back">
              Accepting a project means you're ready to take it on. Make sure it
              matches your skills, then start working and deliver great results.
            </section>
          </section>
        </section>
        <BsArrowRight className="how-arrow" aria-hidden="true" />
        <section className="howbox-flip">
          <section className="howbox-inner">
            <section className="howbox howbox-front">
              Deliver great work
            </section>
            <section className="howbox howbox-back">
              Once you’ve completed the project, submit your work on time and
              ensure it meets the client’s expectations. High-quality work leads
              to positive reviews and more opportunities.
            </section>
          </section>
        </section>
        <BsArrowRight className="how-arrow" aria-hidden="true" />
        <section className="howbox-flip">
          <section className="howbox-inner">
            <section className="howbox howbox-front">Get paid</section>
            <section className="howbox howbox-back">
              After the client approves your work, payment is released to your
              account. Quick, reliable delivery helps build trust and keeps the
              earnings coming.
            </section>
          </section>
        </section>
      </section>

      <h2 className="servheading">Popular Services</h2>
      <section className="services">
        <section className="servbox-flip">
          <section className="servbox-inner">
            <section className="servbox servbox-front">
              Software Development
            </section>
            <section className="servbox servbox-back">
              Build web, mobile, or desktop applications for clients using
              modern technologies.
            </section>
          </section>
        </section>
        <section className="servbox-flip">
          <section className="servbox-inner">
            <section className="servbox servbox-front">Data Science</section>
            <section className="servbox servbox-back">
              Analyze data, build models, and provide insights to help clients
              make data-driven decisions.
            </section>
          </section>
        </section>
        <section className="servbox-flip">
          <section className="servbox-inner">
            <section className="servbox servbox-front">Creating Logos</section>
            <section className="servbox servbox-back">
              Design unique and memorable logos to help brands stand out.
            </section>
          </section>
        </section>
        <section className="servbox-flip">
          <section className="servbox-inner">
            <section className="servbox servbox-front">Graphic Design</section>
            <section className="servbox servbox-back">
              Create stunning graphics for web, print, and social media
              campaigns.
            </section>
          </section>
        </section>
        <section className="servbox-flip">
          <section className="servbox-inner">
            <section className="servbox servbox-front">
              Digital Marketing
            </section>
            <section className="servbox servbox-back">
              Promote brands and products through SEO, social media, and online
              ads.
            </section>
          </section>
        </section>
      </section>

      <section className="findjob-section">
        <h2 className="findjob-heading">Ready to find your next project?</h2>
        <button
          className="findjobbutton"
          onClick={() => navigate("/freelancer/jobs")}
        >
          <BsBriefcase className="job-icon" />
          Browse Projects
        </button>
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

      <Footer />
    </main>
  );
};

export default FreelancerHome;
