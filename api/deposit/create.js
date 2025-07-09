const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://sxuqvxdxyqltcalnpdbz.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dXF2eGR4eXFsdGNhbG5wZGJ6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjAwMzEwMywiZXhwIjoyMDY3NTc5MTAzfQ.m_Z-RYkRrMHtlcuQ8-ofDb8QxGalPtBA1tkY2jN8eyo';
const supabase = createClient(supabaseUrl, supabaseKey);

const API_KEY = 'VS-0d726f7dc04a6b';
const FIXED_QR_STRING = '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';

module.exports = async (req, res) => {
  if (req.method !== 'POST')
    return res.status(405).json({ result: false, message: 'Method Not Allowed' });

  try {
    const { api_key, nominal, reff_id } = req.body;

    if (!api_key || !nominal)
      return res.status(400).json({ result: false, message: 'Parameter tidak lengkap.' });

    if (api_key !== API_KEY)
      return res.status(403).json({ result: false, message: 'API Key salah.' });

    const idTransaksi = reff_id || `VS${Date.now()}${Math.floor(Math.random() * 1000)}`;
    const fee = 597;
    const total = parseInt(nominal) + fee;
    const now = new Date();
    const created = now.toISOString().replace('T', ' ').split('.')[0];
    const expired = new Date(now.getTime() + 30 * 60000).toISOString().replace('T', ' ').split('.')[0];

    const { data, error } = await supabase
      .from('deposits')
      .insert([{
        reff_id: idTransaksi,
        nominal: parseInt(nominal),
        fee,
        total_bayar: total,
        status: 'Pending',
        qr_string: FIXED_QR_STRING,
        date_created: created,
        date_expired: expired
      }]);

    if (error || !data || data.length === 0) {
      console.error('❌ Supabase insert error:', error);
      return res.status(500).json({
        result: false,
        message: 'Gagal menyimpan data.',
        error: error || 'Data kosong.'
      });
    }

    return res.json({
      result: true,
      message: 'Deposit berhasil dibuat.',
      data: data[0]
    });

  } catch (err) {
    console.error('❌ Server error:', err.message);
    return res.status(500).json({
      result: false,
      message: 'Server error',
      error: err.message
    });
  }
};
