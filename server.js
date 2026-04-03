// --- AEGISSEC CENTRAL BRAIN (Node.js Backend for Vercel) ---
const express = require('express');
const cors = require('cors');
const axios = require('axios');

const app = express();
app.use(cors());
app.use(express.json());

// Temporary Database (Baad mein hum ise Supabase se jodeinge)
let sites = [
    { 
        id: '1', 
        name: 'Sultan Ul Faqr', 
        url: 'https://sultanulfaqr.pk', 
        apiKey: 'Sultan-Secret-786',
        status: 'online'
    }
];

// 1. Get All Managed Sites
app.get('/api/sites', (req, res) => {
    res.json(sites);
});

// 2. Add New Site
app.post('/api/sites', (req, res) => {
    const newSite = { id: Date.now().toString(), ...req.body, status: 'online' };
    sites.push(newSite);
    res.json({ message: "Site added successfully", site: newSite });
});

// 3. Proxy: Scan Site (Backend WordPress ko hit karega)
app.get('/api/proxy/scan/:siteId', async (req, res) => {
    const site = sites.find(s => s.id === req.params.siteId);
    if (!site) return res.status(404).json({ message: "Site not found" });

    try {
        const response = await axios.get(`${site.url}/wp-json/aegissec/v1/scan?api_key=${site.apiKey}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "WordPress connection failed", error: error.message });
    }
});

// 4. Proxy: Get Logs
app.get('/api/proxy/logs/:siteId', async (req, res) => {
    const site = sites.find(s => s.id === req.params.siteId);
    if (!site) return res.status(404).json({ message: "Site not found" });

    try {
        const response = await axios.get(`${site.url}/wp-json/aegissec/v1/logs?api_key=${site.apiKey}`);
        res.json(response.data);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch logs from site" });
    }
});

// Vercel Serverless Function ke liye export karna zaroori hai
module.exports = app;

// Local testing ke liye (Vercel isko ignore kar dega)
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
        console.log(`AegisSec Cloud Brain is active on port ${PORT}`);
    });
}