import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { ethers } from "ethers";
import { Switch } from "antd";
import axios from "axios";
import Swal from 'sweetalert2';
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import CampaignABI from "../constants/CampaignABI";
import styles from "../styles/Donation.module.css";

const Donation = () => {
  const { address: campaignAddress } = useParams();
  const [amountMYR, setAmountMYR] = useState('');
  const [exchangeRate, setExchangeRate] = useState(null);
  const [campaign, setCampaign] = useState(null);
  const [totalRaised, setTotalRaised] = useState(0);
  const [anonymous, setAnonymous] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadInfo = async () => {
      // Fetch campaign and price regardless of login status
      try {
        const [campaignRes, priceRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/campaign/${campaignAddress}`),
          axios.get("http://localhost:5000/api/convert/eth-price-myr")
        ]);
        setCampaign(campaignRes.data);
        setExchangeRate(Number(priceRes.data.myr));
      } catch (err) {
        console.error("Failed to load campaign or price", err);
      }

      // Check login status separately
      try {
        const userRes = await axios.get("http://localhost:5000/api/auth/me", { withCredentials: true });
        setUser(userRes.data);
      } catch {
        setUser(null); // not logged in is OK
      }

      // Fetch total raised
      try {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
        const contract = new ethers.Contract(campaignAddress, CampaignABI, provider);
        const raised = await contract.totalDonated();
        setTotalRaised(Number(ethers.utils.formatEther(raised)));
      } catch (err) {
        console.error("Failed to fetch raised amount", err);
      }
    };

    loadInfo();
  }, [campaignAddress]);

  const ethEquivalent = amountMYR && exchangeRate
    ? (Number(amountMYR) / exchangeRate).toFixed(6)
    : 0;

  const handleDonate = async () => {
    if (!amountMYR || isNaN(amountMYR) || Number(amountMYR) <= 0) {
      alert("Please enter a valid MYR amount.");
      return;
    }

    if (!exchangeRate) {
      alert("Exchange rate unavailable. Try again later.");
      return;
    }

    const ethValue = (Number(amountMYR) / exchangeRate).toFixed(6);

    if (typeof window.ethereum === "undefined") {
      alert("MetaMask not detected. Please install it to continue.");
      return;
    }

    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      // ✅ Use the smart contract's donate() function
      const contract = new ethers.Contract(campaignAddress, CampaignABI, signer);
      const tx = await contract.donate({ value: ethers.utils.parseEther(ethValue) });
      await tx.wait();
      
      // ✅ Log donation off-chain
      await axios.post(
        "http://localhost:5000/api/donations",
        {
          wallet_address: user?.wallet_address,
          username:
            user?.username ||
            user?.org_username ||
            `${user?.first_name || ""} ${user?.last_name || ""}`.trim() || null,
          contributor_type: user?.role,
          campaign_address: campaignAddress,
          amount: ethValue,
          amount_myr: amountMYR,
          anonymous,
          tx_hash: tx.hash
        },
        { withCredentials: true }
      );


      await Swal.fire({
        icon: "success",
        title: "Donation successful!",
        text: "Thank you for your support.",
        confirmButtonColor: "#4BB543"
      });
      setAmountMYR(""); 
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Transaction failed",
        text: err.message || "An error has occurred.",
        confirmButtonColor: "#FF416C"
      });
    }
  };

  if (!campaign) return <div>Loading...</div>;

  const images = JSON.parse(campaign.images || "[]");
  const firstImage = images.length ? images[0] : null;
  const raisedMYR = exchangeRate ? (totalRaised * exchangeRate).toFixed(2) : "-";

  return (
    <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh" }}>
      <Navbar />
      <div className="container mt-5 mb-5">
        <div className="row g-5">
          <div className="col-md-6">
            <div className="position-relative">
              {/* Blurred donation box if not logged in */}
              <div
                className={styles.donationBox}
                style={{
                  filter: !user ? "blur(4px)" : "none",
                  pointerEvents: !user ? "none" : "auto",
                  transition: "filter 0.3s ease"
                }}
              >
                <h4 className="mb-4">How much do you want to donate?</h4>
                <div className="mb-4">
                  <label className="form-label">Amount (in MYR)</label>
                  <input
                    type="number"
                    className="form-control"
                    placeholder="e.g. 100"
                    value={amountMYR}
                    onChange={(e) => setAmountMYR(e.target.value)}
                  />
                  <div className="text-muted mt-2">
                    {exchangeRate && amountMYR && <div>≈ {ethEquivalent} ETH</div>}
                  </div>
                </div>

                <div className="mb-4 d-flex align-items-center gap-2">
                  <Switch
                    checked={anonymous}
                    onChange={setAnonymous}
                    style={{ backgroundColor: anonymous ? "#FF416C" : "#d9d9d9" }}
                  />
                  <label className="form-label mb-0">Make my donation anonymous</label>
                </div>

                <button className={styles.donateBtn} onClick={handleDonate}>
                  Donate
                </button>
              </div>

              {/* Sign In Overlay */}
              {!user && (
                <div
                  className="position-absolute top-50 start-50 translate-middle"
                  style={{ zIndex: 10 }}
                >
                  <Link to="/role" className={styles.signInButton}>
                    Sign In to Donate
                  </Link>
                </div>
              )}
            </div>
          </div>


          {/* RIGHT: Campaign Details */}
          <div className="col-md-6">
            <div className={styles.infoCard}>
              {firstImage && (
                <img
                  src={firstImage.startsWith("http") ? firstImage : "http://localhost:5000" + firstImage}
                  className="img-fluid rounded mb-3"
                  style={{ height: 250, objectFit: "cover", width: "100%" }}
                  alt="Campaign"
                />
              )}
              <h4>{campaign.title}</h4>
              <p className={styles.ngo}>{campaign.ngo_username}</p>
              <div className="mb-2">
                <div className={styles.verified}>
                  <img className={styles.shieldIcon} src="/images/shield.png" alt="Verified" /> Verified
                </div>
              </div>
              <div dangerouslySetInnerHTML={{ __html: campaign.description?.slice(0, 200) + '...' }} />

              <div className="alert alert-light mt-3 d-flex justify-content-between">
                <strong>Total Amount Raised:</strong>
                <span className={styles.raisedAmount}>RM {raisedMYR}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Donation;
