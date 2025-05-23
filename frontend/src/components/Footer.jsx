import React from "react";
import "./Footer.css";

const Footer = () => (
  <footer className="footer">
    <article className="footer-content">
      <section className="footer-logo">SkillVerse</section>
      <section className="footer-copy">
        © {new Date().getFullYear()} SkillVerse. All rights reserved.
      </section>
    </article>
  </footer>
);

export default Footer;
