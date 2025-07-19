const express = require('express');
const db = require('../db');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// ---------- MULTER CONFIG FOR IMAGE UPLOAD ----------
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads/'); // Make sure this folder exists and is writable
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, 'cover_' + Date.now() + ext);
  }
});
const upload = multer({ storage });

// ---------- NGO/GO ROUTES ----------

// Get all pending NGOs/GOs
router.get('/pending-ngos', async (req, res) => {
  try {
    const [results] = await db.query('SELECT * FROM ngos WHERE status = ?', ['pending']);
    res.status(200).json(results);
  } catch (err) {
    console.error(err);
    res.status(500).send('Error fetching NGOs');
  }
});

// Update NGO status (verify or reject)
router.put('/ngo/:id/status', async (req, res) => {
  const id = req.params.id;
  const { status } = req.body;

  if (!['verified', 'rejected'].includes(status)) {
    return res.status(400).send('Invalid status');
  }

  try {
    const [results] = await db.query('UPDATE ngos SET status = ? WHERE id = ?', [status, id]);
    if (results.affectedRows === 0) {
      return res.status(404).send('NGO not found');
    }
    res.status(200).send(`NGO status updated to ${status}`);
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to update NGO status');
  }
});

// Verify a campaign
router.put('/campaign/:contractAddress/verify', async (req, res) => {
  const contractAddress = req.params.contractAddress;
  try {
    // Update campaign status to verified
    const [result] = await db.query('UPDATE campaigns SET status = ? WHERE contract_address = ?', ['verified', contractAddress]);
    if (result.affectedRows === 0) {
      return res.status(404).send('Campaign not found');
    }

    // Add update in campaign_updates
    await db.query(
      'INSERT INTO campaign_updates (contract_address, title) VALUES (?, ?)',
      [contractAddress, 'Campaign Launched!🎉']
    );

    res.status(200).json({ success: true, message: 'Campaign verified and launch update added.' });
  } catch (err) {
    console.error(err);
    res.status(500).send('Failed to verify campaign');
  }
});

// ---------- NEWS ARTICLES ROUTES ----------

// Create news article (with cover image upload)
router.post('/news', upload.single('cover_image'), async (req, res) => {
  try {
    const { title, content } = req.body;
    const cover_image_url = req.file ? `/uploads/${req.file.filename}` : null;

    if (!title || !content) {
      return res.status(400).json({ message: 'Title and content are required.' });
    }

    const [result] = await db.query(
      `INSERT INTO news_articles (title, content, cover_image_url) VALUES (?, ?, ?)`,
      [title, content, cover_image_url]
    );
    res.status(201).json({ id: result.insertId, message: "Article created." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to create article." });
  }
});

// Get all news articles
router.get('/news', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, content, cover_image_url, created_at, is_published FROM news_articles WHERE is_published = TRUE ORDER BY created_at DESC`
    );
    res.json(rows);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch articles." });
  }
});

// Get one news article by id
router.get('/news/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT id, title, content, cover_image_url, created_at, is_published FROM news_articles WHERE id = ? AND is_published = TRUE`,
      [req.params.id]
    );
    if (rows.length === 0) return res.status(404).json({ message: "Article not found." });
    res.json(rows[0]);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch article." });
  }
});

module.exports = router;
