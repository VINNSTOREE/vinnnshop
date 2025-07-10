const cron = require('node-cron');
const cekMutasi = require('../api/Deposit/mutasi'); // path relatif dari ./cron/cron.js ke mutasi.js

cron.schedule('*/1 * * * *', () => {
  console.log('🕓 Jalankan mutasi cek status deposit setiap menit');
  cekMutasi();
});
