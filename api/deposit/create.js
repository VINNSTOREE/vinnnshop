const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';
const API_KEY = 'VS-0d726f7dc04a6b';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const { api_key, nominal, reff_id, user } = JSON.parse(body);

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

    // Simpan ke memori (RAM)
    globalThis.qrisdb = globalThis.qrisdb || [];
    globalThis.qrisdb.push(deposit);

    return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: deposit });

  } catch (err) {
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
