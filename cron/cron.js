const cron = require('node-cron');
const cekMutasiOkeConnect = require('./api/Deposit/mutasi');

cron.schedule('*/1 * * * *', () => {
  console.log('Jalankan cek mutasi pembayaran setiap menit...');
  cekMutasiOkeConnect();
});
