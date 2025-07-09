const fs = require('fs');
const path = require('path');

const API_KEY = 'VS-0d726f7dc04a6b';
const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    const { api_key, nominal, reff_id } = req.body;

    if (!api_key || !nominal) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' });
    }

    // Generate reff_id kalau gak dikirim
    const idTransaksi = reff_id || 'VS' + Math.floor(Math.random() * 1000000);

    const fee = 597;
    const total = parseInt(nominal) + fee;
    const now = new Date();
    const created = now.toISOString().replace('T', ' ').split('.')[0];
    const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0];

    // Path file JSON
    const dbFolder = path.resolve('./database');
    const dbPath = path.join(dbFolder, 'deposits.json');

    // Buat folder kalau belum ada
    if (!fs.existsSync(dbFolder)) {
      fs.mkdirSync(dbFolder, { recursive: true });
    }

    // Buat file kosong [] kalau belum ada
    if (!fs.existsSync(dbPath)) {
      fs.writeFileSync(dbPath, '[]');
    }

    // Baca data lama
    const rawData = fs.readFileSync(dbPath, 'utf-8');
    let dbData = [];
    if (rawData) {
      dbData = JSON.parse(rawData);
    }

    // Cek duplikat reff_id
    if (dbData.some(d => d.reff_id === idTransaksi)) {
      return res.status(409).json({ result: false, message: 'reff_id sudah ada.' });
    }

    // Tambah data baru
    const newData = {
      reff_id: idTransaksi,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: FIXED_QR_STRING,
      date_created: created,
      date_expired: expired
    };

    dbData.push(newData);

    // Simpan data kembali ke file
    fs.writeFileSync(dbPath, JSON.stringify(dbData, null, 2));

    // Balikkan response sukses
    return res.json({
      result: true,
      message: 'Deposit berhasil dibuat.',
      data: newData
    });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
