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
  date_created: Date,
  date_expired: Date
});
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

async function cekMutasi() {
  await connectDB();

  const deposits = await Deposit.find({ status: 'Pending' });

  console.log(`[Mutasi] Cek ${deposits.length} transaksi pending...`);

  for (const deposit of deposits) {
    try {
      // Cek status ke API eksternal
      const response = await axios.post('https://qrisdinamis.api.vinnn.tech/api/deposit/status', {
        api_key: API_KEY,
        reff_id: deposit.reff_id
      }, { timeout: 10000 }); // timeout 10 detik

      const data = response.data;

      if (data.result && data.data && data.data.status === 'Success') {
        deposit.status = 'Success';
        await deposit.save();

        console.log(`[✅] Deposit sukses: ${deposit.reff_id} | Nominal: ${deposit.nominal}`);

      } else if (data.result && data.data && data.data.status === 'Pending') {
        console.log(`[ℹ️] Deposit masih pending: ${deposit.reff_id}`);
      } else {
        console.log(`[⚠️] Status tidak dikenali untuk ${deposit.reff_id}:`, data);
      }

    } catch (error) {
      if (error.response) {
        console.log(`[❌ Mutasi] Error cek status ${deposit.reff_id}: Status code ${error.response.status}`);
      } else {
        console.log(`[❌ Mutasi] Error cek status ${deposit.reff_id}:`, error.message);
      }
      // jangan throw supaya mutasi lanjut ke deposit berikutnya
    }
  }
}

module.exports = cekMutasi;
