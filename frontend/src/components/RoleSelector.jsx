import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import styles from "../styles/RoleSelector.module.css";

const RoleSelector = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleRoleSelect = async (role) => {
    navigate('/'); 
    setLoading(true);
    setError('');

    if (!window.ethereum) {
      setError('MetaMask not detected.');
      setLoading(false);
      return;
    }

    try {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const walletAddress = accounts[0];

      await axios.post('http://localhost:5000/api/auth/login-metamask', {
        walletAddress,
        role,
      }, { withCredentials: true });

      // Reload to re-fetch session state
      window.location.reload();
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to connect. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
   <div style={{ display: "flex", minHeight: "100vh" }}>
    {/* Left: Image, 30% */}
    <div style={{
      flex: "0 0 33%",
      maxWidth: "33%",
      background: "#f5f6fa",
      display: "flex",
      alignItems: "center",
      justifyContent: "center"
    }}>
      <img
        src="/images/role-selector-banner.png"
        alt=""
        style={{
          width: "100%",
          height: "100vh",
          objectFit: "cover"
        }}
      />
    </div>

    {/* Right: Content, 70% */}
    <div style={{
      flex: "0 0 67%",
      maxWidth: "67%",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "#fff",
      flexDirection: "column"
    }}>
      <h2 style={{fontWeight: "bold"}}>Sign in to SmartGive</h2>
      <p>Select your role to sign in</p>
      {loading && <p>🔄 Connecting to MetaMask…</p>}
      {error && <p className="text-danger">{error}</p>}
      <div className="d-flex justify-content-center gap-4 mt-4">
        <div>
          <div
            className={styles.roleCard}
            tabIndex={loading ? -1 : 0}
            role="button"
            aria-disabled={loading}
            onClick={() => !loading && handleRoleSelect('donor')}
            onKeyDown={e => {
              if (!loading && (e.key === "Enter" || e.key === " ")) {
                handleRoleSelect('donor');
              }
            }}
          >
            <img src="/images/donation.png" alt="" style={{ width: 150, pointerEvents: "none" }} />
          </div>
          <h5 style={{fontWeight: "bold", textAlign: "center", marginTop: 10}}>Donor</h5>
        </div>
        
        <div>
          <div
            className={styles.roleCard}
            tabIndex={loading ? -1 : 0}
            role="button"
            aria-disabled={loading}
            onClick={() => !loading && handleRoleSelect('ngo or go')}
            onKeyDown={e => {
              if (!loading && (e.key === "Enter" || e.key === " ")) {
                handleRoleSelect('ngo or go');
              }
            }}
          >
            <img src="/images/non-governmental-organization.png" alt="" style={{ width: 150, pointerEvents: "none" }} />
          </div>
          <h5 style={{fontWeight: "bold", textAlign: "center", marginTop: 10}}>NGO/GO</h5>
        </div>
      </div>
    </div>
  </div>
  );
};

export default RoleSelector;