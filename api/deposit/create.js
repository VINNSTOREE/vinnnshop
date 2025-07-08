const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_KEY must be set')

const supabase = createClient(supabaseUrl, supabaseKey)

const API_KEY = process.env.API_KEY || 'VS-0d726f7dc04a6b' // simpan juga di env

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' })

  try {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    const { api_key, nominal, reff_id, user } = JSON.parse(body)

    if (!api_key || !reff_id || !nominal) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' })
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' })
    }

    const fee = 597
    const total = parseInt(nominal)
      ? parseInt(nominal) + fee
      : 0
    const now = new Date()
    const created = now.toISOString().replace('T', ' ').split('.')[0]
    const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0]

    const deposit = {
      reff_id,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string:
        '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5',
      date_created: created,
      date_expired: expired,
      user: user || 'unknown'
    }

    const { data, error } = await supabase.from('deposits').insert([deposit])

    if (error) {
      return res.status(500).json({ result: false, message: 'Gagal menyimpan deposit.', error: error.message })
    }

    return res.json({ result: true, message: 'Deposit berhasil dibuat.', data: deposit })
  } catch (err) {
    return res.status(500).json({ result: false, message: 'Server error', error: err.message })
  }
}
