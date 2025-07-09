const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const axios = require('axios');
const FormData = require('form-data');

const API_KEY = 'VS-0d726f7dc04a6b';

const DepositSchema = new mongoose.Schema({
  reff_id: { type: String, unique: true },
  nominal: Number,
  fee: Number,
  total_bayar: Number,
  status: String,
  qr_string: String, // URL gambar QR code
  date_created: Date,
  date_expired: Date
});
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

// Fungsi hitung CRC16 (standar QRIS)
function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
      crc &= 0xFFFF; // pastikan 16-bit
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Update nominal pada tag 54 dengan benar
function generateQRISString(baseQRIS, nominal) {
  // hapus CRC16 lama (4 digit terakhir)
  let qrisData = baseQRIS.slice(0, -4);

  nominal = nominal.toString();
  // tag 54 = "54" + length (2 digit) + nominal
  const amountField = "54" + nominal.length.toString().padStart(2, '0') + nominal;

  // regex untuk ganti tag 54 lama
  qrisData = qrisData.replace(/54\d{2}\d+/, amountField);

  // hitung ulang CRC16
  const crc = convertCRC16(qrisData);

  return qrisData + crc;
}

// Upload buffer gambar QR ke catbox.moe
async function uploadQRToCatbox(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, {
    filename: 'qris.png',
    contentType: 'image/png'
  });
  // Optional: form.append('userhash', 'YOUR_USER_HASH');

  const response = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders()
  });

  if (!response.data.startsWith('https://')) {
    throw new Error('Upload gagal: ' + response.data);
  }

  return response.data;
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });
  }

  try {
    const { api_key, nominal, reff_id } = req.body;

    if (!api_key || !nominal) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' });
    }

    await connectDB();

    const idTransaksi = reff_id || 'VS' + Math.floor(100000 + Math.random() * 900000);
    const fee = 597;
    const total = parseInt(nominal) + fee;
    const now = new Date();
    const expired = new Date(now.getTime() + 30 * 60000);

    // Cek reff_id sudah ada?
    const exist = await Deposit.findOne({ reff_id: idTransaksi });
    if (exist) return res.status(409).json({ result: false, message: 'reff_id sudah ada.' });

    // Base QRIS (gunakan tanpa spasi, valid, sudah aku revisi)
    const BASE_QRIS = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VINGANS6008SIDOARJO61056121262070703A0163040DB5';

    // Generate QRIS string dengan nominal benar
    const qrString = generateQRISString(BASE_QRIS, nominal);

    // Generate buffer QR code gambar
    const qrBuffer = await QRCode.toBuffer(qrString);

    // Upload ke catbox.moe untuk dapat URL gambar QR
    const qrUrl = await uploadQRToCatbox(qrBuffer);

    // Simpan data deposit ke DB
    const deposit = new Deposit({
      reff_id: idTransaksi,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: qrUrl,
      date_created: now,
      date_expired: expired
    });

    await deposit.save();

    // Kirim response
    return res.json({
      result: true,
      message: 'Deposit berhasil dibuat.',
      data: deposit
    });

  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ result: false, message: 'Server error', error: err.message });
  }
};
