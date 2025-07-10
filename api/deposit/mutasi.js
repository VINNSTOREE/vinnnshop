const connectDB = require('../../../src/utils/mongodb'); // sesuaikan path ini
const mongoose = require('mongoose');
const axios = require('axios');

// Schema Deposit (sama dengan create)
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

// Data merchant dan API key OkeConnect kamu
const MERCHANT_CODE = 'OK471136';
const API_KEY = '18886951732359736471136OKCT1B836983290190CF25B2FEFFFD650D74';

async function cekMutasiOkeConnect() {
  await connectDB();

  // Cari semua deposit dengan status Pending
  const deposits = await Deposit.find({ status: 'Pending' });

  for (const deposit of deposits) {
    try {
      const response = await axios.post('https://www.okeconnect.com/integrasi/payment_gateway/api.php', {
        merchant_code: MERCHANT_CODE,
        api_key: API_KEY,
        reff_id: deposit.reff_id
      });

      const result = response.data;

      console.log(`[🔁] Cek: ${deposit.reff_id} | Status: ${result.status}`);

      // Jika status sukses, update di DB
      if (result.status && result.status.toLowerCase() === 'success') {
        deposit.status = 'Success';
        await deposit.save();

        console.log(`[✅] Pembayaran terverifikasi: ${deposit.reff_id} | Nominal: ${deposit.nominal}`);

        // TODO: Tambahkan notifikasi WA ke user atau owner jika perlu
      }

    } catch (err) {
      console.error(`❌ Gagal cek ${deposit.reff_id}: ${err.message}`);
    }
  }
}

module.exports = cekMutasiOkeConnect;
