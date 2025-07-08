import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const apiKey = process.env.API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  const { api_key, nominal, reff_id, user } = req.body;

  if (!api_key || !nominal || !reff_id) {
    return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
  }

  if (api_key !== apiKey) {
    return res.status(403).json({ result: false, message: 'API Key salah.' });
  }

  const fee = 597;
  const total = parseInt(nominal) + fee;
  const now = new Date();
  const date_created = now.toISOString().replace('T', ' ').split('.')[0];
  const date_expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0];
  const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

  // Simpan data deposit ke Supabase
  const { data, error } = await supabase
    .from('deposits')
    .insert([{
      reff_id,
      nominal: parseInt(nominal),
      fee,
      total_bayar: total,
      status: 'Pending',
      qr_string: FIXED_QR_STRING,
      date_created,
      date_expired,
      user: user || 'unknown'
    }]);

  if (error) {
    return res.status(500).json({ result: false, message: 'Gagal menyimpan data deposit.', error: error.message });
  }

  return res.json({
    result: true,
    message: 'Deposit berhasil dibuat.',
    data: data[0]
  });
}
