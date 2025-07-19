import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import { Input, Card, message, Row, Col, Table, Button, Tag, Typography, Space } from "antd";
import { SwapOutlined, DollarOutlined, UploadOutlined, CheckCircleTwoTone, ClockCircleTwoTone } from "@ant-design/icons";
import Swal from 'sweetalert2';
import CampaignABI from "../constants/CampaignABI";
import styles from "../styles/WithdrawPanel.module.css";
import moment from "moment";

const { Text } = Typography;

export default function WithdrawPanel({ campaignAddress, campaignType, ethToMYR }) {
  // For Flexible
  const [availableEth, setAvailableEth] = useState(0);
  const [availableMYR, setAvailableMYR] = useState(0);
  const [inputAmountMYR, setInputAmountMYR] = useState("");
  const [inputAmountETH, setInputAmountETH] = useState("");
  const [withdrawing, setWithdrawing] = useState(false);

  // For Milestone/Recurring/AllOrNothing
  const [milestones, setMilestones] = useState([]);
  const [milestoneLoading, setMilestoneLoading] = useState(false);
  const [cap, setCap] = useState(0);
  const [period, setPeriod] = useState(0);
  const [lastWithdraw, setLastWithdraw] = useState(0);
  const [deadline, setDeadline] = useState(0);
  const [now, setNow] = useState(Date.now() / 1000);

  // Recurring specific
  const [inputAmountMYRRecurring, setInputAmountMYRRecurring] = useState("");
  const [inputAmountETHRecurring, setInputAmountETHRecurring] = useState("");
  const [justWithdrewRecurring, setJustWithdrewRecurring] = useState(false);

  // Time Limit specific (All Or Nothing)
  const [totalDonated, setTotalDonated] = useState(0);
  const [goalAmount, setGoalAmount] = useState(0);
  const [claimed, setClaimed] = useState(false);

  // Time update
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now() / 1000), 5000);
    return () => clearInterval(timer);
  }, []);
  useEffect(() => {
    setNow(Date.now() / 1000);
  }, [campaignAddress, campaignType]);

  // Recurring: sync MYR to ETH
  useEffect(() => {
    if (inputAmountMYRRecurring && ethToMYR) {
      const ethVal = (parseFloat(inputAmountMYRRecurring) / ethToMYR).toFixed(6);
      setInputAmountETHRecurring(isNaN(ethVal) ? "" : ethVal);
    } else {
      setInputAmountETHRecurring("");
    }
  }, [inputAmountMYRRecurring, ethToMYR]);

  // --- Fetch contract data ---
  useEffect(() => {
    if (!campaignAddress) return;
    if (campaignType === 0) fetchFlexibleBalance();
    fetchContractExtras();
    // eslint-disable-next-line
  }, [campaignAddress, campaignType, ethToMYR]);

  // --- Fetch balance ---
  const fetchFlexibleBalance = async () => {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
    const balanceWei = await provider.getBalance(campaignAddress);
    const eth = Number(ethers.utils.formatEther(balanceWei));
    setAvailableEth(eth);
    setAvailableMYR(ethToMYR ? eth * ethToMYR : 0);
  };

  const fetchContractExtras = async () => {
    const provider = new ethers.providers.JsonRpcProvider("http://127.0.0.1:7545");
    const contract = new ethers.Contract(campaignAddress, CampaignABI, provider);
    if (campaignType === 1) {
      // Milestone
      setMilestoneLoading(true);
      let arr = [];
      for (let i = 0; i < 10; ++i) {
        try {
          const m = await contract.milestones(i);
          if (!m.name) break;
          arr.push({
            index: i,
            name: m.name,
            description: m.description,
            amount: Number(ethers.utils.formatEther(m.amount)),
            released: m.released,
          });
        } catch {
          break;
        }
      }
      setMilestones(arr);
      setMilestoneLoading(false);
      fetchFlexibleBalance();
    }
    if (campaignType === 2) {
      // Recurring
      setCap(Number(ethers.utils.formatEther(await contract.recurringWithdrawCap())));
      setPeriod(Number(await contract.recurringPeriod()));
      const last = Number(await contract.lastWithdrawTime());
      setLastWithdraw(last);
      fetchFlexibleBalance();
    }
    if (campaignType === 3) {
      // All Or Nothing
      try {
        const deadlineVal = Number(await contract.deadline());
        setDeadline(deadlineVal);

        const totalDonatedWei = await contract.totalDonated();
        setTotalDonated(Number(ethers.utils.formatEther(totalDonatedWei)));

        const goal = await contract.goalAmount();
        setGoalAmount(Number(ethers.utils.formatEther(goal)));

        const claimedVal = await contract.fundsClaimed();
        setClaimed(claimedVal);

        await fetchFlexibleBalance();
      } catch (err) {
        console.error("Could not fetch AllOrNothing extras:", err);
      }
    }
  };

  const formatSeconds = (s) => {
    if (!s) return "N/A";
    const d = Math.floor(s / 86400);
    const h = Math.floor((s % 86400) / 3600);
    return `${d ? d + "d " : ""}${h ? h + "h" : ""}`;
  };

  // ---- Handlers ----
  // Flexible: When MYR input changes, update ETH
  const handleMYRChange = (e) => {
    const val = e.target.value;
    setInputAmountMYR(val);
    if (!isNaN(val) && ethToMYR && parseFloat(val) >= 0) {
      setInputAmountETH((parseFloat(val) / ethToMYR).toFixed(6));
    } else {
      setInputAmountETH("");
    }
  };

  const handleWithdrawAll = () => {
    const maxMYR = Math.floor(availableMYR * 100) / 100;
    const maxETH = Math.floor(availableEth * 1e6) / 1e6;
    setInputAmountMYR(maxMYR.toFixed(2));
    setInputAmountETH(maxETH.toFixed(6));
  };

  // Flexible Withdraw
  async function handleFlexibleWithdraw() {
    if (!window.ethereum) return message.error("MetaMask not found.");
    if (!inputAmountETH || isNaN(inputAmountETH) || parseFloat(inputAmountETH) <= 0) {
      return message.error("Invalid amount.");
    }
    if (parseFloat(inputAmountETH) > availableEth) {
      return message.error("Amount exceeds available balance.");
    }
    setWithdrawing(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, CampaignABI, signer);
      const tx = await contract.withdrawFlexible(ethers.utils.parseEther(inputAmountETH));
      await tx.wait();
      await Swal.fire({
        icon: "success",
        title: "Withdrawal successful!",
        confirmButtonColor: "#4BB543"
      });
      setInputAmountMYR("");
      setInputAmountETH("");
      await fetchFlexibleBalance();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Withdrawal failed.",
        text: err?.reason || err?.message || "",
        confirmButtonColor: "#FF416C"
      });
    }
    setWithdrawing(false);
  }

  // Milestone Withdraw
  async function handleMilestoneRelease(idx) {
    setWithdrawing(true);
    try {
      if (!window.ethereum) return message.error("MetaMask not found.");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, CampaignABI, signer);
      const tx = await contract.releaseMilestone(idx, "");
      await tx.wait();
      await Swal.fire({
        icon: "success",
        title: "Milestone released!",
        confirmButtonColor: "#4BB543"
      });
      fetchContractExtras();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Release failed.",
        text: err?.reason || err?.message || "",
        confirmButtonColor: "#FF416C"
      })
    }
    setWithdrawing(false);
  }

  // Recurring: MYR input changes, update state
  const handleMYRRecurringChange = (e) => {
    setInputAmountMYRRecurring(e.target.value);
    setJustWithdrewRecurring(false);
  };

  // Recurring: Withdraw All
  function floorToN(num, n) {
    return Math.floor(num * Math.pow(10, n)) / Math.pow(10, n);
  }
  const handleWithdrawAllRecurring = () => {
    const maxEth = Math.min(cap, availableEth);
    const safeEth = floorToN(maxEth, 6);
    const myr = ethToMYR ? safeEth * ethToMYR : 0;
    setInputAmountMYRRecurring(myr.toFixed(2));
    setInputAmountETHRecurring(safeEth.toFixed(6));
    setJustWithdrewRecurring(false);
  };

  // Recurring Withdraw
  async function handleRecurringWithdraw() {
    if (!window.ethereum) return message.error("MetaMask not found.");
    if (!inputAmountETHRecurring || isNaN(inputAmountETHRecurring) || parseFloat(inputAmountETHRecurring) <= 0) {
      return message.error("Invalid amount.");
    }
    if (parseFloat(inputAmountETHRecurring) > cap || parseFloat(inputAmountETHRecurring) > availableEth) {
      return message.error("Amount exceeds cap or available balance.");
    }
    setWithdrawing(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, CampaignABI, signer);
      const tx = await contract.withdrawRecurring(ethers.utils.parseEther(inputAmountETHRecurring));
      await tx.wait();
      await Swal.fire({
        icon: "success",
        title: "Withdrawal successful!",
        confirmButtonColor: "#4BB543"
      });
      setInputAmountMYRRecurring("");
      setInputAmountETHRecurring("");
      setJustWithdrewRecurring(true);
      fetchContractExtras();
      fetchFlexibleBalance();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Withdrawal failed.",
        text: err?.reason || err?.message || "",
        confirmButtonColor: "#FF416C"
      });
    }
    setWithdrawing(false);
  }

  // AllOrNothing Claim
  async function handleAllOrNothingClaim() {
    if (!window.ethereum) return message.error("MetaMask not found.");
    setWithdrawing(true);
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(campaignAddress, CampaignABI, signer);
      const tx = await contract.claimAllOrNothing();
      await tx.wait();
      await Swal.fire({
        icon: "success",
        title: "Withdrawal successful!",
        confirmButtonColor: "#4BB543"
      });
      setClaimed(true);
      fetchContractExtras();
    } catch (err) {
      await Swal.fire({
        icon: "error",
        title: "Withdrawal failed.",
        text: err?.reason || err?.message || "",
        confirmButtonColor: "#FF416C"
      });
    }
    setWithdrawing(false);
  }

  // ---- UI Render ----

  // FLEXIBLE
  if (campaignType === 0) {
    const myrNum = parseFloat(inputAmountMYR);
    const isInvalid =
      !inputAmountETH ||
      isNaN(inputAmountETH) ||
      parseFloat(inputAmountETH) <= 0 ||
      myrNum > availableMYR + 0.01;

    return (
      <Card
        title={
          <>
            <SwapOutlined /> Campaign Withdrawal
          </>
        }
        style={{
          maxWidth: 420,
          margin: "32px auto 0",
          borderRadius: 18,
          boxShadow: "0 2px 12px 0 rgba(60,72,88,0.09)",
        }}
      >
        <div style={{ marginBottom: 16 }}>
          <Row align="middle" justify="space-between" style={{ marginBottom: 5 }}>
            <Col>
              <span style={{ color: "#888", fontWeight: 500, fontSize: 15 }}>
                <DollarOutlined style={{ marginRight: 6, color: "#388e3c" }} />
                <span style={{ fontWeight: 700, color: "#222" }}>
                  Available: {availableEth.toFixed(6)} ETH
                </span>
                <span style={{ color: "#48b", fontWeight: 600, marginLeft: 8 }}>
                  (RM {availableMYR.toLocaleString(undefined, { minimumFractionDigits: 2 })})
                </span>
              </span>
            </Col>
          </Row>
          <label className="mb-1 text-muted" style={{ fontWeight: 600 }}>
            Withdraw Amount (MYR):
          </label>
          <Input
            type="number"
            min={0}
            step={0.01}
            value={inputAmountMYR}
            onChange={handleMYRChange}
            style={{ width: "100%", marginTop: 6 }}
            placeholder="e.g. 250.00"
            suffix="MYR"
            disabled={withdrawing}
          />
          <div
            style={{
              fontSize: 15,
              marginTop: 7,
              color: "#13b28b",
              fontWeight: 500,
            }}
          >
            {inputAmountMYR && ethToMYR && !isNaN(inputAmountMYR)
              ? `≈ ${inputAmountETH} ETH`
              : "ETH equivalent will appear here"}
          </div>
          {myrNum > availableMYR + 0.01 && (
            <div
              style={{
                color: "#ef4444",
                fontWeight: 500,
                marginTop: 4,
                fontSize: 14,
              }}
            >
              Amount exceeds available balance.
            </div>
          )}
        </div>
        <button
          className={styles.primaryBtn}
          disabled={isInvalid || withdrawing}
          onClick={handleFlexibleWithdraw}
        >
          {withdrawing ? "Processing..." : "Withdraw"}
        </button>

        <button
          className={styles.outlineBtn}
          disabled={availableEth === 0 || withdrawing}
          onClick={handleWithdrawAll}
        >
          Withdraw All
        </button>
      </Card>
    );
  }

  // MILESTONE
  if (campaignType === 1) {
    const firstUnreleasedIdx = milestones.findIndex((m) => !m.released);

    const canRelease = (idx, amount) =>
      idx === firstUnreleasedIdx && availableEth >= amount;

    const columns = [
      {
        title: "Name",
        dataIndex: "name",
        key: "name",
        render: (text) => <strong>{text}</strong>,
      },
      {
        title: "Description",
        dataIndex: "description",
        key: "description",
        render: (text) => <span style={{ fontSize: 15 }}>{text}</span>,
      },
      {
        title: "Amount",
        dataIndex: "amount",
        key: "amount",
        render: (amount) => (
          <>
            {amount.toFixed(4)} ETH
            <br />
            <span className="text-muted">
              RM
              {(amount * ethToMYR).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </span>
          </>
        ),
      },
      {
        title: "Status",
        dataIndex: "released",
        key: "released",
        render: (released) =>
          released ? (
            <Tag icon={<CheckCircleTwoTone twoToneColor="#52c41a" />} color="success">
              Released
            </Tag>
          ) : (
            <Tag icon={<ClockCircleTwoTone twoToneColor="#faad14" />} color="warning">
              Pending
            </Tag>
          ),
      },
      {
        title: "Action",
        key: "action",
        render: (_, record) =>
          !record.released && (
            <Button
              type="primary"
              icon={<UploadOutlined />}
              loading={withdrawing}
              disabled={!canRelease(record.index, record.amount) || withdrawing}
              onClick={() => handleMilestoneRelease(record.index)}
            >
              Release
            </Button>
          ),
      },
    ];

    return (
      <div style={{ padding: 16 }}>
        <h5 style={{ marginBottom: 20 }}>Campaign Withdrawal</h5>
        <div style={{ marginBottom: 16 }}>
          <Tag color="blue" style={{ fontSize: 16 }}>
            Available Balance: {availableEth.toFixed(4)} ETH
            <span style={{ color: "#999", marginLeft: 10 }}>
              (RM{" "}
              {(availableEth * ethToMYR).toLocaleString(undefined, {
                minimumFractionDigits: 2,
              })}
              )
            </span>
          </Tag>
        </div>
        <Table
          columns={columns}
          dataSource={milestones.map((m, i) => ({ ...m, key: m.index }))}
          loading={milestoneLoading}
          pagination={false}
          size="middle"
          bordered
        />
        <div style={{ marginTop: 16, color: "#faad14" }}>
          * Only the next milestone is enabled, and only if there’s enough ETH.
        </div>
      </div>
    );
  }

  // RECURRING
  if (campaignType === 2) {
    const nextAvailable = lastWithdraw + period;
    const canWithdraw = now >= nextAvailable;
    const ethAmount = parseFloat(inputAmountETHRecurring || "0");
    const isInvalid =
      !inputAmountETHRecurring ||
      isNaN(inputAmountETHRecurring) ||
      ethAmount <= 0 ||
      ethAmount > cap ||
      ethAmount > availableEth;
    const withdrawDisabled =
      isInvalid || withdrawing || !canWithdraw || justWithdrewRecurring;

    let nextDateStr = "";
    if (nextAvailable && nextAvailable > now) {
      nextDateStr = moment.unix(nextAvailable).format("YYYY-MM-DD HH:mm");
    }

    return (
      <Card
        title={
          <>
            <SwapOutlined /> Campaign Withdrawal
          </>
        }
        style={{
          maxWidth: 420,
          margin: "32px auto 0",
          borderRadius: 18,
          boxShadow: "0 2px 12px 0 rgba(60,72,88,0.09)",
        }}
      >
        <div style={{ marginBottom: 9 }}>
          <Row align="middle" style={{ marginBottom: 2 }}>
            <Col>
              <span style={{ color: "#444", fontWeight: 500 }}>
                <b>Cap per period:</b> {cap.toFixed(6)} ETH
                <span style={{ color: "#888", marginLeft: 8 }}>
                  (RM
                  {(cap * ethToMYR).toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                  )
                </span>
              </span>
            </Col>
          </Row>
          <Row style={{ marginBottom: 2 }}>
            <Col>
              <span style={{ color: "#444", fontWeight: 500 }}>
                <b>Available:</b> {availableEth.toFixed(6)} ETH
                <span style={{ color: "#888", marginLeft: 8 }}>
                  (RM
                  {availableMYR.toLocaleString(undefined, {
                    minimumFractionDigits: 2,
                  })}
                  )
                </span>
              </span>
            </Col>
          </Row>
          <div style={{ marginBottom: 4 }}>
            <Tag color="blue" style={{ marginRight: 8 }}>
              Period: {formatSeconds(period)}
            </Tag>
            <Tag color="default">
              Last: {lastWithdraw ? moment.unix(lastWithdraw).fromNow() : "Never"}
            </Tag>
          </div>
          <Tag color="default" style={{ marginBottom: 8 }}>
            <b>Next available:</b>{" "}
            {canWithdraw ? (
              <span style={{ color: "#22c55e" }}>Now</span>
            ) : nextDateStr ? (
              <span style={{ color: "#999" }}>{nextDateStr}</span>
            ) : (
              "-"
            )}
          </Tag>
          <div>
            <label style={{ fontWeight: 600 }}>Withdraw Amount (MYR):</label>
            <Input
              type="number"
              min={0}
              step={0.01}
              value={inputAmountMYRRecurring}
              onChange={handleMYRRecurringChange}
              style={{ width: "100%", marginTop: 6 }}
              placeholder="e.g. 2000.00"
              suffix="MYR"
              disabled={withdrawing || justWithdrewRecurring}
            />
            <div
              style={{
                fontSize: 15,
                color: "#13b28b",
                fontWeight: 500,
                marginTop: 5,
              }}
            >
              {inputAmountMYRRecurring && ethToMYR && !isNaN(inputAmountMYRRecurring)
                ? `≈ ${inputAmountETHRecurring} ETH`
                : "ETH equivalent will appear here"}
            </div>
            {(ethAmount > cap || ethAmount > availableEth) && (
              <div
                style={{
                  color: "#ef4444",
                  fontWeight: 500,
                  marginTop: 2,
                  fontSize: 14,
                }}
              >
                Amount exceeds cap or available balance.
              </div>
            )}
          </div>
          <button
            className={styles.primaryBtn}
            style={{
              marginTop: 13,
              backgroundColor: withdrawDisabled ? "#bbb" : "#ff3a55",
              color: withdrawDisabled ? "#fff" : undefined,
              border: "none",
              cursor: withdrawDisabled ? "not-allowed" : "pointer",
            }}
            disabled={withdrawDisabled}
            onClick={handleRecurringWithdraw}
          >
            {justWithdrewRecurring
              ? `Withdrawn!`
              : withdrawing
              ? "Processing..."
              : "Withdraw"}
          </button>
          <button
            className={styles.outlineBtn}
            disabled={withdrawing || !canWithdraw || availableEth === 0 || justWithdrewRecurring}
            onClick={handleWithdrawAllRecurring}
          >
            Withdraw All
          </button>
          {justWithdrewRecurring && nextDateStr && (
            <div style={{ color: "#888", fontWeight: 500, marginTop: 11 }}>
              Next withdrawal available: <b>{nextDateStr}</b>
            </div>
          )}
          {!canWithdraw && (
            <div
              className="text-warning mt-2"
              style={{ marginTop: 9, color: "#faad14" }}
            >
              Withdrawal only allowed after the period ends.
            </div>
          )}
        </div>
      </Card>
    );
  }

  // ALL OR NOTHING
  if (campaignType === 3) {
    const isAfterDeadline = now >= deadline;
    const goalMet = totalDonated >= goalAmount && goalAmount > 0;
    const canClaim = isAfterDeadline && goalMet && !claimed;

    return (
      <Card
        title={
          <>
            <SwapOutlined /> Campaign Withdrawal
          </>
        }
        style={{
          maxWidth: 420,
          margin: "32px auto 0",
          borderRadius: 18,
          boxShadow: "0 2px 12px 0 rgba(60,72,88,0.09)",
        }}
      >
        <Space direction="vertical" size="middle" style={{ width: "100%" }}>
          <Text>
            <b>Deadline:</b> {deadline ? moment.unix(deadline).format("YYYY-MM-DD HH:mm") : "-"}
          </Text>
          <Text>
            <b>Status:</b>{" "}
            {isAfterDeadline ? (
              goalMet ? (
                <Tag color="green">Completed (Goal Met)</Tag>
              ) : (
                <Tag color="error">Ended (Goal NOT Met)</Tag>
              )
            ) : (
              <Tag color="orange">Ongoing</Tag>
            )}
          </Text>
          <Text>
            <b>Goal:</b> {goalAmount} ETH
            <br />
            <b>Total Raised:</b> {totalDonated} ETH
          </Text>

          {canClaim ? (
            <Button
              type="primary"
              block
              size="large"
              disabled={withdrawing || claimed}
              loading={withdrawing}
              onClick={handleAllOrNothingClaim}
            >
              {claimed ? "Claimed!" : "Claim Funds"}
            </Button>
          ) : (
            <Text type={goalMet ? "success" : "warning"}>
              {isAfterDeadline
                ? goalMet
                  ? "You can claim now!"
                  : "Campaign ended but the fundraising goal was NOT reached. Funds are not claimable."
                : "You can only claim funds after the campaign deadline, and if the goal is reached."}
            </Text>
          )}

          {claimed && (
            <Text type="secondary" style={{ marginTop: 16 }}>
              You have claimed all funds for this campaign.
            </Text>
          )}
        </Space>
      </Card>
    );
  }

  return <div>Invalid campaign type.</div>;
}
