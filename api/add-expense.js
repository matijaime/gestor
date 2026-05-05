export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Bearer token check
  const auth   = (req.headers['authorization'] || '').trim();
  const token  = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  if (!process.env.SHORTCUT_TOKEN || token !== process.env.SHORTCUT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { name, amount, currency = 'ARS', category = 'Otro', note = '' } = req.body || {};

  if (!name || !amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: 'name y amount son requeridos' });
  }

  const API_KEY = 'AIzaSyB3zegEcGBBZ5Pm_D_Yu8oM4iTON_hjoSQ';
  const PROJECT = 'gestorgt-1776720646';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/quick_expenses?key=${API_KEY}`;

  const firestoreBody = {
    fields: {
      name:     { stringValue: String(name) },
      amount:   { doubleValue: parseFloat(amount) },
      currency: { stringValue: String(currency) },
      category: { stringValue: String(category) },
      note:     { stringValue: String(note) },
    },
  };

  const response = await fetch(url, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(firestoreBody),
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ ok: true, name, amount, currency, category });
}
