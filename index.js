import express from 'express';
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
const BASE_URL = 'https://prod-kline-rest.supra.com/history';
const API_KEY = process.env.SUPRA_API_KEY;

app.get('/history', async (req, res) => {
  const { pair, interval } = req.query;
  if (!pair) {
    return res.status(400).json({ error: 'Missing "pair" parameter' });
  }

  const now = Date.now();
  const oneMonthAgo = now - 30 * 24 * 60 * 60 * 1000;

  const url = `${BASE_URL}?trading_pair=${pair}&startDate=${oneMonthAgo}&endDate=${now}&interval=${interval || 3600}`;

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
