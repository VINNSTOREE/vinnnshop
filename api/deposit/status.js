const { API_ID, API_KEY, DATABASE } = require('../../config');
const fs = require('fs');
const crypto = require('crypto');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const body = req.body || {};
  const querystring = require('querystring');
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const parsedBody = querystring.parse(Buffer.concat(buffers).toString());

  const { api_key, sign, reff_id } = parsedBody;

  if (!api_key || !sign || !reff_id) {
    return res.json({ result: false, message: 'Parameter tidak lengkap.' });
  }

  const validSign = crypto.createHash('md5').update(API_ID + API_KEY + reff_id).digest('hex');
  if (api_key !== API_KEY || sign !== validSign) {
    return res.json({ result: false, message: 'API Key atau Sign salah.' });
  }

  if (!fs.existsSync(DATABASE)) fs.writeFileSync(DATABASE, '[]');
  const data = JSON.parse(fs.readFileSync(DATABASE));

  const found = data.find(d => d.reff_id === reff_id);
  if (!found) return res.json({ result: false, message: 'Deposit tidak ditemukan.' });

  return res.json({ result: true, message: 'Deposit berhasil ditemukan.', data: found });
};
