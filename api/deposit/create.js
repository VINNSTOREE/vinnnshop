const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const axios = require('axios');
const FormData = require('form-data');

// API key
const API_KEY = 'VS-0d726f7dc04a6b';

// Schema MongoDB
const DepositSchema = new mongoose.Schema({
  reff_id: { type: String, unique: true },
  nominal: Number,
  fee: Number,
  total_bayar: Number,
  status: String,
  qr_string: String,      // URL gambar QR code
  qr_base64: String,      // optional, base64 QR code image
  date_created: Date,
  date_expired: Date
});
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', DepositSchema);

// QRIS CRC-16
function convertCRC16(str) {
  let crc = 0xFFFF;
  for (let c = 0; c < str.length; c++) {
    crc ^= str.charCodeAt(c) << 8;
    for (let i = 0; i < 8; i++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) : (crc << 1);
    }
  }
  return ("000" + (crc & 0xFFFF).toString(16).toUpperCase()).slice(-4);
}

// QRIS string dinamis
function generateQRISString(baseQRIS, nominal) {
  let qrisData = baseQRIS.slice(0, -4);
  const step1 = qrisData.replace("010211", "010212");
  const step2 = step1.split("5802ID");

  nominal = nominal.toString();
  let uang = "54" + ("0" + nominal.length).slice(-2) + nominal;
  uang += "5802ID";

  const result = step2[0] + uang + step2[1] + convertCRC16(step2[0] + uang + step2[1]);
  return result;
}

// Upload QR buffer ke Pixhost
async function uploadQRToPixhost(buffer) {
  const form = new FormData();
  form.append('img', buffer, {
    filename: 'qris.png',
    contentType: 'image/png'
  });
  form.append('content_type', '1');
  form.append('action', 'upload');

  const response = await axios.post('https://pixhost.to/upload-api.php', form, {
    headers: form.getHeaders()
  });

  const match = response.data.match(/https:\/\/img\d+\.pixhost\.to\/images\/\d+\/[^"]+/);
  if (!match) throw new Error('Gagal parsing link gambar.');

  return match[0];
}

// Generate QR code base64 tanpa upload
async function generateQRBase64(qrString) {
  try {
    const base64Data = await QRCode.toDataURL(qrString);
    // base64Data format: data:image/png;base64,xxxxxx
    return base64Data;
  } catch (error) {
    console.error('Error generating QR base64:', error);
    throw error;
  }
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

    const BASE_QRIS = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

    const qrString = generateQRISString(BASE_QRIS, nominal);

    // Generate QR buffer and upload to pixhost
    const qrBuffer = await QRCode.toBuffer(qrString);
    let qrUrl = null;
    try {
      qrUrl = await uploadQRToPixhost(qrBuffer);
    } catch (e) {
      console.warn('Upload QR ke pixhost gagal, lanjut tanpa upload:', e.message);
    }

    // Generate base64 sebagai fallback atau tambahan
    const qrBase64 = await generateQRBase64(qrString);

    const deposit = new Deposit({
      reff_id: idTransaksi,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: qrUrl || '',   // kalau upload gagal, kosongkan
      qr_base64: qrBase64,      // selalu simpan base64
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
