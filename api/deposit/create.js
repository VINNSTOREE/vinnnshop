// api/deposit/create.js
const deposits = [];

module.exports = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ error: 'Method Not Allowed' });

  try {
    let body = '';

    // Baca body secara manual
    for await (const chunk of req) {
      body += chunk;
    }

    const data = JSON.parse(body);

    const { api_key, nominal, reff_id } = data;

    if (!api_key || !nominal || !reff_id) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
    }

    if (api_key !== 'VS-0d726f7dc04a6b') {
      return res.status(403).json({ result: false, message: 'API Key salah.' });
    }

    const fee = 597;
    const total = Number(nominal) + fee;
    const now = new Date();
    const created = now.toISOString().replace('T', ' ').split('.')[0];
    const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0];

    const qr_string = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

    const deposit = {
      reff_id,
      nominal: Number(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string,
      date_created: created,
      date_expired: expired,
      user: 'unknown'
    };

    deposits.push(deposit);

    return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: deposit });
  } catch (err) {
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
