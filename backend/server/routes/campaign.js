const express = require('express');
const router = express.Router();
const db = require('../db'); 
const multer = require('multer');
const path = require('path');

// Set up multer storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // ensure this folder exists
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// Accept up to 5 images
const upload = multer({ storage: storage, limits: { files: 5 } });

// Create a new campaign (with images)
router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    // Parse JSON fields sent via multipart/form-data
    const {
      title,
      description,
      type,
      goalAmount,
      milestones,
      recurringWithdrawCap,
      recurringPeriodUnit,
      ngo_username,
      txHash,
      contractAddress
    } = req.body;

    // Minimal validation
    if (!title || !description || !type || !goalAmount || !ngo_username || !txHash || !contractAddress) {
      return res.status(400).json({ error: 'Missing required fields.' });
    }

    // Handle milestones if sent as JSON string (from frontend)
    let milestonesStr = null;
    if (milestones) {
      milestonesStr = typeof milestones === "string" ? milestones : JSON.stringify(milestones);
    }

    // Handle images: req.files is an array of files
    let imageFiles = req.files || [];
    const imagePaths = imageFiles.map(f => `/uploads/${f.filename}`);
    const imagesStr = imagePaths.length > 0 ? JSON.stringify(imagePaths) : null;

    const sql = `
      INSERT INTO campaigns
      (title, description, type, goal_amount, milestones, recurring_withdraw_cap, recurring_period_unit, images, ngo_username, tx_hash, contract_address, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

    const params = [
      title,
      description,
      type,
      goalAmount,
      milestonesStr,
      recurringWithdrawCap || null,
      recurringPeriodUnit || null,
      imagesStr,
      ngo_username,
      txHash,
      contractAddress,
      'pending'
    ];

    await db.query(sql, params);

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error.' });
  }
});

// Get all pending campaigns
router.get('/pending', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM campaigns WHERE status = "pending"');
    res.json(results);
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

// Get all verified campaigns
router.get('/verified', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM campaigns WHERE status = ?', ['verified']);
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching campaigns');
  }
});

// Approve or reject a campaign
router.put('/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;
  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).json({ error: 'Invalid status value.' });
  }
  try {
    const [result] = await db.query('UPDATE campaigns SET status = ? WHERE id = ?', [status, id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign not found.' });
    }
    res.json({ success: true, status });
  } catch (err) {
    res.status(500).json({ error: err.message || String(err) });
  }
});

router.get('/user', async (req, res) => {
  const { username } = req.query;

  if (!username) {
    return res.status(400).json({ message: 'Missing ngo_username' });
  }

  try {
    const [campaigns] = await db.query(
      'SELECT * FROM campaigns WHERE ngo_username = ? AND status = ?',
      [username, 'verified']
    );
    res.status(200).json(campaigns);
  } catch (err) {
    console.error('Error fetching user campaigns:', err);
    res.status(500).json({ message: 'Failed to fetch campaigns' });
  }
});

router.get('/:address', async (req, res) => {
  const { address } = req.params;

  const [results] = await db.query('SELECT * FROM campaigns WHERE contract_address = ?', [address]);
  if (!results.length) return res.status(404).send('Not found');
  const campaign = results[0];

  const [donationRows] = await db.query(
    'SELECT COUNT(*) AS total_donations FROM donations WHERE campaign_address = ?',
    [address]
  );
  campaign.total_donations = donationRows[0]?.total_donations || 0;

  res.json(campaign);
});

router.get('/edit/:address', async (req, res) => {
  const { address } = req.params;
  const [results] = await db.query('SELECT * FROM campaigns WHERE contract_address = ?', [address]);
  if (!results.length) return res.status(404).send('Not found');
  res.json(results[0]);
});

// Update campaign description by contract address
router.put('/:address', async (req, res) => {
  const { address } = req.params;
  const { description } = req.body;

  if (!description) {
    return res.status(400).json({ error: 'Description is required' });
  }

  try {
    const [result] = await db.query(
      'UPDATE campaigns SET description = ? WHERE contract_address = ?',
      [description, address]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Campaign not found' });
    }

    res.status(200).json({ message: 'Campaign description updated' });
  } catch (err) {
    console.error('Update error:', err);
    res.status(500).json({ error: 'Failed to update campaign description' });
  }
});

// GET all updates for a campaign
router.get('/:address/updates', async (req, res) => {
  const { address } = req.params;

  try {
    const [updates] = await db.query(
      'SELECT * FROM campaign_updates WHERE contract_address = ? ORDER BY created_at DESC',
      [address]
    );

    res.status(200).json(updates);
  } catch (err) {
    console.error("Error fetching updates:", err);
    res.status(500).json({ error: 'Failed to fetch campaign updates.' });
  }
});


// POST a new update for a campaign
router.post('/:address/updates', async (req, res) => {
  const { address } = req.params;
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: 'Title and description are required.' });
  }

  try {
    const sql = `
      INSERT INTO campaign_updates (contract_address, title, description)
      VALUES (?, ?, ?)
    `;
    const [result] = await db.query(sql, [address, title, description]);

    res.status(201).json({ success: true, id: result.insertId });
  } catch (err) {
    console.error("Error saving update:", err);
    res.status(500).json({ error: 'Server error while posting update.' });
  }
});

router.get('/:address/donations', async (req, res) => {
  const { address } = req.params;
  try {
    const [rows] = await db.query(
      `SELECT username, wallet_address, amount, amount_myr, timestamp, anonymous
       FROM donations WHERE campaign_address = ?
       ORDER BY timestamp DESC`,
      [address]
    );
    res.json(rows);
  } catch (err) {
    console.error("Error fetching donations:", err);
    res.status(500).json({ message: "Failed to fetch donations" });
  }
});



module.exports = router;
