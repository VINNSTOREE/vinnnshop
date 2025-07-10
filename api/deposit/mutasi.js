const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');

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
  if (req.method !== 'POST')
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    const { api_key, reff_id } = req.body;

    if (!api_key || !reff_id)
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });

    if (api_key !== API_KEY)
      return res.status(403).json({ result: false, message: 'API Key salah.' });

    await connectDB();

    const updated = await Deposit.findOneAndUpdate(
      { reff_id, status: 'Pending' },
      { $set: { status: 'Success' } },
      { new: true }
    );

    if (!updated)
      return res.status(404).json({ result: false, message: 'Data tidak ditemukan atau sudah sukses.' });

    return res.json({ result: true, message: 'Status deposit berhasil diperbarui.', data: updated });

  } catch (err) {
    console.error('❌ ERROR:', err.message);
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};