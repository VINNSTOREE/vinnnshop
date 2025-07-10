const cron = require('node-cron');
const cekMutasi = require('../api/deposit/mutasi');

cron.schedule('*/1 * * * *', () => {
  console.log('Jalankan mutasi cek status deposit setiap menit');
  cekMutasi();
});
