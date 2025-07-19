import React from "react";
import Navbar from "../components/Navbar";
import styles from "../styles/About.module.css";
import Footer from "../components/Footer";


export default function About() {
  return (
    <div>
      <Navbar />

      <div style={{ marginBottom: "200px" }}>
        <div className={styles.banner}>
          <img src="/images/about-banner.webp" alt="" />
          <h1 className={styles.title}>About Us</h1>
        </div>
        <div className={styles.missionContent}>
          <h2 className={styles.missionTitle}>Our Mission</h2>
          <p className={styles.missionText}>
            To empower charitable giving with trust and transparency by leveraging blockchain technology, ensuring that every donation is secure, traceable, and reaches its intended cause.
          </p>
        </div>
        <div className="container" style={{ maxWidth: "1200px", marginBottom: "100px" }}>
          <div className={styles.howContent}>
            <h2 className={styles.howTitle}>How It Works</h2>
            <div className={styles.howSteps}>
              <div>
                <div className={styles.stepsIcon}>
                  <img src="/images/blockchain.png" alt="" />
                </div>
                <p>Every donation is publicly tracked and recorded on the blockchain for full transparency</p>
              </div>
              <div>
                <div className={styles.stepsIcon}>
                  <img src="/images/smart-contract.png" alt="" />
                </div>
                <p>Donations are released automatically by smart contracts only when campaign goals are verified</p>
              </div>
              <div>
                <div className={styles.stepsIcon}>
                  <img src="/images/verified-ngo.png" alt="" />
                </div>
                <p>Campaign Creators have been thouroghly verified by our team</p>
              </div>
            </div>
          </div>
        </div>
        <div className="container" style={{ maxWidth: "1200px", margin: "0 auto" }}>
          <div className="row">
            <div className="col-md-5">
              <h2 style={{fontWeight: 700, textAlign: "center"}}>Our Vision</h2>
              <p>To build a future where donors and charitable organizations connect with complete confidence, knowing that every contribution is protected, every transaction is transparent, and generosity can thrive without barriers or doubt.</p>
            </div>
            <div className="col-md-7">
              <h2 style={{fontWeight: 700, textAlign: "center"}}>Our Values</h2>
              <ul>
                <li><strong>Transparency: </strong>All donations are recorded on a blockchain ledger, visible to all.</li>
                <li><strong>Accountability:</strong> Funds are only released when campaign conditions are met.</li>
                <li><strong>Security:</strong> Every transaction is protected with the high standards of digital security.</li>
                <li><strong>Trust:</strong> Verified organizations and clear processes eliminate the risks of fraud and misuse.</li>
                <li><strong>Empowerment:</strong> We give both donors and charities the tools to make a meaningful impact.</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
