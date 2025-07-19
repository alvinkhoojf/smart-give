const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');

// Set up multer storage for NGO/GO document uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // Ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});

const upload = multer({ storage });

// Complete donor profile
router.post('/complete-profile', async (req, res) => {
  const { firstName, lastName, email, country } = req.body;
  const wallet = req.session.wallet;

  if (!wallet) return res.status(400).json({ error: 'No wallet in session' });

  const sql = `
    INSERT INTO donors (wallet_address, first_name, last_name, email, country)
    VALUES (?, ?, ?, ?, ?)
    ON DUPLICATE KEY UPDATE first_name = ?, last_name = ?, email = ?, country = ?
  `;

  const values = [
    wallet, firstName, lastName, email, country || null,
    firstName, lastName, email, country || null
  ];

  try {
    await db.query(sql, values);
    res.json({ message: 'Profile saved' });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Complete NGO/GO profile
router.post('/complete-profile/ngo', upload.fields([
  { name: 'registration_cert', maxCount: 1 },
  { name: 'additional_doc', maxCount: 1 }
]), async (req, res) => {
  const wallet = req.session.wallet;
  const { orgName, orgEmail, regNumber } = req.body;

  if (!wallet) return res.status(400).json({ error: 'No wallet in session' });

  const registrationCert = req.files['registration_cert']?.[0]?.filename || null;
  const additionalDoc = req.files['additional_doc']?.[0]?.filename || null;

  const sql = `
    INSERT INTO ngos (org_username, org_email, wallet_address, reg_number, reg_cert, additional_doc, status)
    VALUES (?, ?, ?, ?, ?, ?, 'pending')
    ON DUPLICATE KEY UPDATE org_username = ?, org_email = ?, reg_number = ?, reg_cert = ?, additional_doc = ?, status = 'pending'
  `;

  const values = [
    orgName, orgEmail, wallet, regNumber, registrationCert, additionalDoc,  
    orgName, orgEmail, regNumber, registrationCert, additionalDoc
  ];

  try {
    await db.query(sql, values);
    res.json({ message: 'NGO/GO profile saved and pending verification' });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Get user info from session based on role
router.get('/me', async (req, res) => {
  const wallet = req.session.wallet;
  const role = req.session.role;

  if (!wallet || !role) return res.status(401).json({ error: 'Not logged in' });

  try {
    if (role === 'donor') {
      const [results] = await db.query('SELECT * FROM donors WHERE wallet_address = ?', [wallet]);
      if (results.length > 0) return res.json({ ...results[0], role });
      return res.json({ wallet_address: wallet, role });
    } else if (role === 'ngo or go') {
      const [results] = await db.query('SELECT * FROM ngos WHERE wallet_address = ?', [wallet]);
      if (results.length > 0) return res.json({ ...results[0], role });
      return res.json({ wallet_address: wallet, role });
    } else {
      return res.status(400).json({ error: 'Unknown role' });
    }
  } catch (err) {
    console.error("Error in /me route:", err); 
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Login via MetaMask (sets wallet and role in session)
router.post('/login-metamask', (req, res) => {
  const { role, walletAddress } = req.body;

  if (!walletAddress || !role) {
    return res.status(400).json({ message: 'Wallet address and role are required.' });
  }

  req.session.wallet = walletAddress;
  req.session.role = role;

  res.json({ message: 'Session started successfully', user: { walletAddress, role } });
});

// Get current logged-in user from session
router.get('/current-user', (req, res) => {
  const { wallet, role } = req.session;
  if (!wallet || !role) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  res.json({ wallet, role });
});

// Logout and destroy session
router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) return res.status(500).json({ message: 'Logout failed' });
    res.clearCookie('connect.sid');
    res.json({ message: 'Logged out' });
  });
});

module.exports = router;
