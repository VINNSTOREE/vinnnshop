import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const apiKey = process.env.API_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  const { api_key, reff_id } = req.body;

  if (!api_key || !reff_id) {
    return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });
  }

  if (api_key !== apiKey) {
    return res.status(403).json({ result: false, message: 'API Key salah.' });
  }

  const { data, error } = await supabase
    .from('deposits')
    .select('*')
    .eq('reff_id', reff_id)
    .limit(1)
    .single();

  if (error || !data) {
    return res.status(404).json({ result: false, message: 'Deposit tidak ditemukan.' });
  }

  return res.json({
    result: true,
    message: 'Deposit berhasil ditemukan.',
    data
  });
}
