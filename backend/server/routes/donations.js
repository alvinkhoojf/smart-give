const express = require('express');
const router = express.Router();
const db = require('../db'); // Adjust path to your DB config

// POST /api/donations
router.post('/', async (req, res) => {
  const {
    wallet_address,
    username,
    campaign_address,
    amount,
    amount_myr,
    tx_hash,
    anonymous = false 
  } = req.body;

  if (!wallet_address || !campaign_address || !amount || !amount_myr) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const [result] = await db.query(
      `INSERT INTO donations (
        wallet_address, username, campaign_address,
        amount, amount_myr, tx_hash, anonymous
      )
      VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        wallet_address,
        username || null,
        campaign_address,
        amount,
        amount_myr,
        tx_hash || null,
        anonymous
      ]
    );

    res.status(201).json({ message: 'Donation recorded', donation_id: result.insertId });
  } catch (err) {
    console.error('Error inserting donation:', err);
    res.status(500).json({ message: 'Failed to record donation' });
  }
});

router.get('/stats', async (req, res) => {
  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ message: 'Missing wallet address' });
  }

  try {
    const [rows] = await db.query(
      `SELECT 
        COUNT(*) AS totalDonations,
        COALESCE(SUM(amount_myr), 0) AS totalAmount
       FROM donations
       WHERE wallet_address = ?`,
      [wallet]
    );

    res.status(200).json(rows[0]);
  } catch (err) {
    console.error('Error fetching donation stats:', err);
    res.status(500).json({ message: 'Failed to fetch donation stats' });
  }
});

router.get('/history', async (req, res) => {
  const { wallet } = req.query;

  if (!wallet) {
    return res.status(400).json({ message: 'Missing wallet address' });
  }

  try {
    const [campaigns] = await db.query(`
      SELECT DISTINCT c.*
      FROM donations d
      JOIN campaigns c ON d.campaign_address = c.contract_address
      WHERE d.wallet_address = ?
    `, [wallet]);

    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching donation history:', err);
    res.status(500).json({ message: 'Failed to fetch donation history' });
  }
});


module.exports = router;
