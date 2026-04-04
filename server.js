const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(express.json());

// --- SUPABASE DATABASE CONNECTION ---
// Yahan apni asli Supabase URL aur Key daalein
const SUPABASE_URL = 'https://pbinjwwowtbwubfzzhyb.supabase.co'; 
const SUPABASE_ANON_KEY = 'sb_publishable_VhijJJ8By0ixkxCDoeqymA_XUO-G9b8'; 
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Temporary Sites List
let sites = [
    { id: '1', name: 'Sultan Ul Faqr', url: 'https://sultanulfaqr.pk', apiKey: 'Sultan-Secret-786', status: 'online'}
];

app.get('/api/sites', (req, res) => res.json(sites));

// --- 1. GET ALL PLATFORM DATA (Dashboard Load Hone Par) ---
app.get('/api/platform-data/:siteId', async (req, res) => {
    try {
        const siteId = req.params.siteId;
        
        // Ek sath saare tables se data laayein
        const [botRes, settingsRes, apiRes, togglesRes] = await Promise.all([
            supabase.from('bot_stats').select('*').order('id', { ascending: false }).limit(1).single(),
            supabase.from('platform_settings').select('*').eq('site_id', siteId).single(),
            supabase.from('api_integrations').select('*').eq('site_id', siteId).single(),
            supabase.from('security_toggles').select('*').eq('site_id', siteId).single()
        ]);

        res.json({
            bots: botRes.data || { good_bots: 0, suspicious_bots: 0, blocked_bots: 0 },
            settings: settingsRes.data || {},
            integrations: apiRes.data || {},
            toggles: togglesRes.data || {}
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch platform data", error: error.message });
    }
});

// --- 2. UPDATE SETTINGS ---
app.post('/api/settings/update', async (req, res) => {
    try {
        const { site_id, admin_email, timezone } = req.body;
        const { error } = await supabase
            .from('platform_settings')
            .update({ admin_email, timezone, updated_at: new Date() })
            .eq('site_id', site_id);
            
        if (error) throw error;
        res.json({ success: true, message: "Settings saved to database" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 3. UPDATE API KEY & WEBHOOK ---
app.post('/api/integrations/update', async (req, res) => {
    try {
        const { site_id, enterprise_api_key, webhook_url } = req.body;
        // Jo bhi cheez bheji jaye sirf wahi update karein
        let updateData = { updated_at: new Date() };
        if (enterprise_api_key) updateData.enterprise_api_key = enterprise_api_key;
        if (webhook_url !== undefined) updateData.webhook_url = webhook_url;

        const { error } = await supabase
            .from('api_integrations')
            .update(updateData)
            .eq('site_id', site_id);
            
        if (error) throw error;
        res.json({ success: true, message: "Integrations updated" });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// --- 4. UPDATE TOGGLES (CDN, Zero Trust, etc) ---
app.post('/api/toggles/update', async (req, res) => {
    try {
        const { site_id, toggle_name, toggle_value } = req.body;
        // Dynamically update the specific toggle column
        const { error } = await supabase
            .from('security_toggles')
            .update({ [toggle_name]: toggle_value, updated_at: new Date() })
            .eq('site_id', site_id);
            
        if (error) throw error;
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

// WordPress mate Proxy routes (Jo pehle se theek chal rahe hain)
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