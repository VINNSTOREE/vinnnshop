const { API_ID, API_KEY, DATABASE } = require('../../config');
const fs = require('fs');

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const querystring = require('querystring');
  const buffers = [];
  for await (const chunk of req) buffers.push(chunk);
  const parsedBody = querystring.parse(Buffer.concat(buffers).toString());

  const { api_key, nominal, reff_id, user } = parsedBody;

  if (!api_key || !nominal || !reff_id) {
    return res.json({ result: false, message: 'Parameter tidak lengkap.' });
  }

  if (api_key !== API_KEY) {
    return res.json({ result: false, message: 'API Key salah.' });
  }

  // lanjut proses seperti biasa
  const fee = 597;
  const total = parseInt(nominal) + fee;
  const now = new Date();
  const created = now.toISOString().replace('T', ' ').split('.')[0];
  const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0];

  if (!fs.existsSync(DATABASE)) fs.writeFileSync(DATABASE, '[]');
  const data = JSON.parse(fs.readFileSync(DATABASE));

  const qr_string = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

  const deposit = {
    reff_id,
    nominal: parseInt(nominal),
    fee,
    total_bayar: total,
    status: 'Pending',
    qr_string,
    date_created: created,
    date_expired: expired,
    user: user || 'unknown'
  };

  data.push(deposit);
  fs.writeFileSync(DATABASE, JSON.stringify(data, null, 2));

  return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: deposit });
};
