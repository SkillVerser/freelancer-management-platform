import React from "react";
import "./AuthLogin.css";
import loginImage from "./images/Login-image.png";
import API_URL from "../config/api";

const AuthOptions = () => {
  const handleGoogleLogin = () => {
    console.log("Logging in with Google...");
    window.location.href = `${API_URL}/auth/google`;
  };

  return (
    <section className="container-fluid vh-100 d-flex flex-column justify-content-center align-items-center">
      <section
        className="row shadow rounded overflow-hidden"
        style={{ width: "80%", maxWidth: "1000px" }}
      >
        {/* Left section */}
        <section className="col-md-6 p-0 left-panel">
          <section className="left-panel-inner d-flex flex-column h-100 p-5 text-white">
            <h2 className="welcomeHeading" id="left-panel-heading">
              Welcome to SkillVerse <br />
              <br />
            </h2>
            <p className="welcomeText" id="left-panel-text">
              Sign in to manage your freelance work or hire top talent with
              ease. Stay connected, track progress, and grow your business or
              career. Let’s make great work happen—together!
            </p>
            <img
              src={loginImage}
              alt="Working Woman"
              className="img-fluid mt-4"
            />
          </section>
        </section>

        {/* Right section */}
        <section
          className="col-md-6 p-5"
          style={{ backgroundColor: "#AFEEEE" }}
        >
          <section className="right-panel-text">
            <h3 id="right-panel-heading">Continue with your account</h3>
          </section>

          <section className="d-grid gap-3 button-section">
            <button
              className="btn btn-outline-dark"
              id="google-btn"
              onClick={handleGoogleLogin}
            >
              <i
                className="bi bi-google me-2"
                style={{
                  backgroundColor: "white",
                  color: "red",
                  borderColor: "red",
                }}
              ></i>{" "}
              Continue with Google
            </button>
            {/* Added content to fill the right section */}
            <div className="mt-4 px-3 py-4 rounded right-panel-features">
              <ul className="list-unstyled mb-4 right-panel-features-list">
                <li className="mb-3 d-flex align-items-center">
                  <i
                    className="bi bi-check-circle-fill text-success me-3"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  Project tracking and management
                </li>
                <li className="mb-3 d-flex align-items-center">
                  <i
                    className="bi bi-check-circle-fill text-success me-3"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  Secure and easy payment processing
                </li>
                <li className="mb-2 d-flex align-items-center">
                  <i
                    className="bi bi-check-circle-fill text-success me-3"
                    style={{ fontSize: "1.5rem" }}
                  ></i>
                  Client or Freelancer option
                </li>
              </ul>
              <blockquote className="blockquote text-muted">
                “Great things are done by a series of small things brought
                together.”
                <br />
                <footer className="blockquote-footer">Vincent Van Gogh</footer>
              </blockquote>
            </div>
          </section>
        </section>
      </section>
    </section>
  );
};

export default AuthOptions;
