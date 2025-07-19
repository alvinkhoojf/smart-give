import React, { useEffect, useState } from "react";
import Swal from 'sweetalert2';
import CampaignCard from "../CampaignCard"; 

export default function PendingCampaignsTab() {
  const [pendingCampaigns, setPendingCampaigns] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPendingCampaigns = async () => {
    setLoading(true);
    try {
      const res = await fetch("http://localhost:5000/api/campaign/pending");
      const data = await res.json();
      setPendingCampaigns(data);
    } catch (err) {
      Swal.fire({
        icon: 'error',
        title: 'Failed to load pending campaigns',
        text: err.message || 'Could not fetch campaigns.',
        confirmButtonColor: '#FF416C'
      });
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPendingCampaigns();
  }, []);

  return (
    <div>
      {loading && <div>Loading campaigns...</div>}
      {!loading && pendingCampaigns.length === 0 && (
        <div style={{ color: "#aaa", minHeight: "51.7vh" }}>No campaigns pending verification.</div>
      )}
      <div
        style={{
          display: "flex",
          flexWrap: "wrap",
          gap: 18,
          justifyContent: "flex-start",
          maxWidth: 1300,
          margin: "0 auto",
        }}
      >
        {pendingCampaigns.map((campaign) => (
          <CampaignCard
            key={campaign.id}
            campaign={campaign}
            action="view"
          />
        ))}
      </div>
    </div>
  );
}
