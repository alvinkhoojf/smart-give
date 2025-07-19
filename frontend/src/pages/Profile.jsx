// Profile.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Swal from 'sweetalert2';
import axios from 'axios';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import styles from "../styles/Profile.module.css";
import CampaignCard from '../components/CampaignCard';
import CompleteProfile from '../components/CompleteProfile';


const Profile = () => {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [donationStats, setDonationStats] = useState({ totalDonations: 0, totalAmount: 0 });
  const [donatedCampaigns, setDonatedCampaigns] = useState([]);
  const [myCampaigns, setMyCampaigns] = useState([]);
  const location = useLocation();
  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    country: '',
    organization_name: '',
    organization_email: '',
    reg_number: '',
    reg_cert: null,
    additional_doc: null
  });

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/me', { withCredentials: true })
      .then(res => {
        setUser(res.data);
        setFormData({
          first_name: res.data.first_name || '',
          last_name: res.data.last_name || '',
          email: res.data.email || '',
          country: res.data.country || '',
          organization_name: res.data.org_username || '',
          organization_email: res.data.org_email || '',
        });
      })
      .catch(() => setUser(null));
  }, []);

  useEffect(() => {
    if (user) {
      axios.get(`http://localhost:5000/api/donations/stats?wallet=${user.wallet_address}`, { withCredentials: true })
        .then(res => setDonationStats(res.data))
        .catch(() => setDonationStats({ totalDonations: 0, totalAmount: 0 }));

      axios.get(`http://localhost:5000/api/donations/history?wallet=${user.wallet_address}`, { withCredentials: true })
        .then(res => setDonatedCampaigns(res.data))
        .catch(() => setDonatedCampaigns([]));

      if (user.role === 'ngo or go') {
        axios.get(`http://localhost:5000/api/campaign/user?username=${user.org_username}`, {
          withCredentials: true
        })
        .then(res => setMyCampaigns(res.data))
        .catch(() => setMyCampaigns([]));
      }
    }
  }, [user]);

  useEffect(() => {
    if (location.state?.tab) {
      setActiveTab(location.state.tab);
    }
  }, [location.state]);

  const isDonor = user?.role === 'donor';
  const isNgo = user?.role === 'ngo or go';

  const isProfileIncomplete = isDonor
    ? (!user?.first_name || !user?.last_name || !user?.wallet_address)
    : (!user?.org_username || !user?.org_email || !user?.wallet_address);

  const tabs = ['overview', 'myDonations'];
  if (user?.role === 'ngo or go') {
    tabs.push('myCampaigns');
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleProfileUpdate = (e) => {
    e.preventDefault();

    if (user.role === 'ngo or go') {
      const form = new FormData();
      form.append('orgName', formData.organization_name);
      form.append('orgEmail', formData.organization_email);
      form.append('regNumber', formData.reg_number);
      if (formData.reg_cert) {
        form.append('registration_cert', formData.reg_cert);
      }
      if (formData.additional_doc) {
        form.append('additional_doc', formData.additional_doc);
      }

      axios.post('http://localhost:5000/api/auth/complete-profile/ngo', form, {
        withCredentials: true,
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Submitted!',
          text: 'Organization profile submitted for verification.',
          confirmButtonColor: '#3085d6'
        });
        return axios.get('http://localhost:5000/api/auth/me', { withCredentials: true });
      })
      .then(res => setUser(res.data))
      .catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Submission Failed',
          text: 'Failed to submit organization profile.',
          confirmButtonColor: '#d33'
        });
      });

    } else {
      axios.post('http://localhost:5000/api/auth/complete-profile', {
        firstName: formData.first_name,
        lastName: formData.last_name,
        email: formData.email,
        country: formData.country
      }, { withCredentials: true })
      .then(() => {
        Swal.fire({
          icon: 'success',
          title: 'Profile Updated!',
          text: 'Profile updated successfully!',
          confirmButtonColor: '#3085d6'
        });
        return axios.get('http://localhost:5000/api/auth/me', { withCredentials: true });
      })
      .then(res => setUser(res.data))
      .catch(err => {
        console.error(err);
        Swal.fire({
          icon: 'error',
          title: 'Update Failed',
          text: 'Failed to update profile.',
          confirmButtonColor: '#d33'
        });
      });
    }
  };

  function renderTabPanel() {
    if (activeTab === "overview") {
      return (
        <div className={styles.tabContent}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <div className="card text-center shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Total Donations Made</h5>
                  <p className="display-6 fw-bold" style={{color: "#FF416C"}}>
                    {donationStats.totalDonations}
                  </p>
                </div>
              </div>
            </div>

            <div className="col-md-6 mb-3">
              <div className="card text-center shadow-sm">
                <div className="card-body">
                  <h5 className="card-title">Total Amount Donated</h5>
                  <p className="display-6 fw-bold" style={{color: "#FF416C"}}>
                    RM {Number(donationStats.totalAmount).toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }
    if (activeTab === "myDonations") {
      return (
        <div className={styles.tabContent}>
          <h4 className="mb-4">My Donations</h4>
          {donatedCampaigns.length === 0 ? (
            <p>You haven't donated to any campaigns yet.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {donatedCampaigns.map((campaign) => (
                <div key={campaign.id}>
                  <CampaignCard campaign={campaign} />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    if (activeTab === "myCampaigns") {
      return (
        <div className={styles.tabContent}>
          <h4 className="mb-4">My Campaigns</h4>
          {myCampaigns.length === 0 ? (
            <p>You haven't created any campaigns yet.</p>
          ) : (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18 }}>
              {myCampaigns.map((campaign) => (
                <div key={campaign.contract_address}>
                  <CampaignCard campaign={campaign} action="edit" />
                </div>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  }

  if (!user) return <p>Loading...</p>;

  return (
    <div>
      <Navbar />
      <div className="container pt-5" style={{ minHeight: "100vh" }}>
        {isProfileIncomplete && (
          <div>

            <div className="alert alert-warning" role="alert">
              Your profile is incomplete
            </div>
            <div className="row mb-5">
              <div className="col-md-2">
                <div className={styles.profileWrapper}>
                  <img src="/images/profile-picture.png" alt="" />
                </div>
              </div>
              <div className="col-md-10" style={{marginTop: "auto", marginBottom: "auto"}}>
                <div className={styles.userInfo}>
                  <span>{user.wallet_address}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {isDonor && user.first_name && user.last_name && (
          <div className="row mb-5">
            <div className="col-md-2">
              <div className={styles.profileWrapper}>
                <img src="/images/profile-picture.png" alt="" />
              </div>
            </div>
            <div className="col-md-10" style={{marginTop: "auto", marginBottom: "auto"}}>
              <div className={styles.userInfo}>
                <h2>{user.first_name} {user.last_name}</h2>
                <p>{user.email}</p>
                <p>{user.wallet_address}</p>
              </div>
            </div>
          </div>
        )}

        {!isDonor && user.org_username && (
          <div className="row mb-5">
            <div className="col-md-2">
              <div className={styles.profileWrapper}>
                <img src="/images/profile-picture.png" alt="" />
              </div>
            </div>
            <div className="col-md-10" style={{marginTop: "auto", marginBottom: "auto"}}>
              <div className={styles.userInfo}>
                <h2>{user.org_username}</h2>
                <p>{user.org_email}</p>
                <p>{user.wallet_address}</p>
              </div>
            </div>
          </div>
        )}

        <div className="row mt-4">
          <div className="col-12">
            <div className={styles.tabBar}>
              <button
                className={activeTab === "overview" ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab("overview")}
              >
                Overview
              </button>
              <button
                className={activeTab === "myDonations" ? styles.activeTab : styles.tab}
                onClick={() => setActiveTab("myDonations")}
              >
                My Donations
              </button>
              { isNgo && (
                <button
                  className={activeTab === "myCampaigns" ? styles.activeTab : styles.tab}
                  onClick={() => setActiveTab("myCampaigns")}
                >
                  My Campaign
                </button>
              )}
            </div>
            <div>{renderTabPanel()}</div>
          </div>
        </div>

        {isProfileIncomplete && (
            <CompleteProfile
              user={user}
              formData={formData}
              handleInputChange={handleInputChange}
              handleProfileUpdate={handleProfileUpdate}
            />
        )}

      </div>
      <Footer />
    </div>
  );
};

export default Profile;
