const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_KEY

if (!supabaseUrl || !supabaseKey) throw new Error('SUPABASE_URL and SUPABASE_KEY must be set')

const supabase = createClient(supabaseUrl, supabaseKey)

const API_KEY = process.env.API_KEY || 'VS-0d726f7dc04a6b'

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' })

  try {
    let body = ''
    for await (const chunk of req) {
      body += chunk
    }

    const { api_key, reff_id } = JSON.parse(body)

    if (!api_key || !reff_id) {
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' })
    }

    if (api_key !== API_KEY) {
      return res.status(403).json({ result: false, message: 'API Key salah.' })
    }

    const { data, error } = await supabase
      .from('deposits')
      .select('*')
      .eq('reff_id', reff_id)
      .single()

    if (error || !data) {
      return res.status(404).json({ result: false, message: 'Deposit tidak ditemukan.' })
    }

    return res.json({ result: true, message: 'Deposit berhasil ditemukan.', data })
  } catch (err) {
    return res.status(500).json({ result: false, message: 'Server error', error: err.message })
  }
}
