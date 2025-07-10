const connectDB = require('../../src/utils/mongodb');
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
  try {
    await connectDB();
    const deposits = await Deposit.find({ status: 'Pending' });
    if (!deposits.length) {
      console.log('[Mutasi] Tidak ada deposit Pending');
      return;
    }
    for (const dep of deposits) {
      try {
        const response = await axios.post('https://qrisdinamis.api.vinnn.tech/api/Deposit/status', {
          api_key: API_KEY,
          reff_id: dep.reff_id
        }, { timeout: 10000 });

        const res = response.data;
        console.log(`[Mutasi] Cek ${dep.reff_id} status: ${res.status || res.message || 'No status'}`);

        if (res.result && res.data && res.data.status === 'Success') {
          dep.status = 'Success';
          await dep.save();
          console.log(`[Mutasi] Deposit berhasil diupdate jadi Success: ${dep.reff_id}`);
        }
      } catch (e) {
        console.error(`[Mutasi] Error cek status ${dep.reff_id}:`, e.message);
      }
    }
  } catch (err) {
    console.error('[Mutasi] Error:', err.message);
  }
}

module.exports = cekMutasi;
