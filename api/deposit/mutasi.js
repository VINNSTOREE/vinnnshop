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

  if (deposits.length === 0) {
    console.log('[Mutasi] Tidak ada transaksi pending.');
    return;
  }

  console.log(`[Mutasi] Memeriksa ${deposits.length} transaksi pending...`);

  for (const deposit of deposits) {
    try {
      const response = await axios.post(
        'https://qrisdinamis.api.vinnn.tech/api/deposit/status',
        {
          api_key: API_KEY,
          reff_id: deposit.reff_id
        },
        { timeout: 10000 }
      );

      const { data } = response;

      if (data.result && data.data?.status === 'Success') {
        deposit.status = 'Success';
        await deposit.save();

        console.log(`[✅] Transaksi sukses: ${deposit.reff_id} | Rp${deposit.nominal.toLocaleString('id-ID')}`);
      } else if (data.result && data.data?.status === 'Pending') {
        console.log(`[🕐] Masih pending: ${deposit.reff_id}`);
      } else {
        console.log(`[⚠️] Status tidak dikenal (${deposit.reff_id}):`, data);
      }

    } catch (error) {
      const status = error.response?.status || 'Tidak diketahui';
      console.log(`[❌] Gagal cek ${deposit.reff_id} | Status: ${status} | Error: ${error.message}`);
    }
  }
}

module.exports = cekMutasi;
