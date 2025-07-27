import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors()); // Active CORS pour tous les domaines

const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://prod-kline-rest.supra.com/history';
const API_KEY = process.env.SUPRA_API_KEY;

// Mapping des IDs vers les noms de paire
const PAIR_MAP = {
  6004: 'aapl_usd',
  6005: 'amzn_usd',
  6010: 'coin_usd',
  6003: 'goog_usd',
  6011: 'gme_usd',
  6009: 'intc_usd',
  6059: 'ko_usd',
  6068: 'mcd_usd',
  6001: 'msft_usd',
  6066: 'ibm_usd',
  6006: 'meta_usd',
  6002: 'nvda_usd',
  6000: 'tsla_usd',
  5010: 'aud_usd',
  5000: 'eur_usd',
  5002: 'gbp_usd',
  5013: 'nzd_usd',
  5011: 'usd_cad',
  5012: 'usd_chf',
  5001: 'usd_jpy',
  5501: 'xag_usd',
  5500: 'xau_usd',
  0: 'btc_usdt',
  1: 'eth_usdt',
  10: 'sol_usdt',
  14: 'xrp_usdt',
  5: 'avax_usdt',
  3: 'doge_usdt',
  15: 'trx_usdt',
  16: 'ada_usdt',
  90: 'sui_usdt',
  2: 'link_usdt'
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

    if (!response.ok) {
      throw new Error(`Supra API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);
  } catch (err) {
    console.error('❌ Error fetching data from Supra:', err.message);
    res.status(500).json({ error: 'Failed to fetch data from Supra' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});
