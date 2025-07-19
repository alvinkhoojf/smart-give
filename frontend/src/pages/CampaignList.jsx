import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CampaignCard from '../components/CampaignCard';
import styles from '../styles/CampaignList.module.css';


export default function CampaignList() {
  const [campaigns, setCampaigns] = useState([]);
  const [status, setStatus] = useState('');
  const browseRef = useRef(null);

  useEffect(() => {
    async function fetchVerifiedCampaigns() {
      try {
        setStatus('Fetching verified campaigns...');
        const res = await axios.get('http://localhost:5000/api/campaign/verified', { withCredentials: true });
        setCampaigns(res.data);
        setStatus('');
      } catch (error) {
        setStatus(`Failed to load campaigns: ${error.message || error}`);
      }
    }
    fetchVerifiedCampaigns();
  }, []);

  return (
    <div>
      <Navbar />
      <div style={{backgroundColor: '#f8f8f8', paddingTop: '60px'}}>
        <div className="container">
          <div className={`row ${styles.header}`}>
            <div className={`col-md-7 ${styles.headerLeft}`}>
              <h1 className={styles.title}>Discover trustworthy charity campaigns on SmartGive</h1>
              <p className={styles.subTitle}>Help others by donating to their fundraiser.</p>
              <button
                className={styles.donateBtn}
                onClick={() => {
                  browseRef.current?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Donate Now
              </button>
            </div>
            <div className={`col-md-5 ${styles.headerRight}`}>
              <img src="/images/campaignlist-banner.png" alt="" />
            </div>
          </div>

          <div className={`row ${styles.campaigns}`} ref={browseRef}>
            <h1 className='mb-5'>Browse Campaigns</h1>
            {status && <p>{status}</p>}
            <div style={{display: 'flex', flexWrap: 'wrap', gap: 18, justifyContent: 'flex-start'}}>
              {campaigns.map(c => (
                <CampaignCard key={c.id} campaign={c} />
              ))}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
