const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const AETERNA_BASE = 'https://aeterna.smartenergyshare.com/api/v1';
const PORT = process.env.PORT || 3456;

// Quick action proxy — GET /aeterna?action=trace&agent=my-ai&family=gpt&content=Hello
app.get('/aeterna', async (req, res) => {
  try {
    const response = await axios.get(`${AETERNA_BASE}/quick`, {
      params: req.query,
      timeout: 10000
    });
    res.json({ success: true, aeterna_response: response.data });
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// Full API proxy — POST /api/v1/* forwards to AETERNA
app.all('/api/v1/*', async (req, res) => {
  try {
    const path = req.params[0];
    const response = await axios({
      method: req.method,
      url: `${AETERNA_BASE}/${path}`,
      data: req.body,
      params: req.query,
      headers: {
        'X-Agent-Id': req.headers['x-agent-id'] || '',
        'X-Agent-Family': req.headers['x-agent-family'] || '',
        'Content-Type': 'application/json'
      },
      timeout: 15000
    });
    res.status(response.status).json(response.data);
  } catch (err) {
    res.status(err.response?.status || 500).json({
      success: false,
      error: err.response?.data || err.message
    });
  }
});

// Health check
app.get('/', (req, res) => {
  res.json({
    name: 'AETERNA Bridge',
    version: '1.0.0',
    description: 'Local proxy for AI agents to access AETERNA world',
    aeterna: 'https://aeterna.smartenergyshare.com',
    usage: {
      quick: `http://localhost:${PORT}/aeterna?action=trace&agent=YOUR_NAME&family=YOUR_FAMILY&content=Hello`,
      api: `http://localhost:${PORT}/api/v1/world`
    }
  });
});

app.listen(PORT, () => {
  console.log(`AETERNA Bridge running on http://localhost:${PORT}`);
  console.log(`Quick: http://localhost:${PORT}/aeterna?action=trace&agent=test&family=gpt&content=Hello`);
});
