import React, { useEffect, useState, useRef } from "react";
import { ethers } from 'ethers';
import { useParams } from "react-router-dom";
import axios from "axios";
import Swal from 'sweetalert2';
import moment from "moment";
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import CampaignABI from '../constants/CampaignABI';
import styles from "../styles/CampaignDetails.module.css";
import { Carousel, Progress, Spin } from "antd";
import { Editor } from "@tinymce/tinymce-react";
import WithdrawPanel from "../components/WithdrawPanel";

const CAMPAIGN_TYPE_LABELS = [
  "Flexible",
  "Milestone",
  "Recurring",
  "Time Limit"
];


const ManageCampaign = () => {
  const { address: campaignAddress } = useParams();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [goal, setGoal] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [campaignType, setCampaignType] = useState(0);
  const [activeTab, setActiveTab] = useState("about");
  const [editing, setEditing] = useState(false);
  const [newDescription, setNewDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const tabContentRef = useRef(null);
  const [updates, setUpdates] = useState([]);
  const [showAddUpdate, setShowAddUpdate] = useState(false);
  const [newUpdate, setNewUpdate] = useState({ title: "", description: "" });
  const [postingUpdate, setPostingUpdate] = useState(false);
  const [ethToMYR, setEthToMYR] = useState(0);
  const [totalRaisedMYR, setTotalRaisedMYR] = useState(0);
  const [goalMYR, setGoalMYR] = useState(0);
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);


  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!campaignAddress) return;
      try {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
        const contract = new ethers.Contract(campaignAddress, CampaignABI, provider);
        const [goalAmount, totalDonated, ngoAddress, beneficiaryAddress, type] = await Promise.all([
          contract.goalAmount(),
          contract.totalDonated(),
          contract.ngo(),
          contract.beneficiary(),
          contract.campaignType()
        ]);
        setGoal(Number(ethers.utils.formatEther(goalAmount)));
        setTotalRaised(Number(ethers.utils.formatEther(totalDonated)));
        setCreator(ngoAddress);
        setBeneficiary(beneficiaryAddress);
        setCampaignType(Number(type));
      } catch (err) {
        console.error("Error fetching contract info:", err);
        setCreator("Unknown");
        setBeneficiary("Unknown");
      }
    };
    fetchContractInfo();
  }, [campaignAddress]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await axios.get("https://api.coinbase.com/v2/exchange-rates?currency=ETH");
        const myrRate = Number(res.data.data.rates.MYR);
        setEthToMYR(myrRate);
      } catch (err) {
        console.error("Failed to fetch ETH to MYR rate", err);
      }
    };
    fetchRate();
  }, []);

  useEffect(() => {
    const fetchCampaign = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/campaign/${campaignAddress}`);
        setCampaign(res.data);
        setNewDescription(res.data.description || "");
      } catch (err) {
        alert("Failed to load campaign details");
      } finally {
        setLoading(false);
      }
    };
    fetchCampaign();
  }, [campaignAddress]);

  useEffect(() => {
    if (ethToMYR > 0) {
      setTotalRaisedMYR(totalRaised * ethToMYR);
      setGoalMYR(goal * ethToMYR);
    }
  }, [ethToMYR, totalRaised, goal]);

  useEffect(() => {
    const fetchUpdates = async () => {
      try {
        const res = await axios.get(`http://localhost:5000/api/campaign/${campaignAddress}/updates`);
        setUpdates(res.data);
      } catch (err) {
        console.error("Failed to fetch updates", err);
      }
    };
    fetchUpdates();
  }, [campaignAddress]);

  useEffect(() => {
    const fetchDonations = async () => {
      setDonationsLoading(true);
      try {
        const res = await axios.get(`http://localhost:5000/api/campaign/${campaignAddress}/donations`);
        setDonations(res.data);
      } catch (err) {
        setDonations([]);
        console.error("Failed to fetch donations", err);
      }
      setDonationsLoading(false);
    };
    fetchDonations();
  }, [campaignAddress]);

  if (loading) return <div><Spin /> Loading...</div>;
  if (!campaign) return <div>Campaign not found.</div>;

  const donors = campaign.total_donors || 0;
  const percent = goal ? Math.min(100, (totalRaised / goal) * 100) : 0;

  const renderTabPanel = () => {
    if (activeTab === "about") {
      return (
        <div className={styles.description} style={{ padding: 16 }}>
          {editing ? (
            <>
              <Editor
                apiKey="p7psf0kbend8wjl3e3r3xrajqjspig5wq4oslq752ehu4z23"
                value={newDescription}
                init={{
                  height: 500,
                  menubar: false,
                  plugins: [
                    "advlist autolink lists link image",
                    "charmap print preview anchor help",
                    "searchreplace visualblocks code",
                    "insertdatetime media table paste wordcount",
                  ],
                  toolbar:
                    "undo redo | formatselect | bold italic | " +
                    "alignleft aligncenter alignright | bullist numlist outdent indent | help",
                }}
                onEditorChange={(content) => setNewDescription(content)}
              />
              <div className="mt-3 d-flex gap-2">
                <button
                  className="btn btn-success"
                  disabled={saving}
                  onClick={async () => {
                    setSaving(true);
                    try {
                      await axios.put(
                        `http://localhost:5000/api/campaign/${campaignAddress}`,
                        { description: newDescription },
                        { withCredentials: true }
                      );
                      await Swal.fire({
                        icon: 'success',
                        title: 'Description updated!',
                        confirmButtonColor: '#4BB543'
                      });
                      setCampaign(prev => ({ ...prev, description: newDescription }));
                      setEditing(false);
                    } catch (err) {
                      console.error(err);
                      await Swal.fire({
                        icon: 'error',
                        title: 'Failed to update description',
                        text: err.message || "Something went wrong.",
                        confirmButtonColor: '#FF416C'
                      });
                    } finally {
                      setSaving(false);
                    }
                  }}
                >
                  Save
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setNewDescription(campaign.description);
                    setEditing(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <div dangerouslySetInnerHTML={{ __html: campaign.description }} />
          )}
        </div>
      );
    }

    if (activeTab === "updates") {
      return (
        <div className={styles.description} style={{ padding: 16 }}>
          {showAddUpdate ? (
            <>
              <input
                className="form-control mb-2"
                placeholder="Title"
                value={newUpdate.title}
                onChange={(e) => setNewUpdate({ ...newUpdate, title: e.target.value })}
              />
              <Editor
                apiKey="p7psf0kbend8wjl3e3r3xrajqjspig5wq4oslq752ehu4z23"
                value={newUpdate.description}
                init={{
                  height: 300,
                  menubar: false,
                  plugins: [
                    "advlist autolink lists link image",
                    "charmap print preview anchor help",
                    "searchreplace visualblocks code",
                    "insertdatetime media table paste wordcount",
                  ],
                  toolbar:
                    "undo redo | formatselect | bold italic | " +
                    "alignleft aligncenter alignright | bullist numlist outdent indent | help",
                }}
                onEditorChange={(content) =>
                  setNewUpdate({ ...newUpdate, description: content })
                }
              />
              <div className="mt-3 d-flex gap-2">
                <button
                  className="btn btn-success"
                  disabled={postingUpdate || !newUpdate.title || !newUpdate.description}
                  onClick={async () => {
                    setPostingUpdate(true);
                    try {
                      await axios.post(
                        `http://localhost:5000/api/campaign/${campaignAddress}/updates`,
                        newUpdate,
                        { withCredentials: true }
                      );

                      const res = await axios.get(`http://localhost:5000/api/campaign/${campaignAddress}/updates`);
                      setUpdates(res.data);

                      setNewUpdate({ title: "", description: "" });
                      setShowAddUpdate(false);
                      await Swal.fire({
                        icon: 'success',
                        title: 'Update posted!',
                        confirmButtonColor: '#4BB543'
                      });
                    } catch (err) {
                      await Swal.fire({
                        icon: 'error',
                        title: 'Failed to post update',
                        text: err.message || "Please try again.",
                        confirmButtonColor: '#FF416C'
                      });
                    } finally {
                      setPostingUpdate(false);
                    }
                  }}
                >
                  Post Update
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    setNewUpdate({ title: "", description: "" });
                    setShowAddUpdate(false);
                  }}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : updates.length === 0 ? (
            <p className="mt-4">No updates yet.</p>
          ) : (
            <div>
              {updates.map((u, i) => (
                <div key={i} className="mb-5">
                  <h3 className="mb-3">{u.title}</h3>
                  <div
                    dangerouslySetInnerHTML={{ __html: u.description }}
                    className="mb-5"
                  />
                  <small className="text-muted">
                    Posted {moment(u.created_at).fromNow()}
                  </small>
                  <hr />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
     
    if (activeTab === "donations") {
      return (
        <div style={{ padding: 16 }}>
          {donationsLoading ? (
            <Spin />
          ) : donations.length === 0 ? (
            <div>No donations yet.</div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="table table-striped" style={{ minWidth: 600 }}>
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Donor</th>
                    <th>Amount (ETH)</th>
                    <th>Amount (MYR)</th>
                  </tr>
                </thead>
                <tbody>
                  {donations.map((d, idx) => (
                    <tr key={idx}>
                      <td>{d.timestamp ? moment(d.timestamp).format("YYYY-MM-DD") : "-"}</td>
                      <td>
                        {d.anonymous
                          ? (
                              <span style={{ fontFamily: 'monospace', fontSize: 13 }}>
                                {d.wallet_address?.slice(0, 6)}...{d.wallet_address?.slice(-4)}
                              </span>
                            )
                          : (d.username || "Unknown")}
                      </td>
                      <td>
                        {d.amount ? Number(d.amount).toFixed(6) : "-"}
                      </td>
                      <td>
                        {d.amount
                          ? "RM " + (Number(d.amount) * ethToMYR).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === "withdraw") {
      return (
        <WithdrawPanel campaignAddress={campaignAddress} campaignType={campaignType} ethToMYR={ethToMYR} totalRaised={totalRaised} goal={goal}/>
      );
    }

    return null;
  };

  const images = campaign.images && typeof campaign.images === "string"
    ? JSON.parse(campaign.images)
    : campaign.images || [];

  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', paddingTop: '60px', paddingBottom: '200px' }}>
        <div className="container">
          <div className={styles.campaignHeader}>
            <h1 className={styles.campaignTitle}>{campaign.title}</h1>
            <div className={styles.verified}>
              <img className={styles.shieldIcon} src="/images/shield.png" alt="Verified" /> Verified
            </div>
          </div>

          <div className="row">
            <div className="col-md-8">
              <Carousel autoplay dotPosition="bottom" style={{ margin: "0 auto" }}>
                {images.length > 0 ? images.map((img, i) => (
                  <div key={i}>
                    <img
                      src={img.startsWith("http") ? img : "http://localhost:5000" + img}
                      alt={`Campaign visual ${i + 1}`}
                      style={{ width: "100%", height: "530px", objectFit: "cover", borderRadius: 12 }}
                    />
                  </div>
                )) : <div style={{ height: 530, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>No images</div>}
              </Carousel>
            </div>
            <div className="col-md-4">
              <div className={styles.campaignDetails}>
                <div className="row mb-3">
                  <div className="col-md-8">
                    <span className={styles.raisedText}>Total amount raised</span>
                    <span className={styles.raisedAmount}>
                      RM{totalRaisedMYR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                    <span>
                      RM{goalMYR.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })} goal <span>•</span> {donors} donations
                    </span>
                  </div>
                  <div className="col-md-4">
                    <Progress type="circle" percent={Number(percent.toFixed(2))} size={100} />
                  </div>
                  <div className={styles.ngo}>{campaign.ngo_username}</div>
                </div>
                <div>
                  <span className={styles.addressTitle}>Recipient address</span>
                  <div className={styles.address}>{creator}</div>
                </div>
                <div>
                  <span className={styles.addressTitle}>Beneficiary address</span>
                  <div className={styles.address}>{beneficiary}</div>
                </div>
                <div>
                  <span className={styles.addressTitle}>Campaign Type</span>
                  <div className={styles.address} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <span>{CAMPAIGN_TYPE_LABELS[campaignType] || "Unknown"}</span>
                  </div>
                </div>
                <div className="mt-3">
                  <button
                    className={styles.donateBtn}
                    onClick={() => {
                      setEditing(true);
                      setActiveTab("about");
                      setTimeout(() => {
                        tabContentRef.current?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                  >
                    Edit Campaign
                  </button>
                  <button
                    className={styles.shareBtn}
                    onClick={() => {
                      setShowAddUpdate(true);
                      setActiveTab("updates");
                      setTimeout(() => {
                        tabContentRef.current?.scrollIntoView({ behavior: "smooth" });
                      }, 100);
                    }}
                  >
                    Add Update
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="row mt-4">
            <div className="col-12">
              <div className={styles.tabBar}>
                <button className={activeTab === "about" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("about")}>About</button>
                <button className={activeTab === "updates" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("updates")}>Updates</button>
                <button className={activeTab === "donations" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("donations")}>Donations</button>
                <button className={activeTab === "withdraw" ? styles.activeTab : styles.tab} onClick={() => setActiveTab("withdraw")}>Withdraw</button>
              </div>
              <div ref={tabContentRef}>{renderTabPanel()}</div>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ManageCampaign;