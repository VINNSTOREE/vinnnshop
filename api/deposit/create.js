const fs = require('fs');
const path = require('path');

const dbPath = path.resolve('./qrisdb.json');
const API_KEY = 'VS-0d726f7dc04a6b';
const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const data = JSON.parse(body);
    const { api_key, nominal, reff_id, user } = data;

    if (!api_key || !reff_id || !nominal) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' });
    }

    const fee = 597;
    const total = parseInt(nominal) + fee;

    const now = new Date();
    const created = now.toISOString().replace('T', ' ').split('.')[0];
    const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0];

    const deposit = {
      reff_id,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: FIXED_QR_STRING,
      date_created: created,
      date_expired: expired,
      user: user || 'unknown'
    };

    // Simpan ke file qrisdb.json
    let db = [];
    if (fs.existsSync(dbPath)) {
      db = JSON.parse(fs.readFileSync(dbPath));
    }

    db.push(deposit);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: deposit });

  } catch (err) {
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
