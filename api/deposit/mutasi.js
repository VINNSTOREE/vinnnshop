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
  date_expired: Date,
  user_jid: String // simpan nomor WA user untuk notif
});
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

const API_KEY = 'VS-0d726f7dc04a6b';

async function cekMutasi(yilzi) {
  await connectDB();

  const pendingDeposits = await Deposit.find({ status: 'Pending' });

  for (const dep of pendingDeposits) {
    try {
      const response = await axios.post('https://qrisdinamis.api.vinnn.tech/api/deposit/status', {
        api_key: API_KEY,
        reff_id: dep.reff_id
      });

      const data = response.data;

      if (data.result && data.data.status === 'Success') {
        dep.status = 'Success';
        await dep.save();

        console.log(`[✅] Deposit terverifikasi: ${dep.reff_id}`);

        if (dep.user_jid) {
          await yilzi.sendMessage(dep.user_jid, {
            text: `🎉 Deposit kamu sudah terkonfirmasi!\nID: ${dep.reff_id}\nNominal: Rp${dep.nominal.toLocaleString('id-ID')}`
          });
        }
      } else {
        console.log(`[ℹ️] Deposit ${dep.reff_id} status: ${data.message || data.data.status}`);
      }
    } catch (err) {
      console.error(`❌ Gagal cek deposit ${dep.reff_id}:`, err.message);
    }
  }
}

module.exports = cekMutasi;
