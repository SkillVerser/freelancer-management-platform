//FreelancerProfile.jsx
import React, { useEffect, useState } from "react";
import "./FreelancerProfile.css";
import { Card, Container, Row, Col, Badge } from "react-bootstrap";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import API_URL from "../config/api";
const User = JSON.parse(localStorage.getItem("user"));

const FreelancerProfile = () => {
  const navigate = useNavigate();

  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get(
          `${API_URL}/users/profile/${User._id}`
        );
        console.log("Profile response data", response.data); // Debugging line to check the response
        setProfile(response.data);
      } catch (error) {
        console.error("Error fetching profile:", error);
      } finally {
        setLoading(false);
      }
    };

    if (User._id) {
      fetchProfile();
    }
  }, []);

  const freelancer = {
    name: "Tazeem Tayob",
    gender: "Male",
    skills: ["Web Development", "React.js", "Node.js", "MongoDB"],
    rating: 4.8,
    location: "Polokwane, South Africa",
    completedProjects: 12,
    about:
      "I'm a passionate full-stack developer with experience in modern web technologies.",
    hourlyRate: "$30/hr",
    email: "ahmed@example.com",
    role: "Freelancer",
    profilePic:
      "https://upload.wikimedia.org/wikipedia/commons/9/99/Sample_User_Icon.png",
    occupation: "Software Engineer",
  };

  if (loading) {
    return <p>Loading</p>;
  }

  return (
    <main className="freelancer-profile">
      <Navbar />
      <section className="body">
        <Container className="mt-5">
          <Row>
            <h2 className="profile-heading">
              Welcome to your profile, {User.username.split(" ")[0]}!
            </h2>
          </Row>
          <Row className="d-flex justify-content-start">
            {/* Card 1 */}
            <Col md={6} className="col-1">
              <Card className="profile-card border-white">
                <Card.Body>
                  <Row className="profile-image d-flex justify-content-center align-items-center">
                    <img
                      src={freelancer.profilePic}
                      alt="ProfilePic"
                      className="profile-pic"
                      width="70"
                      height="70"
                    />
                  </Row>
                  <Row className="profile-name-row">
                    <h3 className="profile-name">{User.username}</h3>
                  </Row>
                  <Row className="profile-info-row">
                    <p className="profile-info">
                      <strong>Location:</strong> {profile.location}
                    </p>
                  </Row>
                  <Row className="profile-info-row">
                    <p className="profile-info">
                      <strong>Gender:</strong> {profile.gender}
                    </p>
                  </Row>
                  <Row className="profile-info-row">
                    <p className="profile-info">
                      <strong>Role:</strong> {User.role}
                    </p>
                  </Row>
                  <Row className="profile-info-row">
                    <p className="profile-info">
                      <strong>Occupation:</strong> {profile.occupation}
                    </p>
                  </Row>
                  <Row className="profile-info-row">
                    <p className="profile-info">
                      <strong>Skills:</strong>
                      {profile.skills.map((skill, idx) => (
                        <Badge
                          key={idx}
                          bg="black"
                          className="mx-1 profile-badge"
                        >
                          {skill}
                        </Badge>
                      ))}
                    </p>
                  </Row>
                  <Row className="profile-info-row">
                    <p className="profile-info">
                      <strong>About:</strong> {profile.about}
                    </p>
                  </Row>
                  <Row className="edit-btn-row">
                    <button
                      className="edit-btn"
                      onClick={() => navigate("/create-profile")}
                    >
                      Edit Profile
                    </button>
                  </Row>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      </section>
      <Footer className="footer"/>
    </main>
  );
};

export default FreelancerProfile;