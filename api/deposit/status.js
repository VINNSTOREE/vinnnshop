const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const axios = require('axios');

const API_KEY = 'VS-0d726f7dc04a6b';

const DepositSchema = new mongoose.Schema({
  reff_id: { type: String, unique: true },
  nominal: Number,
  fee: Number,
  total_bayar: Number,
  status: String,
  qr_string: String,
  qr_base64: String,
  date_created: Date,
  date_expired: Date
});
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });
  }

  try {
    const { api_key, reff_id } = req.body;

    if (!api_key || !reff_id) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' });
    }

    await connectDB();
    const deposit = await Deposit.findOne({ reff_id });
    if (!deposit) {
      return res.status(404).json({ result: false, message: 'Deposit tidak ditemukan.' });
    }

    // cek ke API eksternal (qrisdinamis)
    let apiStatus;
    try {
      const statusRes = await axios.post('https://qrisdinamis.api.vinnn.tech/api/deposit/status', {
        api_key: API_KEY,
        reff_id: reff_id
      }, {
        headers: { 'Content-Type': 'application/json' }
      });

      apiStatus = statusRes.data;
    } catch (err) {
      console.error('❌ Gagal konek ke API status eksternal:', err.message);
      return res.status(500).json({ result: false, message: 'Gagal konek ke API eksternal.' });
    }

    if (apiStatus?.result && apiStatus.data?.status === 'Success' && deposit.status !== 'Success') {
      deposit.status = 'Success';
      await deposit.save();
    }

    return res.json({
      result: true,
      data: {
        reff_id: deposit.reff_id,
        status: deposit.status,
        nominal: deposit.nominal
      }
    });

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
