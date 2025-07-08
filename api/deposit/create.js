import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_ANON_KEY
const API_KEY = process.env.API_KEY || 'VS-0d726f7dc04a6b'

const supabase = createClient(supabaseUrl, supabaseKey)

export default async function handler(req, res) {
  if (req.method !== 'POST') 
    return res.status(405).json({ result: false, message: 'Method Not Allowed' })

  const { api_key, reff_id, nominal, user } = req.body

  if (!api_key || !reff_id || !nominal) {
    return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' })
  }

  if (api_key !== API_KEY) {
    return res.status(403).json({ result: false, message: 'API Key salah.' })
  }

  const fee = 597
  const total_bayar = Number(nominal) + fee
  const now = new Date()
  const date_created = now.toISOString()
  const date_expired = new Date(now.getTime() + 30 * 60000).toISOString()

  const qr_string = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5'

  const { data, error } = await supabase.from('deposits').insert([{
    reff_id,
    nominal: Number(nominal),
    fee,
    total_bayar,
    status: 'Pending',
    qr_string,
    date_created,
    date_expired,
    user_id: user || 'unknown'
  }])

  if (error) {
    return res.status(500).json({ result: false, message: 'Gagal simpan deposit.', error: error.message })
  }

  return res.json({ result: true, message: '
