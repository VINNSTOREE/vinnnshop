const connectDB = require('../../src/utils/mongodb');
const mongoose = require('mongoose');
const QRCode = require('qrcode');
const axios = require('axios');
const FormData = require('form-data');
const { API_KEY, BASE_QRIS } = require('../../config');

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

    const idTransaksi = reff_id || 'VINNPG-' + Math.floor(100000 + Math.random() * 900000);
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
