import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import 'bootstrap/dist/css/bootstrap.min.css';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import CampaignCard from '../components/CampaignCard';
import NewsCard from '../components/NewsCard';

export default function HomePage() {
  const [latestCampaigns, setLatestCampaigns] = useState([]);
  const [latestNews, setLatestNews] = useState([]);

  // Fetch latest campaigns and news
  useEffect(() => {
    // Latest campaigns
    fetch('http://localhost:5000/api/campaign/verified')
      .then(res => res.json())
      .then(data => setLatestCampaigns(data.slice(0, 3)))
      .catch(() => setLatestCampaigns([]));
    // Latest news
    fetch('http://localhost:5000/api/admin/news')
      .then(res => res.json())
      .then(data => setLatestNews(data.slice(0, 3)))
      .catch(() => setLatestNews([]));
  }, []);

  return (
    <div>
      <Navbar />

      <section>
        <div className="container">
          <div className="row" style={{ margin: '30px 0' }}>
            <div className="col-md-5">
              <div style={{ margin: '20px 0' }}>
                <p style={{ margin: '20px 0', fontSize: '20px' }}>#1 Safest Charity Fundraiser</p>
                <h1>SmartGive unlocks the future of transparent charitable giving.</h1>
                <p style={{ margin: '20px 0', fontSize: '20px' }}>Become part of a community that’s reshaping the way we support nonprofits and social initiatives—one verified donation at a time.</p>
              </div>
              <div style={{ margin: '20px 0' }}>
                <Link to={"/campaigns"}>
                  <button style={{ backgroundColor: '#FF416C', border: '2px solid #FF416C', color: 'white', borderRadius: '20px', padding: '10px 30px', marginRight: 8 }}>Donate Now</button>
                </Link>
                <Link to={"/about"}>
                  <button style={{ backgroundColor: 'white', border: '2px solid #FF416C', color: '#FF416C', borderRadius: '20px', padding: '10px 30px' }}>Our Mission</button>
                </Link>
              </div>
            </div>
            <div className="col-md-7 d-flex justify-content-center">
              <img src="/images/homepage.webp" alt="" style={{ width: '90%', height: '90%' }}/>
            </div>
          </div>
        </div>
      </section>

      <section>
        <div style={{ backgroundColor: '#fff4cc', color: '#684c14', textAlign: 'center', padding: '15px 0' }}>
          <span style={{ fontSize: '16px', margin: '0 10px', fontWeight: 'bold' }}>All campaigns are verified</span>
          <span style={{ fontSize: '16px', margin: '0 10px' }}>--------</span>
          <span style={{ fontSize: '16px', margin: '0 10px', fontWeight: 'bold' }}>NGO/GO created campaigns</span>
          <span style={{ fontSize: '16px', margin: '0 10px' }}>--------</span>
          <span style={{ fontSize: '16px', margin: '0 10px', fontWeight: 'bold' }}>Blockchain recorded transactions</span>
        </div>
      </section>

      <section style={{ background: '#f8f8f8', padding: '50px 0' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <h2 style={{ fontWeight: 800, fontSize: '2rem' }}>Latest Campaigns</h2>
            <a href="/campaigns" style={{ color: '#FF416C', fontWeight: 700 }}>View All Campaigns &rarr;</a>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {latestCampaigns.length === 0 && <p>No campaigns yet.</p>}
            {latestCampaigns.map(c => (
              <CampaignCard key={c.id} campaign={c} />
            ))}
          </div>
        </div>
      </section>

      <section style={{ background: '#fff', paddingTop: '50px', paddingBottom: '200px' }}>
        <div className="container">
          <div className="d-flex justify-content-between align-items-end mb-4">
            <h2 style={{ fontWeight: 800, fontSize: '2rem' }}>Latest News</h2>
            <a href="/news" style={{ color: '#FF416C', fontWeight: 700 }}>View All News &rarr;</a>
          </div>
          <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {latestNews.length === 0 && <p>No news articles yet.</p>}
            {latestNews.map(a => (
              <NewsCard key={a.id} article={a} />
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
