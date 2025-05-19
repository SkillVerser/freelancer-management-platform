import React from "react";
import "./Footer.css";

const Footer = () => (
  <footer className="footer">
    <div className="footer-content">
      <span className="footer-logo">SkillVerse</span>
      <span className="footer-copy">
        © {new Date().getFullYear()} SkillVerse. All rights reserved.
      </span>
    </div>
  </footer>
);

export default Footer;