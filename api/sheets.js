const { google } = require('googleapis');

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    const raw = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
    if (!raw) return res.status(500).json({ error: 'Service account not configured' });

    const credentials = JSON.parse(raw);
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
    });

    const sheets = google.sheets({ version: 'v4', auth });
    const spreadsheetId = process.env.SPREADSHEET_ID || '1s4mSs_yxExxdmZwqjGYkHL_HRCoy4-oN6anky5gjRQQ';

    const { action, sheetName } = req.query;

    if (action === 'list') {
      const meta = await sheets.spreadsheets.get({ spreadsheetId });
      const sheetNames = meta.data.sheets.map(s => s.properties.title);
      return res.json({ sheets: sheetNames });
    }

    if (action === 'data' && sheetName) {
      const result = await sheets.spreadsheets.values.get({
        spreadsheetId,
        range: sheetName,
      });
      const values = result.data.values || [];
      if (values.length === 0) return res.json({ headers: [], rows: [] });
      return res.json({ headers: values[0], rows: values.slice(1) });
    }

    return res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
};
