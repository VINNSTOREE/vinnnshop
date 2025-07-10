const connectDB = require('../../utils/mongodb');
const mongoose = require('mongoose');
const axios = require('axios');

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

const API_KEY = 'VS-0d726f7dc04a6b';

async function cekMutasi() {
  await connectDB();

  const deposits = await Deposit.find({ status: 'Pending' });

  for (const deposit of deposits) {
    try {
      const response = await axios.post('https://qrisdinamis.api.vinnn.tech/api/deposit/status', {
        api_key: API_KEY,
        reff_id: deposit.reff_id
      });

      const result = response.data;
      console.log(`[🔁] Cek: ${deposit.reff_id} | Status: ${result.message || result.status}`);

      if (result.result && result.data.status.toLowerCase() === 'success') {
        deposit.status = 'Success';
        await deposit.save();
        console.log(`[✅] Pembayaran terverifikasi: ${deposit.reff_id} | Nominal: ${deposit.nominal}`);
        // Kirim notif ke WA user atau owner bisa ditambahkan di sini
      }
    } catch (err) {
      console.error(`❌ Gagal cek ${deposit.reff_id}: ${err.message}`);
    }
  }
}

// Bisa kamu panggil dari cron job
cekMutasi();
