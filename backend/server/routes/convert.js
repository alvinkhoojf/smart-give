const express = require('express');
const axios = require('axios');
const router = express.Router();

router.get('/eth-price-myr', async (req, res) => {
  try {
    const response = await axios.get('https://api.coinbase.com/v2/exchange-rates?currency=ETH');
    const myrRate = response.data.data.rates.MYR;

    if (!myrRate) {
      return res.status(500).json({ error: "MYR rate not available" });
    }

    res.json({ myr: parseFloat(myrRate) });
  } catch (error) {
    console.error("Coinbase API error:", error.message);
    res.status(500).json({ error: "Failed to fetch ETH price from Coinbase" });
  }
});

module.exports = router;
