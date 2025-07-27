import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
import cors from 'cors';

dotenv.config();

const app = express();
app.use(cors());

const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://prod-kline-rest.supra.com/history';
const API_KEY = process.env.SUPRA_API_KEY;

const PAIR_MAP = {
  6004: 'aapl_usd', 6005: 'amzn_usd', 6010: 'coin_usd', 6003: 'goog_usd',
  6011: 'gme_usd', 6009: 'intc_usd', 6059: 'ko_usd', 6068: 'mcd_usd',
  6001: 'msft_usd', 6066: 'ibm_usd', 6006: 'meta_usd', 6002: 'nvda_usd',
  6000: 'tsla_usd', 5010: 'aud_usd', 5000: 'eur_usd', 5002: 'gbp_usd',
  5013: 'nzd_usd', 5011: 'usd_cad', 5012: 'usd_chf', 5001: 'usd_jpy',
  5501: 'xag_usd', 5500: 'xau_usd', 0: 'btc_usdt', 1: 'eth_usdt',
  10: 'sol_usdt', 14: 'xrp_usdt', 5: 'avax_usdt', 3: 'doge_usdt',
  15: 'trx_usdt', 16: 'ada_usdt', 90: 'sui_usdt', 2: 'link_usdt'
};

// ✅ Cache mémoire : key = `${pair}-${interval}`, value = { timestamp, data }
const cache = new Map();

app.get('/history', async (req, res) => {
  const { pair, interval = 3600 } = req.query;

  if (!pair || isNaN(pair)) {
    return res.status(400).json({ error: 'Missing or invalid "pair"' });
  }

  const pairName = PAIR_MAP[pair];
  if (!pairName) {
    return res.status(400).json({ error: `Unknown pair: ${pair}` });
  }

  const cacheKey = `${pair}-${interval}`;
  const now = Date.now();
  const oneMinute = 60 * 1000;
  const cached = cache.get(cacheKey);

  // Fonction qui rafraîchit le cache en arrière-plan
  const refreshCache = async () => {
    const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
    const url = `${BASE_URL}?trading_pair=${pairName}&startDate=${oneMonthAgo}&endDate=${now}&interval=${interval}`;

    try {
      const response = await fetch(url, {
        headers: { 'x-api-key': API_KEY }
      });

      if (!response.ok) throw new Error(`Supra API error ${response.status}`);

      const data = await response.json();
      if (!data || Object.keys(data).length === 0) throw new Error("Empty response");

      cache.set(cacheKey, { timestamp: Date.now(), data });
      console.log(`♻️ Refreshed cache: ${cacheKey}`);
    } catch (err) {
      console.warn(`❌ Failed to refresh cache for ${cacheKey}: ${err.message}`);
    }
  };

  // ✅ Si cache valide → on renvoie directement
  if (cached && now - cached.timestamp < oneMinute) {
    console.log(`✅ Cache hit: ${cacheKey}`);
    return res.json(cached.data);
  }

  // ✅ Si cache expiré → on sert l’ancien, mais on rafraîchit en arrière-plan
  if (cached) {
    console.log(`⚠️ Serving stale cache for ${cacheKey} & refreshing`);
    res.json(cached.data); // Sert l'ancien immédiatement
    refreshCache();        // Met à jour sans attendre
    return;
  }

  // ❌ Pas de cache du tout → on attend le fetch puis on stocke
  console.log(`🚀 No cache yet for ${cacheKey}, fetching now`);
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;
  const url = `${BASE_URL}?trading_pair=${pairName}&startDate=${oneMonthAgo}&endDate=${now}&interval=${interval}`;

  try {
    const response = await fetch(url, {
      headers: { 'x-api-key': API_KEY }
    });

    if (!response.ok) throw new Error(`Supra API error ${response.status}`);

    const data = await response.json();
    cache.set(cacheKey, { timestamp: Date.now(), data });
    res.json(data);
  } catch (err) {
    console.error(`❌ Initial fetch failed for ${cacheKey}:`, err.message);
    res.status(500).json({ error: 'Failed to fetch data from Supra' });
  }
});

app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
});

