const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// --- SUPABASE DATABASE CONNECTION ---
// YAHAN APNI SUPABASE URL AUR KEY DAALEIN JO AAPNE COPY KI THI:
const SUPABASE_URL = 'https://pbinjwwowtbwubfzzhyb.supabase.co'; // Aapki URL
const SUPABASE_ANON_KEY = 'sb_publishable_VhijJJ8By0ixkxCDoeqymA_XUO-G9b8'; // Aapki lambi wali Key
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Temporary Sites List
let sites = [
    { id: '1', name: 'Sultan Ul Faqr', url: 'https://sultanulfaqr.pk', apiKey: 'Sultan-Secret-786', status: 'online'}
];

app.get('/api/sites', (req, res) => res.json(sites));

// --- NAYA ROUTE: DATABASE SE BOT STATS LANA ---
app.get('/api/bots/stats', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('bot_stats')
            .select('*')
            .order('id', { ascending: false })
            .limit(1)
            .single();

        if (error) throw error;
        res.json(data);
    } catch (error) {
        res.status(500).json({ message: "Database query failed", error: error.message });
    }
});

// Proxy routes for WordPress
app.get('/api/proxy/scan/:siteId', async (req, res) => {
    const site = sites.find(s => s.id === req.params.siteId);
    try {
        const response = await axios.get(`${site.url}/wp-json/aegissec/v1/scan?api_key=${site.apiKey}`);
        res.json(response.data);
    } catch (error) { res.status(500).json({ message: "Failed" }); }
});

app.get('/api/proxy/logs/:siteId', async (req, res) => {
    const site = sites.find(s => s.id === req.params.siteId);
    try {
        const response = await axios.get(`${site.url}/wp-json/aegissec/v1/logs?api_key=${site.apiKey}`);
        res.json(response.data);
    } catch (error) { res.status(500).json({ message: "Failed" }); }
});

module.exports = app;