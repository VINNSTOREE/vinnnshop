const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const API_KEY = 'VS-0d726f7dc04a6b';

// Schema harus sama dengan yang ada di create.js
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
    return res.status(405).json({
      result: false,
      message: 'Method Not Allowed'
    });
  }

  try {
    const { api_key, reff_id } = req.body;

    if (!api_key || !reff_id) {
      return res.status(400).json({
        result: false,
        message: 'Parameter tidak lengkap.'
      });
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({
        result: false,
        message: 'API Key salah.'
      });
    }

    await connectDB();

    const deposit = await Deposit.findOne({ reff_id });

    if (!deposit) {
      return res.status(404).json({
        result: false,
        message: 'Deposit tidak ditemukan.'
      });
    }

    return res.status(200).json({
      result: true,
      data: {
        reff_id: deposit.reff_id,
        status: deposit.status,
        nominal: deposit.nominal,
        total_bayar: deposit.total_bayar,
        qr_string: deposit.qr_string,
        date_created: deposit.date_created,
        date_expired: deposit.date_expired
      }
    });

  } catch (err) {
    console.error('❌ ERROR Status API:', err.message);
    return res.status(500).json({
      result: false,
      message: 'Server error',
      error: err.message
    });
  }
};
