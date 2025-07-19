import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import { Editor } from "@tinymce/tinymce-react";
import axios from "axios";
import Swal from 'sweetalert2';
import CampaignFactoryABI from "../constants/CampaignFactoryABI";
import Navbar from "../components/Navbar";
import Footer from '../components/Footer';
import styles from "../styles/Create.module.css";
import { Input, Select, Button, DatePicker, message, Upload, Modal, Card, Form } from "antd";
import { PlusOutlined } from "@ant-design/icons";
import moment from "moment";

const { Option } = Select;
const CAMPAIGN_FACTORY_ADDRESS = "0xc0a6eEB03bC26AAabB843184B26c86d47EDA0eFb";
const campaignTypeEnum = {
  Flexible: 0,
  Milestone: 1,
  Recurring: 2,
  AllOrNothing: 3,
};

export default function CreateCampaign() {
  const [formState, setFormState] = useState({
    title: "",
    description: "",
    type: "Flexible",
    goalAmount: "",
    deadline: "",
    milestones: [{ name: "", description: "", amount: "" }],
    recurringWithdrawCap: "",
    recurringPeriodUnit: "month",
    beneficiary: "",
  });

  const [user, setUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [ethToMYR, setEthToMYR] = useState(0);

  const [antdForm] = Form.useForm();

  // DnD Images
  const [fileList, setFileList] = useState([]);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewImage, setPreviewImage] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const handlePreview = async (file) => {
    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj);
    }
    setPreviewImage(file.url || file.preview);
    setPreviewOpen(true);
    setPreviewTitle(file.name || file.url.substring(file.url.lastIndexOf("/") + 1));
  };
  const handleChangeUpload = ({ fileList: newFileList }) => setFileList(newFileList);
  const beforeUpload = (file) => {
    const isImage = file.type.startsWith("image/");
    if (!isImage) {
      message.error("You can only upload image files!");
    }
    return isImage || Upload.LIST_IGNORE;
  };
  function getBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  }

  useEffect(() => {
    axios
      .get("http://localhost:5000/api/auth/me", { withCredentials: true })
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Only allow verified NGO/GO to create campaign
  const isNGOVerified =
    user?.role === "ngo or go" && user?.status === "verified";

  // Live sum for milestones
  const milestoneSum = formState.milestones
    .map(m => Number(m.amount) || 0)
    .reduce((a, b) => a + b, 0);

  // Update goal amount live for milestone campaigns
  useEffect(() => {
    if (formState.type === "Milestone") {
      setFormState(prev => ({
        ...prev,
        goalAmount: milestoneSum.toString()
      }));
      antdForm.setFieldsValue({ goalAmount: milestoneSum.toString() });
    }
    // eslint-disable-next-line
  }, [formState.milestones, formState.type]);

  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await axios.get("https://api.coinbase.com/v2/exchange-rates?currency=ETH");
        setEthToMYR(Number(res.data.data.rates.MYR));
      } catch (err) {
        setEthToMYR(0);
        message.error("Failed to fetch ETH/MYR rate. Please refresh.");
      }
    };
    fetchRate();
  }, []);

  // AntD Form Controlled Input Handlers
  const handleFieldChange = (changedValues, allValues) => {
    setFormState(prev => ({
      ...prev,
      ...allValues,
    }));
  };

  // Milestone handler
  const handleMilestoneChange = (i, field, value) => {
    const newMilestones = [...formState.milestones];
    newMilestones[i][field] = value;
    setFormState({ ...formState, milestones: newMilestones });
    antdForm.setFieldsValue({ milestones: newMilestones });
  };
  const addMilestone = () => {
    const newMilestones = [...formState.milestones, { name: "", description: "", amount: "" }];
    setFormState({ ...formState, milestones: newMilestones });
    antdForm.setFieldsValue({ milestones: newMilestones });
  };
  const removeMilestone = i => {
    const newMilestones = formState.milestones.filter((_, idx) => idx !== i);
    setFormState({ ...formState, milestones: newMilestones });
    antdForm.setFieldsValue({ milestones: newMilestones });
  };

  const tips = {
    title: {
      title: "Crafting a Catchy Campaign Title",
      bullets: [
        "Make it clear, concise, and inspiring.",
        "Avoid generic titles. Be specific about your mission.",
        "Example: 'Help Build a School for Rural Kids'.",
      ],
    },
    description: {
      title: "Describing Your Campaign",
      bullets: [
        "Tell an engaging story about your project—why should people care and donate?",
        "Be specific about your project's progress and goals. Use headers and paragraphs for readability.",
        "Include media such as videos and photos to show off your work.",
      ],
    },
    images: {
      title: "Choosing Great Campaign Images",
      bullets: [
        "Use real, high-quality images that represent your cause.",
        "Avoid blurry, generic, or irrelevant photos.",
        "Images should evoke emotion and trust.",
      ],
    },
    type: {
      title: "Selecting a Campaign Type",
      bullets: [
        "Pick the type that fits your fundraising needs.",
        "Read the description under each option for details.",
      ],
    },
    goal: {
      title: "Setting a Realistic Funding Goal",
      bullets: [
        "Base your goal on actual needs, not just wishes.",
        "Too high can discourage donors; too low might not cover costs.",
        "Be transparent about how funds will be used.",
      ],
    },
  };

  const [currentTip, setCurrentTip] = useState(tips.title);

  // --------- Submission Logic ----------
  const handleSubmit = async (values) => {
    setSubmitting(true);

    // --- Ensure milestones are present ---
    let milestones = values.milestones;
    if (values.type === "Milestone" && (!Array.isArray(milestones) || !milestones.length)) {
      milestones = formState.milestones;
    }

    // Calculate goalAmount for Milestone type
    let goalAmountStr = values.goalAmount;
    if (values.type === "Milestone") {
      goalAmountStr = (milestones || [])
        .map(ms => Number(ms.amount) || 0)
        .reduce((a, b) => a + b, 0)
        .toString();
    }

    try {
      if (!window.ethereum) throw new Error("Please install MetaMask!");
      if (!values.title?.trim()) throw new Error("Title is required.");
      if (!values.description?.trim() || values.description.length < 30) throw new Error("Description is too short.");

      if (values.type === "Milestone") {
        if (!milestones || !milestones.length) throw new Error("Please add at least one milestone.");
        for (const ms of milestones) {
          if (!ms.name || !ms.description || !ms.amount || Number(ms.amount) <= 0)
            throw new Error("All milestone fields are required and must be valid.");
        }
      } else if (!goalAmountStr || isNaN(goalAmountStr) || Number(goalAmountStr) <= 0) {
        throw new Error("Goal amount is required and must be greater than 0.");
      }
      if (values.type === "AllOrNothing" && !values.deadline) throw new Error("Deadline is required for Time Limit campaigns.");
      if (values.type === "Recurring") {
        if (!values.recurringWithdrawCap || Number(values.recurringWithdrawCap) <= 0)
          throw new Error("Recurring withdraw cap required.");
      }

      // === MYR -> ETH conversion ===
      if (!ethToMYR || ethToMYR <= 0) throw new Error("ETH/MYR exchange rate unavailable. Please refresh and try again.");

      // Convert goalAmount (MYR) to ETH
      const goalAmountETH = (Number(goalAmountStr) / ethToMYR).toString();
      const _goalAmount = ethers.utils.parseEther(goalAmountETH);

      // Convert milestone amounts (MYR) to ETH
      const milestoneAmounts = values.type === "Milestone"
        ? milestones.map(m =>
            ethers.utils.parseEther(((Number(m.amount) || 0) / ethToMYR).toString())
          )
        : [];

      // Convert recurringWithdrawCap (MYR) to ETH
      const recurringWithdrawCapETH =
        values.type === "Recurring"
          ? ethers.utils.parseEther((Number(values.recurringWithdrawCap) / ethToMYR).toString())
          : ethers.utils.parseEther("0");

      const provider = new ethers.providers.Web3Provider(window.ethereum);
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner();

      const factory = new ethers.Contract(
        CAMPAIGN_FACTORY_ADDRESS,
        CampaignFactoryABI,
        signer
      );

      let _deadline = 0;
      if (values.type === "AllOrNothing") {
        _deadline = Math.floor(new Date(values.deadline).getTime() / 1000);
      }

      const milestoneNames = values.type === "Milestone" ? milestones.map(m => m.name) : [];
      const milestoneDescriptions = values.type === "Milestone" ? milestones.map(m => m.description) : [];

      const periodMap = {
        month: 2592000,
        quarter: 2592000 * 3,
        year: 2592000 * 12
      };
      const recurringPeriodInSeconds =
        values.type === "Recurring"
          ? periodMap[values.recurringPeriodUnit]
          : 0;

      // Smart contract call
      const beneficiaryAddr =
        values.beneficiary && values.beneficiary.trim()
          ? values.beneficiary.trim()
          : user.wallet_address;

      const tx = await factory.createCampaign(
        user.wallet_address,
        beneficiaryAddr,
        values.title,
        values.description,
        _goalAmount,
        _deadline,
        campaignTypeEnum[values.type],
        milestoneNames,
        milestoneDescriptions,
        milestoneAmounts,
        recurringWithdrawCapETH,
        recurringPeriodInSeconds
      );
      await tx.wait();

      // ====== Backend Save After On-Chain Success ======
      const receipt = await tx.wait();
      let deployedAddress = null;
      for (const log of receipt.logs) {
        try {
          const parsed = factory.interface.parseLog(log);
          if (parsed.name === "CampaignCreated") {
            deployedAddress = parsed.args.campaignAddress;
            break;
          }
        } catch (e) {}
      }

      const formData = new FormData();
      formData.append('title', values.title);
      formData.append('description', values.description);
      formData.append('type', values.type);
      formData.append('goalAmount', goalAmountStr);

      if (values.type === "Milestone") {
        formData.append('milestones', JSON.stringify(milestones));
      }
      if (values.type === "Recurring") {
        formData.append('recurringWithdrawCap', values.recurringWithdrawCap);
        formData.append('recurringPeriodUnit', values.recurringPeriodUnit);
      }
      if (values.type === "AllOrNothing") {
        formData.append('deadline', values.deadline);
      }

      formData.append('ngo_username', user.org_username);
      formData.append('txHash', tx.hash);
      formData.append('contractAddress', deployedAddress);
      formData.append('status', 'pending');
      formData.append('createdAt', new Date().toISOString());

      // Append images as files
      fileList.forEach((f) => {
        if (f.originFileObj) {
          formData.append('images', f.originFileObj);
        }
      });

      console.log("Sending FormData to backend:", formData);

      try {
        await axios.post('http://localhost:5000/api/campaign', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
          withCredentials: true,
        });
        await Swal.fire({
          icon: 'success',
          title: 'Campaign Submitted!',
          text: 'Your campaign is pending admin review.',
          confirmButtonColor: '#3085d6'
        });

        antdForm.resetFields();
        antdForm.setFieldsValue({
          title: "",
          description: "",
          type: "Flexible",
          goalAmount: "",
          deadline: "",
          milestones: [{ name: "", description: "", amount: "" }],
          recurringWithdrawCap: "",
          recurringPeriodUnit: "month",
          beneficiary: "",
        });
        setFormState({
          title: "",
          description: "",
          type: "Flexible",
          goalAmount: "",
          deadline: "",
          milestones: [{ name: "", description: "", amount: "" }],
          recurringWithdrawCap: "",
          recurringPeriodUnit: "month",
          beneficiary: "",
        });
        setFileList([]);

      } catch (backendError) {
        console.error("Backend error:", backendError);
        await Swal.fire({
          icon: 'warning',
          title: 'Something went wrong',
          text: backendError.response?.data?.message || 'Please try again later.',
          confirmButtonColor: '#faad14'
        });
      }
      // =================================================

    } catch (err) {
      await Swal.fire({
        icon: 'error',
        title: 'Error',
        text: err.message || String(err),
        confirmButtonColor: '#d33'
      });
    }
    setSubmitting(false);
  };

  // Reset handler for Cancel
  const handleCancelClick = () => {
    antdForm.resetFields();
    setFormState({
      title: "",
      description: "",
      type: "Flexible",
      goalAmount: "",
      deadline: "",
      milestones: [{ name: "", description: "", amount: "" }],
      recurringWithdrawCap: "",
      recurringPeriodUnit: "month",
    });
    setFileList([]);
  };

  if (loading)
    return (
      <div>
        <Navbar />
        <p>Loading...</p>
      </div>
    );
  if (!user)
    return (
      <div>
        <Navbar />
        <p>Please log in to create a campaign.</p>
      </div>
    );
  if (!isNGOVerified) {
    return (
      <div>
        <Navbar />
        <div className="container mt-5">
          <div className="alert alert-warning">
            Only <b>verified NGOs</b> can create a campaign.<br />
            {user?.status === "pending" && <>Your verification is <b>pending</b>.</>}
            {user?.status === "rejected" && <>Your NGO application was <b>rejected</b>.</>}
          </div>
        </div>
      </div>
    );
  }

  // ----- Form Render -----
  return (
    <div>
      <Navbar />
      <div style={{ backgroundColor: "#f8f8f8", minHeight: "100vh", paddingTop: '40px', paddingBottom: '200px' }}>
        <div className="container" style={{ marginBottom: 50 }}>
          <h1 className={styles.title}>Create a Campaign</h1>
        </div>
        <div className={styles.containerFlex} style={{ display: "flex", gap: 30, maxWidth: 1300, margin: "0 auto" }}>
          <div style={{ flex: 3 }}>
            <Form
              form={antdForm}
              layout="vertical"
              className={styles.formContainer}
              onFinish={handleSubmit}
              initialValues={formState}
              onValuesChange={handleFieldChange}
              requiredMark={true}
            >
              <Form.Item
                label="Campaign Name"
                name="title"
                rules={[{ required: true, message: 'Campaign title is required.' }]}
                onMouseEnter={() => setCurrentTip(tips.title)}
              >
                <Input
                  size="large"
                  className={styles.campaignInput}
                  placeholder="Campaign Name"
                  autoComplete="off"
                />
              </Form.Item>
              <p className={styles.subTitle}>Tell us more about your campaign...</p>
              <p className={styles.descHint}>Provide at least <span>1200 characters</span> of text in your project description.</p>
              <Form.Item
                label="Campaign Details"
                name="description"
                rules={[
                  { required: true, message: 'Campaign description is required.' },
                  { min: 30, message: "Description should be at least 30 characters." }
                ]}
                onMouseEnter={() => setCurrentTip(tips.description)}
              >
                <div className={styles.editorContainer}>
                  <Editor
                    apiKey="p7psf0kbend8wjl3e3r3xrajqjspig5wq4oslq752ehu4z23"
                    value={formState.description}
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
                    onEditorChange={(content) => {
                      setFormState(f => ({ ...f, description: content }));
                      antdForm.setFieldsValue({ description: content });
                    }}
                  />
                </div>
              </Form.Item>
              <p className={styles.subTitle}>Add images to your campaign</p>
              <p className={styles.descHint}>Images makes your campaign more trustworthy.</p>
              <Form.Item label="Campaign Images" onMouseEnter={() => setCurrentTip(tips.images)}>
                <Upload.Dragger
                  name="campaignImages"
                  listType="picture-card"
                  fileList={fileList}
                  onPreview={handlePreview}
                  onChange={handleChangeUpload}
                  beforeUpload={beforeUpload}
                  multiple
                  accept="image/*"
                  maxCount={5}
                  style={{ marginBottom: 32 }}
                >
                  <p className="ant-upload-drag-icon">
                    <PlusOutlined style={{ color: "#FF416C"}}/>
                  </p>
                  <p className="ant-upload-text">Click or drag image(s) to this area to upload</p>
                  <p className="ant-upload-hint">Support for PNG, JPG, JPEG, GIF. (Max 5 images)</p>
                </Upload.Dragger>
                <Modal open={previewOpen} title={previewTitle} footer={null} onCancel={() => setPreviewOpen(false)}>
                  <img alt="preview" style={{ width: "100%" }} src={previewImage} />
                </Modal>
              </Form.Item>
              <p className={styles.subTitle}>Choose your campaign type</p>
              <p className={styles.descHint}>Select a cmapaign type that is the msot suitable</p>
              <Form.Item
                label="Campaign Type"
                name="type"
                rules={[{ required: true, message: 'Please select a campaign type.' }]}
                onMouseEnter={() => setCurrentTip(tips.type)}
              >
                <Select
                  size="large"
                  className={styles.campaignSelect}
                  style={{ width: '100%', marginBottom: 16 }}
                  placeholder="Choose campaign type"
                  optionLabelProp="label"
                >
                  <Option value="Flexible" label={<span>Flexible</span>}>
                    <div>
                      <strong>Flexible</strong>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        Receive donations as they come in. No minimum goal required.
                      </div>
                    </div>
                  </Option>
                  <Option value="Milestone" label={<span>Milestone</span>}>
                    <div>
                      <strong>Milestone</strong>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        Funds are released upon reaching specific project milestones.
                      </div>
                    </div>
                  </Option>
                  <Option value="Recurring" label={<span>Recurring</span>}>
                    <div>
                      <strong>Recurring</strong>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        Withdraw a fixed amount every period.
                      </div>
                    </div>
                  </Option>
                  <Option value="AllOrNothing" label={<span>Time Limit</span>}>
                    <div>
                      <strong>Time Limit</strong>
                      <div style={{ fontSize: 13, color: "#888" }}>
                        Only receive funds if the goal is met before the deadline.
                      </div>
                    </div>
                  </Option>
                </Select>
              </Form.Item>

              <Form.Item
                label="Goal Amount (MYR)"
                name="goalAmount"
                rules={
                  antdForm.getFieldValue("type") === "Milestone"
                    ? [] // No manual entry or validation for Milestone, handled below
                    : [
                        { required: true, message: "Goal amount is required." },
                        { pattern: /^[1-9]\d*(\.\d{1,2})?$/, message: "Goal amount must be a valid number greater than 0." }
                      ]
                }
                onMouseEnter={() => setCurrentTip(tips.goal)}
              >
                <Input
                  size="large"
                  type="number"
                  min={0}
                  step="any"
                  addonBefore="RM"
                  style={{ marginBottom: 16 }}
                  disabled={antdForm.getFieldValue("type") === "Milestone"}
                  value={antdForm.getFieldValue("type") === "Milestone" ? milestoneSum.toString() : undefined}
                  placeholder={antdForm.getFieldValue("type") === "Milestone" ? "" : "Goal Amount (MYR)"}
                />
              </Form.Item>

              {antdForm.getFieldValue("type") === "AllOrNothing" && (
                <Form.Item
                  label="Deadline"
                  name="deadline"
                  rules={[{ required: true, message: "Deadline is required for Time Limit campaigns." }]}
                >
                  <DatePicker
                    size="large"
                    style={{ width: 200, marginBottom: 16 }}
                    format="YYYY-MM-DD"
                    disabledDate={current => current && current < moment().startOf("day")}
                  />
                </Form.Item>
              )}

              {antdForm.getFieldValue("type") === "Milestone" && (
                <Form.Item label="Milestones" required>
                  {(formState.milestones || []).map((ms, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, marginBottom: 10 }}>
                      <Input
                        placeholder="Milestone Name"
                        size="large"
                        style={{ flex: 1 }}
                        value={ms.name}
                        onChange={e => handleMilestoneChange(i, "name", e.target.value)}
                      />
                      <Input
                        placeholder="Milestone Description"
                        size="large"
                        style={{ flex: 2 }}
                        value={ms.description}
                        onChange={e => handleMilestoneChange(i, "description", e.target.value)}
                      />
                      <Input
                        placeholder="Amount (MYR)"
                        size="large"
                        type="number"
                        min={0}
                        step="any"
                        style={{ width: 140 }}
                        value={ms.amount}
                        onChange={e => handleMilestoneChange(i, "amount", e.target.value)}
                        addonBefore="RM"
                      />
                      <Button danger type="link" size="large" onClick={() => removeMilestone(i)}>
                        Remove
                      </Button>
                    </div>
                  ))}
                  <Button type="dashed" onClick={addMilestone} icon={<PlusOutlined />} size="large" style={{ marginTop: 8, marginBottom: 20 }}>
                    Add Milestone
                  </Button>
                </Form.Item>
              )}

              {antdForm.getFieldValue("type") === "Recurring" && (
                <>
                  <Form.Item
                    label="Withdraw Cap (MYR)"
                    name="recurringWithdrawCap"
                    rules={[
                      { required: true, message: "Recurring withdraw cap required." },
                      { pattern: /^[1-9]\d*(\.\d{1,2})?$/, message: "Must be a valid number greater than 0." }
                    ]}
                  >
                    <Input
                      size="large"
                      type="number"
                      min={0}
                      step="any"
                      addonBefore="RM"
                      style={{ marginBottom: 12 }}
                    />
                  </Form.Item>
                  <Form.Item
                    label="Withdraw Period"
                    name="recurringPeriodUnit"
                    rules={[{ required: true, message: "Please select withdraw period." }]}
                  >
                    <Select
                      size="large"
                      style={{ width: '100%', marginBottom: 16 }}
                      optionLabelProp="label"
                    >
                      <Option value="month" label={<span>Monthly</span>}>
                        <div>
                          <strong>Monthly</strong>
                          <div style={{ fontSize: 13, color: "#888" }}>
                            Every 30 days
                          </div>
                        </div>
                      </Option>
                      <Option value="quarter" label={<span>Quarterly</span>}>
                        <div>
                          <strong>Quarterly</strong>
                          <div style={{ fontSize: 13, color: "#888" }}>
                            Every 3 months
                          </div>
                        </div>
                      </Option>
                      <Option value="year" label={<span>Yearly</span>}>
                        <div>
                          <strong>Yearly</strong>
                          <div style={{ fontSize: 13, color: "#888" }}>
                            Every 12 months
                          </div>
                        </div>
                      </Option>
                    </Select>
                  </Form.Item>
                </>
              )}
              <p className={styles.subTitle}>Add your beneficiary wallet</p>
              <p className={styles.descHint}>Traceble transactions will increase trust</p>
              <Form.Item
                label="Beneficiary Wallet Address"
                name="beneficiary"
                tooltip="If left blank, funds will go to your NGO wallet."
              >
                <Input
                  size="large"
                  placeholder="0x... (leave blank if same as NGO)"
                  value={formState.beneficiary}
                  onChange={e => {
                    setFormState(prev => ({ ...prev, beneficiary: e.target.value }));
                    antdForm.setFieldsValue({ beneficiary: e.target.value });
                  }}
                  autoComplete="off"
                />
              </Form.Item>

              <h2 className={styles.publish}>Publish Time!</h2>
              <ul className={styles.publishDesc}>
                <li>Newly published campaigns will be reviewd and verified by our team.</li>
                <li>Verification may take up to <span>3-5 business days</span>.</li>
              </ul>

              <div className={styles.actionContainer}>
                <Form.Item>
                  <button type="submit" className={styles.submitBtn} disabled={submitting}>
                    {submitting ? "Creating..." : "Create Campaign"}
                  </button>
                </Form.Item>
                <Form.Item>
                  <button type="button" className={styles.cancelBtn} onClick={handleCancelClick} disabled={submitting}>
                    {submitting ? "Cancelling..." : "Cancel"}
                  </button>
                </Form.Item>
              </div>
            </Form>
          </div>

          <div className={styles.cardTips}>
            <Card title={currentTip.title}>
              <ul style={{ marginLeft: 20, paddingLeft: 0 }}>
                {currentTip.bullets.map((tip, idx) => (
                  <li key={idx} style={{ marginBottom: 8, fontSize: 15, color: "#333" }}>
                    {tip}
                  </li>
                ))}
              </ul>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
