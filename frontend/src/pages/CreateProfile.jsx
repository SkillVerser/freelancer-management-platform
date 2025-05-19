import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./CreateProfile.css";
import API_URL from "../config/api";
import {
  Card,
  Container,
  Row,
  Col,
  Badge,
  Button,
  Alert,
} from "react-bootstrap";

const CreateProfile = () => {
  const [skills, setSkills] = useState([]); // State to store skills
  const [skillInput, setSkillInput] = useState(""); // State for the input field
  const [aboutMe, setAboutMe] = useState(""); // State for the About Me input
  const [location, setLocation] = useState(""); // State for location
  const [gender, setGender] = useState(""); // State for gender
  const [occupation, setOccupation] = useState(""); // State for occupation
  const [errorMessage, setErrorMessage] = useState(""); // State for error message
  const navigate = useNavigate(); // Hook for navigation
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;
  console.log("User role:", role); // Debugging log

  const handleAddSkill = () => {
    if (skillInput.trim() !== "") {
      setSkills([...skills, skillInput.trim()]); // Add the new skill to the array
      setSkillInput(""); // Clear the input field
    }
  };

  const handleRemoveSkill = (index) => {
    setSkills(skills.filter((_, i) => i !== index)); // Remove the skill at the specified index
  };

  const handleAboutMeChange = (e) => {
    const words = e.target.value.split(/\s+/); // Split the input into words
    if (words.length <= 50) {
      setAboutMe(e.target.value); // Update the state if word count is within the limit
    }
  };

  const handleSubmit = async () => {
    if (!location || !gender || !occupation || !aboutMe) {
      setErrorMessage("Missing information. Please fill out all fields.");
      return;
    }

    setErrorMessage(""); // Clear the error message

    console.log(user._id); //for debugging

    const userData = {
      user: user._id,
      location,
      gender,
      occupation,
      skills,
      about: aboutMe,
    };

    console.log("Sending user data:", userData); // Debugging log

    try {
      const response = await axios.post(
        `${API_URL}/users/create-user`,
        userData,
        {
          withCredentials: true,
        }
      );
      console.log("Response from server:", response.data); // Debugging log

      if (response.data.message === "Profile details saved successfully") {
        ///

        ///
        alert("Profile created successfully!");
        // Redirect based on role
        if (role === "client") {
          navigate("/client/home");
        } else if (role === "freelancer") {
          navigate("/freelancer/home");
        } else if (role === "admin") {
          navigate("/admin/home");
        }
      } else {
        setErrorMessage(response.data.message || "Failed to create profile.");
      }
    } catch (error) {
      console.error("Error creating profile:", error.response || error.message); // Debugging log
      if (
        error.response &&
        error.response.data &&
        error.response.data.message
      ) {
        setErrorMessage(error.response.data.message);
      } else {
        setErrorMessage("An error occurred. Please try again.");
      }
    }
  };

  return (
    <section
      className="body"
      style={{ backgroundColor: "#AFEEEE", minHeight: "100vh" }}
    >
      <Container className="container mt-5">
        <Row className="d-flex justify-content-start">
          <h1 className="welcome-heading">Welcome</h1>
        </Row>
        <Row className="d-flex justify-content-start">
          <Col md={6} className="col-1">
            <Card className="profile-card border-white">
              <Card.Body>
                <Row className="profile-info-row" id="card-heading">
                  <h3>Please enter your information.</h3>
                </Row>
                <Row className="profile-info-row">
                  <h5>Fields marked with '*' are required.</h5>
                </Row>
                <Row className="profile-info-row align-items-center">
                  <label htmlFor="location">Location:*</label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    placeholder="e.g., Johannesburg"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                  />
                </Row>
                <Row className="profile-info-row align-items-center">
                  <label htmlFor="gender">Gender:*</label>
                  <select
                    id="gender"
                    name="gender"
                    className="form-select"
                    value={gender}
                    onChange={(e) => setGender(e.target.value)}
                  >
                    <option value="">Select Gender</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="not-specified">Not specified</option>
                  </select>
                </Row>
                <Row className="profile-info-row align-items-center">
                  <label htmlFor="occupation">Occupation:*</label>
                  <input
                    type="text"
                    id="occupation"
                    name="occupation"
                    placeholder="e.g., Software Engineer"
                    value={occupation}
                    onChange={(e) => setOccupation(e.target.value)}
                  />
                </Row>
                <Row className="profile-info-row align-items-center">
                  <label htmlFor="skills">Add Skill:</label>
                  <input
                    type="text"
                    id="skills"
                    name="skills"
                    placeholder="e.g., React.js"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                  />
                  <Button
                    variant="dark"
                    onClick={handleAddSkill}
                    className=" add-skill-btn"
                    style={{ width: "100px" }}
                  >
                    Add Skill
                  </Button>
                </Row>
                <Row className="profile-info-row">
                  <label htmlFor="skills-list">Your Skills:</label>
                  <section id="skills-list">
                    {skills.length === 0 ? (
                      <p className="text-muted">No skills added yet.</p>
                    ) : (
                      skills.map((skill, index) => (
                        <Badge
                          key={index}
                          bg="dark"
                          className="me-2 mb-2 skill-badge"
                          onClick={() => handleRemoveSkill(index)}
                          style={{ cursor: "pointer" }}
                        >
                          {skill} &times;
                        </Badge>
                      ))
                    )}
                  </section>
                </Row>
                <Row className="profile-info-row align-items-center">
                  <label htmlFor="aboutMe">About Me:*</label>
                  <textarea
                    id="aboutMe"
                    name="aboutMe"
                    placeholder="Write about yourself (max 50 words)"
                    value={aboutMe}
                    onChange={handleAboutMeChange}
                    rows="4"
                    className="form-control"
                  />
                  <small className="text-muted">
                    {aboutMe.split(/\s+/).filter((word) => word).length} / 50
                    words
                  </small>
                </Row>
                {errorMessage && (
                  <Row className="profile-info-row">
                    <Alert variant="danger">{errorMessage}</Alert>
                  </Row>
                )}
                <Row className="profile-info-row justify-content-center mt-4">
                  <Button
                    className="submit-btn"
                    variant="success"
                    size="lg"
                    onClick={handleSubmit}
                  >
                    Create Profile
                  </Button>
                </Row>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </section>
  );
};

export default CreateProfile;
