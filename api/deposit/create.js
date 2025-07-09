const fs = require('fs');
const path = require('path');

const API_KEY = 'VS-0d726f7dc04a6b';
const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });
  }

  try {
    const { api_key, nominal, reff_id } = req.body;

    if (!api_key || !nominal || !reff_id) {
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

    const newData = {
      reff_id,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: FIXED_QR_STRING,
      date_created: created,
      date_expired: expired
    };

    const dbPath = path.join(__dirname, '../../src/database/qrisdb.json');
    let db = [];

    if (fs.existsSync(dbPath)) {
      const content = fs.readFileSync(dbPath);
      db = JSON.parse(content);
    }

    db.push(newData);
    fs.writeFileSync(dbPath, JSON.stringify(db, null, 2));

    return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: newData });
  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return res.status(500).json({ result: false, message: 'Gagal menyimpan data.', error: err.message });
  }
};
