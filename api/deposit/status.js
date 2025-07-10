const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const axios = require('axios');

const API_KEY = 'VS-0d726f7dc04a6b';

// Schema harus sama dengan create
const DepositSchema = new mongoose.Schema({
  reff_id: { type: String, unique: true },
  nominal: Number,
  fee: Number,
  total_bayar: Number,
  status: String,
  qr_string: String,
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

    // Cari data deposit di database
    const deposit = await Deposit.findOne({ reff_id });
    if (!deposit) {
      return res.status(404).json({ result: false, message: 'Deposit tidak ditemukan.' });
    }

    // Panggil API eksternal untuk cek status pembayaran sebenarnya
    try {
      const externalRes = await axios.post('https://external-api-url.com/check-status', {
        api_key: 'external_api_key',
        reff_id
      }, { timeout: 10000 });

      if (!externalRes.data || !externalRes.data.result) {
        return res.status(500).json({ result: false, message: 'Gagal mendapatkan data dari API eksternal.' });
      }

      // Update status di DB jika perlu
      const newStatus = externalRes.data.data.status;
      if (deposit.status !== newStatus) {
        deposit.status = newStatus;
        await deposit.save();
      }

      // Balikkan hasil ke client
      return res.json({
        result: true,
        message: 'Status deposit berhasil diperbarui.',
        data: {
          reff_id: deposit.reff_id,
          status: deposit.status,
          nominal: deposit.nominal
        }
      });

    } catch (err) {
      console.error('❌ ERROR koneksi API eksternal:', err.message);
      return res.status(500).json({ result: false, message: 'Gagal konek ke API eksternal.' });
    }
  } catch (err) {
    console.error('❌ ERROR server:', err.message);
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
