const cekMutasi = require('./api/Deposit/mutasi');

async function run() {
  console.log('Mulai cek mutasi...');
  await cekMutasi();
  console.log('Selesai cek mutasi.');
}

run();
