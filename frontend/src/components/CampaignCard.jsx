import React from 'react';
import { Link } from 'react-router-dom';
import styles from "../styles/CampaignCard.module.css";

// Helper to extract plain text and limit chars
function getShortDesc(html, maxChars = 130) {
  const text = html.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
  if (text.length <= maxChars) return text;
  return text.slice(0, maxChars) + "...";
}

export default function CampaignCard({ campaign, action = "donate" }) {
  const backendBase = "http://localhost:5000";
  let image = backendBase + '/default-campaign.png';
  if (campaign.images) {
    try {
      const imgs = typeof campaign.images === "string" ? JSON.parse(campaign.images) : campaign.images;
      if (imgs && imgs.length > 0) {
        let imgPath = imgs[0];
        if (imgPath && !imgPath.startsWith("http")) {
          if (imgPath.startsWith("/")) imgPath = imgPath.slice(1);
          imgPath = `${backendBase}/${imgPath}`;
        }
        image = imgPath;
      }
    } catch {}
  }

  const goalAmountMYR = campaign.goal_amount
    ? `RM ${Number(campaign.goal_amount).toLocaleString()}`
    : "N/A";

  const ngoUsername = campaign.ngo_username || "";

  return (
    <div className={styles.campaignCard}>
      <div className={styles.cardImgWrapper}>
        <img src={image} alt={campaign.title} className={styles.cardImg} />
      </div>
      <div className={styles.cardBody}>
        <h5 className={styles.cardTitle}>{campaign.title}</h5>
        <span className={styles.cardNgo}>
          {ngoUsername && <b>{ngoUsername}</b>}
          <img className={styles.verifiedIcon} src="/images/verified.png" alt="Verified" />
        </span>
        <div className={styles.cardDesc}>
          {getShortDesc(campaign.description, 130)}
          <div className={styles.cardGoal}>
            <div className={styles.verified}>
              <img className={styles.shieldIcon} src="/images/shield.png" alt="Verified" /> Verified
            </div>
            <b>{goalAmountMYR}</b>
          </div>
        </div>
        {action === "edit" ? (
          <Link to={`/edit/${campaign.contract_address}`} className={styles.donateBtn}>
            Edit
          </Link>
        ) : action === "view" ? (
          <Link to={`/admin/campaigns/${campaign.contract_address}`} className={styles.donateBtn}>
            View Details
          </Link>
        ) : (
          <Link to={`/campaigns/${campaign.contract_address}`} className={styles.donateBtn}>
            Donate
          </Link>
        )}
      </div>
      
    </div>
  );
}
