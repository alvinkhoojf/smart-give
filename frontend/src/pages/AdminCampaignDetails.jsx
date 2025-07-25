import React, { useEffect, useState } from "react";
import { ethers } from 'ethers';
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import moment from "moment";
import Swal from 'sweetalert2';
import CampaignABI from '../constants/CampaignABI';
import styles from "../styles/CampaignDetails.module.css";
import { Carousel, Progress, Spin, Modal, List, Descriptions, Typography, message } from "antd";
import { ReloadOutlined } from "@ant-design/icons";

const { Title, Paragraph, Text } = Typography;

const CAMPAIGN_TYPE_LABELS = [
  "Flexible",
  "Milestone",
  "Recurring",
  "All Or Nothing"
];

const PERIOD_LABELS = {
  2592000: "Monthly",
  7776000: "Quarterly",
  31104000: "Yearly"
};

const MAX_MILESTONES = 10;
const THEME = "#FF416C";

const AdminCampaignDetails = () => {
  const { address: campaignAddress } = useParams();
  const navigate = useNavigate();
  const [campaign, setCampaign] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creator, setCreator] = useState("");
  const [beneficiary, setBeneficiary] = useState("");
  const [goal, setGoal] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [campaignType, setCampaignType] = useState(0);
  const [deadline, setDeadline] = useState(null);
  const [recurringWithdrawCap, setRecurringWithdrawCap] = useState(null);
  const [recurringPeriod, setRecurringPeriod] = useState(null);
  const [milestones, setMilestones] = useState([]);
  const [activeTab, setActiveTab] = useState("about");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updates, setUpdates] = useState([]);
  const [ethToMYR, setEthToMYR] = useState(0);
  const [totalRaisedMYR, setTotalRaisedMYR] = useState(0);
  const [goalMYR, setGoalMYR] = useState(0);  
  const [donations, setDonations] = useState([]);
  const [donationsLoading, setDonationsLoading] = useState(false);
  const USER = { name: "Admin" };

  // ------------- Fetch Smart Contract Info -------------
  useEffect(() => {
    const fetchContractInfo = async () => {
      if (!campaignAddress) return;
      try {
        const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
        const contract = new ethers.Contract(campaignAddress, CampaignABI, provider);
        const [
          goalAmount,
          totalDonated,
          ngoAddress,
          beneficiaryAddress,
          type,
          deadlineVal,
          recurringCap,
          recurringPeriodVal
        ] = await Promise.all([
          contract.goalAmount(),
          contract.totalDonated(),
          contract.ngo(),
          contract.beneficiary(),
          contract.campaignType(),
          contract.deadline().catch(() => 0),
          contract.recurringWithdrawCap().catch(() => 0),
          contract.recurringPeriod().catch(() => 0)
        ]);
        setGoal(Number(ethers.utils.formatEther(goalAmount)));
        setTotalRaised(Number(ethers.utils.formatEther(totalDonated)));
        setCreator(ngoAddress);
        setBeneficiary(beneficiaryAddress);
        setCampaignType(Number(type));
        setDeadline(Number(deadlineVal));
        setRecurringWithdrawCap(Number(ethers.utils.formatEther(recurringCap)));
        setRecurringPeriod(Number(recurringPeriodVal));

        if (Number(type) === 1) {
          let milestoneArr = [];
          for (let i = 0; i < MAX_MILESTONES; ++i) {
            try {
              const m = await contract.milestones(i);
              if (!m.name) break;
              milestoneArr.push({
                name: m.name,
                description: m.description,
                amount: Number(ethers.utils.formatEther(m.amount)),
                released: m.released
              });
            } catch (e) {
              break; 
            }
          }
          setMilestones(milestoneArr);
        } else {
          setMilestones([]);
        }
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
      } catch (err) {
        message.error("Failed to load campaign details");
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

  // ------------- Approve / Reject Handlers -------------
  const handleApprove = async () => {
    try {
      await axios.put(`http://localhost:5000/api/admin/campaign/${campaignAddress}/verify`);
      await Swal.fire({
        icon: 'success',
        title: 'Campaign approved!',
        confirmButtonColor: '#4BB543'
      });
      navigate("/admin"); 
    } catch {
      message.error("Failed to approve campaign");
    }
  };

  const handleReject = async () => {
    try {
      await axios.put(`http://localhost:5000/api/campaign/${campaign.id}/status`, { status: "rejected" });
      message.success("Campaign rejected.");
      await Swal.fire({
        icon: 'success',
        title: 'Campaign rejected.',
        confirmButtonColor: '#FF416C'
      });
    } catch {
      await Swal.fire({
        icon: 'error',
        title: 'Failed to reject campaign',
        confirmButtonColor: '#d33'
      });
    }
  };

  if (loading) return <div><Spin /> Loading...</div>;
  if (!campaign) return <div>Campaign not found.</div>;

  const donors = campaign.total_donations || 0;

  let images = [];
  if (campaign.images) {
    try {
      images = typeof campaign.images === "string"
        ? JSON.parse(campaign.images)
        : campaign.images;
    } catch {}
  }

  const percent = goalMYR > 0 ? (totalRaisedMYR / goalMYR) * 100 : 0;

  // --- Campaign type-specific info (for modal) ---
  function renderCampaignTypeInfo() {
    if (campaignType === 1 && milestones.length > 0) {
      // Milestone
      return (
         <div style={{ padding: 20, marginBottom: 200 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            Milestones
          </Title>
          <Paragraph>
            Funds are released upon reaching specific project milestones. Below are the details:
          </Paragraph>
          <List
            bordered
            dataSource={milestones}
            renderItem={(item, idx) => (
              <List.Item>
                <Descriptions size="small" column={1} style={{ width: "100%" }}>
                  <Descriptions.Item label={<Text strong>Name</Text>}>
                    {item.name}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Text strong>Description</Text>}>
                    {item.description}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Text strong>Amount (RM)</Text>}>
                    RM {(item.amount * ethToMYR).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </Descriptions.Item>
                  <Descriptions.Item label={<Text strong>Status</Text>}>
                    {item.released ? (
                      <Text type="success">Released</Text>
                    ) : (
                      <Text type="warning">Pending</Text>
                    )}
                  </Descriptions.Item>
                </Descriptions>
              </List.Item>
            )}
          />
        </div>
      );
    }
    if (campaignType === 2) {
      // Recurring
      return (
        <div style={{ padding: 20 }}>
          <Title level={4} style={{ marginBottom: 16 }}>
            Recurring Withdrawal
          </Title>
          <Paragraph>
            This campaign allows withdrawals of a fixed amount every period.
          </Paragraph>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label={<Text strong>Withdraw Cap (RM)</Text>}>
              RM {(recurringWithdrawCap * ethToMYR).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </Descriptions.Item>
            <Descriptions.Item label={<Text strong>Withdraw Period</Text>}>
              {PERIOD_LABELS[recurringPeriod] || `${recurringPeriod / 86400} days`}
              <ReloadOutlined style={{ marginLeft: 8, color: "#1890ff" }} />
            </Descriptions.Item>
          </Descriptions>
        </div>
      );
    }
    if (campaignType === 3) {
      // All Or Nothing (Time Limit)
      return (
        <div style={{ padding: 20 }}>
          <Title level={4}>All Or Nothing</Title>
          <Paragraph>
            Funds are only released if the goal is met by the deadline.
          </Paragraph>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="Deadline">
              <Text type={deadline && (Date.now() / 1000 > deadline) ? "danger" : undefined}>
                {deadline ? new Date(deadline * 1000).toLocaleString() : "N/A"}
              </Text>
            </Descriptions.Item>
          </Descriptions>
        </div>
      );
    }
    // Flexible
    return (
      <div style={{ padding: 20 }}>
        <Title level={4}>Flexible Campaign</Title>
        <Paragraph>Funds can be withdrawn at any time by the NGO or beneficiary.</Paragraph>
      </div>
    );
  }

  // -- Tabs content --
  function renderTabPanel() {
    if (activeTab === "about") {
      return (
        <div className={styles.description} style={{ padding: 16 }}>
          <div dangerouslySetInnerHTML={{ __html: campaign.description }} />
        </div>
      );
    }
    if (activeTab === "updates") {
      return (
        <div className={styles.description} style={{ padding: 16 }}>
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
    return null;
  }

  // --- Status Badge Color ---
  function statusColor(status) {
    if (status === "verified") return "#4BB543";
    if (status === "rejected") return "#d9534f";
    return "#FFAE42";
  }

  return (
    <div>
      <nav
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "18px 36px",
          background: "#fff",
          borderBottom: "1px solid lightgrey"
        }}
      >
        <div style={{ fontWeight: 700, fontSize: 22, color: THEME }}>
          SmartGive
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 22 }}>
          <span style={{ color: "#444", fontWeight: 600 }}>
            {USER.name}
          </span>
          <button
            style={{
              padding: "7px 16px",
              background: "#f4f5f7",
              border: "none",
              borderRadius: 8,
              fontWeight: 500,
              color: "#7f8c8d",
              cursor: "pointer",
              transition: "background .2s",
            }}
            onClick={() => {
              // LOGOUT logic here
              window.location.href = "/logout";
            }}
          >
            Logout
          </button>
        </div>
      </nav>
      <div style={{ backgroundColor: '#f8f8f8', minHeight: '100vh', paddingTop: '60px' }}>
        <div className="container">
          {/* Header section */}
          <div className={styles.campaignHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <h1 className={styles.campaignTitle}>{campaign.title}</h1>
              <span style={{
                background: statusColor(campaign.status),
                color: "#fff",
                fontWeight: 700,
                borderRadius: 8,
                padding: "6px 18px",
                fontSize: 16,
                marginLeft: 10,
                letterSpacing: 1,
                display: "inline-block"
              }}>
                {campaign.status ? campaign.status.toUpperCase() : "PENDING"}
              </span>
            </div>
          </div>

          {/* Carousel and Details section */}
          <div className="row">
            <div className="col-md-8">
              <Carousel autoplay dotPosition="bottom" style={{ margin: "0 auto" }}>
                {images.length > 0 ? (
                  images.map((img, i) => (
                    <div key={i}>
                      <img
                        src={img.startsWith("http") ? img : "http://localhost:5000" + img}
                        alt={`Campaign visual ${i + 1}`}
                        style={{
                          width: "100%",
                          height: "530px",
                          objectFit: "cover",
                          borderRadius: 12,
                          display: "block"
                        }}
                      />
                    </div>
                  ))
                ) : (
                  <div style={{
                    width: "100%",
                    height: "530px",
                    background: "#f3f3f3",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: 12
                  }}>
                    No images
                  </div>
                )}
              </Carousel>
            </div>
            <div className="col-md-4">
              <div className={styles.campaignDetails}>
                <div className="row" style={{ marginBottom: "20px" }}>
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
                  <div className={styles.ngo}>
                    {campaign.ngo_username}
                  </div>
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
                    <img src="/images/information.png" alt="info" className={styles.infoBtn} style={{ cursor: "pointer" }} onClick={() => setIsModalOpen(true)}/>
                    <Modal
                      open={isModalOpen}
                      onCancel={() => setIsModalOpen(false)}
                      footer={null}
                    >
                      {renderCampaignTypeInfo()}
                    </Modal>
                  </div>
                </div>

                {/* ADMIN CONTROLS */}
                <div>
                  {campaign.status === "pending" && (
                    <>
                      <button
                        className={styles.donateBtn}
                        style={{ flex: 1 }}
                        onClick={handleApprove}
                      >
                        Approve
                      </button>
                      <button
                        className={styles.shareBtn}
                        style={{ flex: 1, background: "#fff", color: "#FF416C", border: "2px solid #FF416C" }}
                        onClick={handleReject}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {campaign.status === "verified" && (
                    <button className={styles.donateBtn} style={{ flex: 1, opacity: 0.7 }} disabled>Approved</button>
                  )}
                  {campaign.status === "rejected" && (
                    <button className={styles.shareBtn} style={{ flex: 1, opacity: 0.7 }} disabled>Rejected</button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Tabs Section (custom, not AntD) */}
          <div className="row mt-4">
            <div className="col-12">
              <div className={styles.tabBar}>
                <button
                  className={activeTab === "about" ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab("about")}
                >
                  About
                </button>
                <button
                  className={activeTab === "updates" ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab("updates")}
                >
                  Updates
                </button>
                <button
                  className={activeTab === "donations" ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab("donations")}
                >
                  Donations
                </button>
              </div>
              <div>{renderTabPanel()}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminCampaignDetails;
