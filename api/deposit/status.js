const fs = require('fs');
const path = require('path');

const API_KEY = 'VS-0d726f7dc04a6b';

module.exports = async (req, res) => {
  if (req.method !== 'POST') 
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    const { api_key, reff_id } = req.body;

    if (!api_key || !reff_id)
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });

    if (api_key !== API_KEY)
      return res.status(403).json({ result: false, message: 'API Key salah.' });

    const dbPath = path.join(__dirname, '../../src/database/qrisdb.json');
    if (!fs.existsSync(dbPath)) 
      return res.status(404).json({ result: false, message: 'Database tidak ditemukan.' });

    const content = fs.readFileSync(dbPath);
    const db = JSON.parse(content);

    const deposit = db.find(d => d.reff_id === reff_id);

    if (!deposit)
      return res.status(404).json({ result: false, message: 'Deposit tidak ditemukan.' });

    return res.json({ result: true, message: 'Deposit berhasil ditemukan.', data: deposit });

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
