import React, { useEffect, useState } from "react";
import "./ClientHome.css";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import axios from "axios";
import { Modal, Button } from "react-bootstrap";
import { useNavigate } from "react-router-dom";
import API_URL from "../config/api";

const ClientHome = () => {
  const [showModal, setShowModal] = useState(false); //this is for req submitted successfully(popup)
  const [showConfirmModal, setShowConfirmModal] = useState(false); //this brings up the yes no pop up, on yes sends req
  const [pendingCategory, setPendingCategory] = useState(null); //save the req on button click but dont send it yet
  const [showMilestoneSuccessModal, setShowMilestoneSuccessModal] = useState(false);
  const [user, setUser] = useState(null);
  const [jobs, setJobs] = useState([]); //this is
  // for the jobs that are fetched from the backend
  const [message /*setMessage*/] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  //state variables for milestones
  const [showMilestonesModal, setShowMilestonesModal] = useState(false);
  const [selectedJobForMilestones, setSelectedJobForMilestones] =
    useState(null);
  const [milestones, setMilestones] = useState([
    { description: "", dueDate: "" },
  ]);

  const navigate = useNavigate();

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
        } else {
          console.error("Failed to fetch user info");
        }
      } catch (err) {
        console.error("Error fetching user info:", err);
      }
    };

    fetchUser();
  }, []);

  const userId = user ? user._id : null;

  useEffect(() => {
    const fetchJobs = async () => {
      if (!userId || userId === null) {
        console.error("User ID is not available or null");
        return;
      }
      try {
        const res = await fetch(
          `${API_URL}/api/service-requests/client/jobs/${userId}`,
          {
            method: "GET",
            credentials: "include",
          }
        );

        if (res.ok) {
          const data = await res.json();
          setJobs(data);
          setError(""); // Clear error if fetch is successful
          setSuccess("Jobs fetched successfully!"); // Set success message
          console.log(success);
        } else {
          setError("Failed to fetch jobs");
          console.log(error);
        }
      } catch (err) {
        setError("Error fetching jobs: " + err.message);
      }
    };

    fetchJobs();
  }, [userId, error, success]); // Fetch jobs whenever userId is updated

  /* Debugging logs
  console.log("User in useEffect:", user); // Debugging line to check user data
  console.log("User ID:", user ? user._id : "User not available"); // Debugging line to check user ID
  console.log("User in localStorage:", localStorage.getItem("user")); // Debugging line to check localStorage
  console.log("Jobs fetched:", jobs); // Debugging line to check jobs data
  */

  const handleServiceSelection = async (category) => {
    if (!user || !user._id) {
      console.log("User is not defined or user ID is missing");
      return;
    }

    try {
      console.log("Sending request with:", {
        clientId: user._id,
        category,
        description: `Request for ${category}`,
      });

      const response = await axios.post(
        `${API_URL}/api/service-requests/create`,
        {
          clientId: user._id,
          serviceType: category,
          description: `Request for ${category}`,
        },
        { withCredentials: true }
      );
      setJobs((prevJobs) => [...prevJobs, response.data.newServiceRequest]); // Update jobs state with the new job
      console.log("Service request response:", response.data);
      setShowModal(true);
    } catch (error) {
      console.error("Error creating request:", error);
    }
  };

const handleJobButtonClick = (job) => {
  const page =
    job.freelancerId !== null
      ? `/myjobs/${job._id}`
      : `/applications/${job._id}`;

  navigate(page, { 
    state: { job } // Pass the entire job object via state
  });
};

  // const handlePay = async (id) => {
  //   //console.log("Button clicked!");
  //   const email = "***@example.com";
  //   //need a call to backend to retrieve price from applications model.
  //   //need to handle payment logic as well

  //   try {
  //     const response = await axios.post(
  //       `${API_URL}/payments/create-checkout-session`,
  //       {
  //         email: email,
  //         jobId: id,
  //       },
  //       {
  //         headers: {
  //           "Content-Type": "application/json",
  //         },
  //       }
  //     );

  //     console.log("Full response:", response);
  //     const { checkoutUrl } = response.data;

  //     // Redirect user to the checkout page
  //     window.location.href = checkoutUrl;
  //   } catch (error) {
  //     console.error("Error creating checkout session:", error);
  //   }
  // };

  return (
    <main className="client-home">
      <Navbar />
      <section>
        {/* Welcome Banner */}
        <header className="welcome-banner">
          <h1 className="heading1">SkillVerse</h1>
          <p className="welcome-client">
          A single hub to connect with top freelancers, track your projects, and receive results you can trust.
        </p>
        </header>

        {/* Service buttons*/}
        {/* the choose service blue section */}
        <section className="chooseDesc">
          <p className="description">CHOOSE A SERVICE</p>
        </section>

        {/* each button */}
        <section className="section1">
          <button
            className="buttonSD"
            onClick={() => {
              setPendingCategory("Software Development");
              setShowConfirmModal(true);
            }}
          >
            Software Development
          </button>
          <button
            className="buttonML"
            onClick={() => {
              setPendingCategory("Data Science");
              setShowConfirmModal(true);
            }}
          >
            Data Science
          </button>
          <button
            className="buttonCL"
            onClick={() => {
              setPendingCategory("Creating Logos");
              setShowConfirmModal(true);
            }}
          >
            Creating Logos
          </button>
          <button
            className="buttonGD"
            onClick={() => {
              setPendingCategory("Graphic Designer");
              setShowConfirmModal(true);
            }}
          >
            Graphic Designer
          </button>
          <button
            className="buttonDM"
            onClick={() => {
              setPendingCategory("Digital Marketing");
              setShowConfirmModal(true);
            }}
          >
            Digital Marketing
          </button>
          {message && <p>{message}</p>}
        </section>

        {/* section grid on what skillverse offers */}
        <article>
          <h2>What Skill Verse Offers You</h2>
          <section className="offer-grid">
            <section className="offer-item">
              <h3>Dedicated hiring experts</h3>
              <p>
                Count on an account manager to find you the right talent and see
                to your project’s every need.
              </p>
            </section>
            <section className="offer-item">
              <h3>Satisfaction guarantee</h3>
              <p>
                We guarantee satisfaction with every project, ensuring you're
                happy with the results.
              </p>
            </section>
            <section className="offer-item">
              <h3>Flexible payment models</h3>
              <p>
                Choose from a variety of flexible payment models to fit your
                needs and budget.
              </p>
            </section>
            <section className="offer-item">
              <h3>Advanced management tools</h3>
              <p>
                Access powerful tools to manage your projects and teams with
                ease.
              </p>
            </section>
          </section>
        </article>

        <section className="jobs-banner"></section>

        <section className="section-jobs">
          <h1 className="header-text">Your Current Job Requests</h1>
          <h5>
            Manage your current jobs. View applications for your pending
            requests, and track progress for your jobs that are currently being
            worked on.
          </h5>
          {jobs.length === 0 ? (
            <p>No available jobs at the moment.</p>
          ) : (
            <section className="jobs-grid">
              {Array.isArray(jobs) /* Check if jobs is an array */ &&
                jobs.map((job) => (
                  <article key={job._id} className="my-jobs-card">
                    <p>
                      <strong>Service Type:</strong> {job.serviceType}
                    </p>
                    <p>
                      <strong>Freelancer: </strong>
                      {job.freelancerId !== null
                        ? job.freelancerId?.username
                        : "No Freelancer Assigned Yet"}
                    </p>
                    <p>
                      <strong>Status:</strong> {job.status}
                    </p>

                    <button
                      className="btnDetails"
                      onClick={() => handleJobButtonClick(job)}
                    >
                      {job.freelancerId !== null
                        ? "View Details"
                        : "View Applications"}
                    </button>
                    <button
                      className="btnMilestones"
                      onClick={() => {
                        setSelectedJobForMilestones(job);
                        setMilestones([
                          { description: "", dueDate: "", amount: "" },
                        ]);
                        setShowMilestonesModal(true);
                      }}
                    >
                      Set Milestones
                    </button>
                  </article>
                ))}
            </section>
          )}
        </section>

      </section>
      <Modal show={showModal} onHide={() => setShowModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Request Submitted</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Your service request was successfully submitted!
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowModal(false)}>
            Close
          </Button>
        </Modal.Footer>
      </Modal>
      <Modal
        show={showConfirmModal}
        onHide={() => setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Confirm Request</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Are you sure you want to request a service for{" "}
          <strong>{pendingCategory}</strong>?
        </Modal.Body>
        <Modal.Footer>
          <Button
            className="noButton"
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
          >
            No
          </Button>
          <Button
            className="yesButton"
            variant="primary"
            onClick={() => {
              handleServiceSelection(
                pendingCategory
              ); /*sends requested service using route when clicks yes*/
              setShowConfirmModal(false);
            }}
          >
            Yes
          </Button>
        </Modal.Footer>
      </Modal>
      {/*modal for success of milestone setting */}
      <Modal
        show={showMilestoneSuccessModal}
        onHide={() => setShowMilestoneSuccessModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>Milestones Saved</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          The milestones have been successfully saved for this job.
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="primary"
            onClick={() => setShowMilestoneSuccessModal(false)}
          >
            Close
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Milestones Modal */}
      <Modal
        show={showMilestonesModal}
        onHide={() => setShowMilestonesModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            Set Milestones for {selectedJobForMilestones?.serviceType}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form>
            {/*render input field for each milestone*/}
            {milestones.map((milestone, index) => (
              <section key={index} className="mb-3">
                <section className="form-group">
                  <label>Description</label>
                  <input
                    type="text"
                    className="form-control"
                    value={milestone.description}
                    onChange={(e) => {
                      // update specific milestone's description
                      const newMilestones = [...milestones];
                      newMilestones[index].description = e.target.value;
                      setMilestones(newMilestones);
                    }}
                    placeholder="Milestone description"
                    required // field mandotory
                  />
                </section>
                <section className="form-group">
                  <label>Due Date</label>
                  <input
                    type="date"
                    className="form-control"
                    value={milestone.dueDate}
                    onChange={(e) => {
                      // update the specific milestone's due date
                      const newMilestones = [...milestones];
                      newMilestones[index].dueDate = e.target.value;
                      setMilestones(newMilestones);
                    }}
                    required
                  />
                </section>
                {index > 0 && (
                  // removing milestones button
                  <Button
                    variant="danger"
                    size="sm"
                    onClick={() => {
                      const newMilestones = [...milestones];
                      newMilestones.splice(index, 1);
                      setMilestones(newMilestones);
                    }}
                    className="mt-2"
                  >
                    Remove Milestone
                  </Button>
                )}
              </section>
            ))}
            {/*adding more milestones at once*/}
            <Button
              variant="secondary"
              onClick={() => {
                setMilestones([
                  ...milestones,
                  { description: "", dueDate: "" },
                ]);
              }}
              className="me-2"
            >
              Add Another Milestone
            </Button>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowMilestonesModal(false)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={async () => {
              try {
                const hasEmptyFields = milestones.some(
                  (m) => !m.description || !m.dueDate
                );

                if (hasEmptyFields) {
                  alert("Please fill in all fields for all milestones");
                  return;
                }

                const response = await axios.post(
                  `${API_URL}/api/milestones/${selectedJobForMilestones._id}`,
                  { milestones },
                  {
                    withCredentials: true,
                    headers: {
                      "Content-Type": "application/json",
                    },
                  }
                );

                console.log("Milestones created:", response.data);
                setShowMilestonesModal(false);
                setShowMilestoneSuccessModal(true);

              } catch (error) {
                console.error("Error:", error.response?.data || error.message);
                alert(
                  `Failed to set milestones: ${
                    error.response?.data?.message || error.message
                  }`
                );
              }
            }}
          >
            Save Milestones
          </Button>
        </Modal.Footer>
      </Modal>

      <Footer />
    </main>
  );
};

export default ClientHome;
