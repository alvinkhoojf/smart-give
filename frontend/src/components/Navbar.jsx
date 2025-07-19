import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import styles from '../styles/Navbar.module.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';

const Navbar = () => {
  const [user, setUser] = useState(null);

  useEffect(() => {
    axios.get('http://localhost:5000/api/auth/me', { withCredentials: true })
      .then(res => setUser(res.data))
      .catch(() => setUser(null));
  }, []);

  const shortenWallet = (addr) => {
    if (!addr) return '';
    const prefix = addr.slice(0, 2);      
    const first4 = addr.slice(2, 6);       
    const last4  = addr.slice(-4);         
    return `${prefix}${first4}…${last4}`; 
  };

  const displayName = () => {
    if (!user) return '';
    if (user.role === 'ngo or go') {
      return user.org_username || shortenWallet(user.wallet_address) || '';
    } else {
      const fullName = `${user.first_name || ''} ${user.last_name || ''}`.trim();
      return fullName || shortenWallet(user.wallet_address) || '';
    }
  };

  const handleLogout = () => {
    axios.post('http://localhost:5000/api/auth/logout', {}, { withCredentials: true })
      .then(() => {
        setUser(null);
      })
      .catch(console.error);
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-light border-bottom shadow-sm px-4 py-3 sticky-top">
      <div className="container-fluid">
        <Link to="/" style={{ textDecoration: 'none' }}>
          <span className="navbar-brand fw-bold" style={{ color: '#FF416C' }}>SmartGive</span>
        </Link>

        <div className="collapse navbar-collapse justify-content-between">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 d-flex align-items-center gap-3">
            <li className="nav-item dropdown">
              <Link to="/campaigns" className="nav-link">Campaigns</Link>
            </li>
            <li className="nav-item">
              <Link to="/about" className="nav-link">About</Link>
            </li>
            <li className="nav-item">
              <Link to="/news" className="nav-link">News</Link>
            </li>
          </ul>

          <div className="d-flex gap-3">
            {user?.role === 'ngo or go' && ( user?.status === 'verified' ? (
                <Link to="/create-campaign" className={styles.createCampaignBtn}>Create Campaign</Link>
              ) : (
                <button className={styles.createCampaignBtnDisabled } disabled title='Not Verified'>Create Campaign</button>
              )
            )}

            {!user ? (
              <Link to="/role" className={styles.signInBtn}>
                Sign In
              </Link>
            ) : (
              <div className={styles.customDropdown}>
                <div className={styles.userInfo}>
                  <div className={styles.userName}>
                    {displayName()}
                    <p className={styles.userConnected}>Connected with MetaMask</p>
                  </div>
                  {user?.status === 'verified' ? (
                    <div className={styles.verifiedIconContainer}>
                      <img className={styles.verifiedIcon} src="/images/verified.png" alt="Verified" />
                    </div>
                  ) : (
                    <div></div>
                  )}
                </div>
                <ul className={styles.customDropdownMenu}>
                  <li style={{ marginBottom: '20px' }}>
                    <span className={styles.wallet}>Wallet</span>
                    <span className={styles.walletAddress}>{shortenWallet(user.wallet_address)}</span>
                  </li>
                  <hr />
                  <li>
                    <Link className={styles.dropdownItem} to="/my-account">
                      My Account
                    </Link>
                  </li>
                  <li>
                    <Link className={styles.dropdownItem} to="/my-account" state={{ tab: 'myDonations' }}>
                      My Donations
                    </Link>
                  </li>
                  <li >
                    {user?.role === 'ngo or go' && (
                      <Link className={styles.dropdownItem} to="/my-account" state={{ tab: 'myCampaigns' }}>My Campaigns</Link>
                    )}
                  </li>
                  <li>
                    <button className={styles.dropdownItem} onClick={handleLogout}>Logout</button>
                  </li>
                </ul>
              </div>
            )}
          </div>

        </div>
      </div>
    </nav>
  );
};

export default Navbar;
