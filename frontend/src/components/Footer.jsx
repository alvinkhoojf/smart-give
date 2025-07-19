import React from "react";
import styles from "../styles/Footer.module.css";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.footerContainer}>
        <div className={styles.brand}>
          <span className={styles.brandName}>SmartGive</span>
        </div>
        <nav className={styles.nav}>
          <Link to="/about">About</Link>
          <Link to="/campaigns">Campaigns</Link>
          <Link to="/news">News</Link>
          <Link to="/">Meet the Team</Link>
          <Link to="/">Contact</Link>
        </nav>
        <div className={styles.socials}>
          <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/facebook.png" alt="Facebook" />
          </a>
          <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/twitter.png" alt="Twitter" />
          </a>
          <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
            <img src="/images/instagram.png" alt="Instagram" />
          </a>
        </div>
      </div>
      <div className={styles.bottom}>
        <span>© {new Date().getFullYear()} SmartGive. All rights reserved.</span>
      </div>
    </footer>
  );
}
