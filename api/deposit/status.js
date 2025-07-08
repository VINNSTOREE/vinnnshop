const API_KEY = 'VS-0d726f7dc04a6b';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    let body = '';
    for await (const chunk of req) {
      body += chunk;
    }

    const { api_key, reff_id } = JSON.parse(body);

    if (!api_key || !reff_id) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' });
    }

    const db = globalThis.qrisdb || [];
    const found = db.find(d => d.reff_id === reff_id);
    if (!found) {
      return res.status(404).json({ result: false, message: 'Deposit tidak ditemukan.' });
    }

    return res.json({ result: true, message: 'Deposit berhasil ditemukan.', data: found });

  } catch (err) {
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
