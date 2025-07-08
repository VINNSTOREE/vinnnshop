const { API_ID, API_KEY, DATABASE } = require('../../config');
const { loadDB, saveDB, generateSign, generateQR } = require('../../helper');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const { api_key, sign, nominal, user } = body;
  const reff_id = `VINN-${Math.floor(Math.random() * 10000)}`;

  if (!api_key || !sign || !nominal) {
    return res.json({ result: false, message: 'Parameter tidak lengkap.' });
  }

  const validSign = generateSign(API_ID, API_KEY, reff_id);
  if (api_key !== API_KEY || sign !== validSign) {
    return res.json({ result: false, message: 'API Key atau Sign salah.' });
  }

  const fee = 597;
  const total = parseInt(nominal) + fee;
  const now = new Date();
  const created = now.toISOString().replace('T', ' ').split('.')[0].replace(/:/g, '-');
  const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0].replace(/:/g, '-');

  const data = loadDB(DATABASE);
  const trx = {
    reff_id,
    nominal: parseInt(nominal),
    fee,
    total_bayar: total,
    status: 'Pending',
    qr_string: generateQR(),
    date_created: created,
    date_expired: expired,
    user: user || 'unknown'
  };

  data.push(trx);
  saveDB(DATABASE, data);

  return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: trx });
};