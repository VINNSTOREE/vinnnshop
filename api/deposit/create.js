const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const axios = require('axios');
const FormData = require('form-data');

// Konstanta
const API_KEY = 'VS-0d726f7dc04a6b';
const BASE_QRIS = '00020101021226670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VINGANS6008SIDOARJO61056121262070703A01630';

// Schema MongoDB
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

// Fungsi CRC16
function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let i = 0; i < str.length; i++) {
    crc ^= str.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if ((crc & 0x8000) !== 0) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
    }
    crc &= 0xFFFF;
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

// Fungsi QRIS builder dengan nominal dan CRC
function generateQRISString(baseQRIS, nominal) {
  const nominalStr = nominal.toString();
  const id54 = `54${("0" + nominalStr.length).slice(-2)}${nominalStr}`;
  const fullWithoutCRC = baseQRIS + id54 + '6304';
  const crc = convertCRC16(fullWithoutCRC);
  return fullWithoutCRC + crc;
}

// Upload ke catbox.moe
async function uploadQRToCatbox(buffer) {
  const form = new FormData();
  form.append('reqtype', 'fileupload');
  form.append('fileToUpload', buffer, {
    filename: 'qris.png',
    contentType: 'image/png'
  });

  const response = await axios.post('https://catbox.moe/user/api.php', form, {
    headers: form.getHeaders()
  });

  if (!response.data.startsWith('https://')) {
    throw new Error('Upload gagal: ' + response.data);
  }

  return response.data;
}

// Handler utama
module.exports = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    const { api_key, nominal, reff_id } = req.body;

    if (!api_key || !nominal)
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });

    if (api_key !== API_KEY)
      return res.status(403).json({ result: false, message: 'API Key salah.' });

    await connectDB();

    const idTransaksi = reff_id || 'VS' + Math.floor(100000 + Math.random() * 900000);
    const fee = 597;
    const total = parseInt(nominal) + fee;
    const now = new Date();
    const expired = new Date(now.getTime() + 30 * 60000); // 30 menit

    const exist = await Deposit.findOne({ reff_id: idTransaksi });
    if (exist) return res.status(409).json({ result: false, message: 'reff_id sudah ada.' });

    const qrString = generateQRISString(BASE_QRIS, nominal);
    const qrBuffer = await QRCode.toBuffer(qrString);
    const qrUrl = await uploadQRToCatbox(qrBuffer);

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
