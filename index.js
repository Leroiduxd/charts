import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors'; // <-- ajoute ceci

dotenv.config();

const app = express();
app.use(cors()); // <-- active CORS pour tous les domaines

const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://prod-kline-rest.supra.com/history';
const API_KEY = process.env.SUPRA_API_KEY;

const PAIR_MAP = {
  0: 'btc_usdt',
  6000: 'tsla_usd',
  6001: 'msft_usd',
  6002: 'nvda_usd',
  6003: 'goog_usd',
  6004: 'aapl_usd',
  6005: 'amzn_usd',
  6006: 'meta_usd',
};

app.get('/history', async (req, res) => {
  const { pair, interval } = req.query;
  const pairName = PAIR_MAP[pair];

  if (!pairName) {
    return res.status(400).json({ error: 'Invalid or missing "pair" index' });
  }

  const now = Date.now();
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const url = `${BASE_URL}?trading_pair=${pairName}&startDate=${oneMonthAgo}&endDate=${now}&interval=${interval || 3600}`;

  try {
    const response = await fetch(url, {
      headers: { 'x-api-key': API_KEY }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch data from Supra' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
