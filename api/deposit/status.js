const { API_ID, API_KEY, DATABASE } = require('../../config');
const { loadDB, generateSign } = require('../../helper');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();

  const body = req.body || {};
  const { api_key, sign, reff_id } = body;

  if (!api_key || !sign || !reff_id) {
    return res.json({ result: false, message: 'Parameter tidak lengkap.' });
  }

  const validSign = generateSign(API_ID, API_KEY, reff_id);
  if (api_key !== API_KEY || sign !== validSign) {
    return res.json({ result: false, message: 'API Key atau Sign salah.' });
  }

  const data = loadDB(DATABASE);
  const trx = data.find(t => t.reff_id === reff_id);
  if (!trx) return res.json({ result: false, message: 'Deposit tidak ditemukan.' });

  return res.json({ result: true, message: 'Deposit berhasil ditemukan.', data: trx });
};