const express = require('express')
const mongoose = require('mongoose')

const app = express()
app.use(express.json())

// Schema deposit
const depositSchema = new mongoose.Schema({
  reff_id: { type: String, unique: true },
  nominal: Number,
  fee: Number,
  total_bayar: Number,
  status: String,
  qr_string: String,
  date_created: Date,
  date_expired: Date
})
const Deposit = mongoose.models.Deposit || mongoose.model('Deposit', depositSchema)

// Env variables dari Vercel
const MONGODB_URI = process.env.MONGODB_URI
const API_KEY = process.env.API_KEY
const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5'

// Cached connection
let cached = global.mongoose
if (!cached) cached = global.mongoose = { conn: null, promise: null }

async function dbConnect() {
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }).then(mongoose => mongoose)
  }
  cached.conn = await cached.promise
  return cached.conn
}

app.post('/api/deposit/create', async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' })

  try {
    await dbConnect()

    const { api_key, nominal, reff_id } = req.body
    if (!api_key || !nominal) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' })
    }
    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' })
    }

    const idTransaksi = reff_id || 'VS' + Math.floor(Math.random() * 1000000)
    const fee = 597
    const total = parseInt(nominal) + fee
    const now = new Date()
    const expired = new Date(now.getTime() + 30 * 60000)

    const exist = await Deposit.findOne({ reff_id: idTransaksi })
    if (exist) {
      return res.status(409).json({ result: false, message: 'reff_id sudah ada.' })
    }

    const deposit = new Deposit({
      reff_id: idTransaksi,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: FIXED_QR_STRING,
      date_created: now,
      date_expired: expired
    })

    await deposit.save()

    return res.json({
      result: true,
      message: 'Deposit berhasil dibuat.',
      data: deposit
    })
  } catch (err) {
    console.error('Server error:', err)
    return res.status(500).json({ result: false, message: 'Server error', error: err.message })
  }
})

module.exports = app
