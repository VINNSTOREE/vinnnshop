const fs = require('fs');
const crypto = require('crypto');

function loadDB(file) {
  if (!fs.existsSync(file)) fs.writeFileSync(file, '[]');
  return JSON.parse(fs.readFileSync(file));
}

function saveDB(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

function generateSign(api_id, api_key, reff_id) {
  return crypto.createHash('md5').update(api_id + api_key + reff_id).digest('hex');
}

function generateQR() {
  return '00020101021126670016COM.NOBUBANK.WWW01189360050300000879140214249245531475870303UMI51440014ID.CO.QRIS.WWW0215ID20222128523070303UMI5204481453033605405505975802ID5908VIN GANS6008SIDOARJO61056121262070703A0163040DB5';
}

module.exports = { loadDB, saveDB, generateSign, generateQR };