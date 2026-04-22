export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const { name, amount, currency = 'ARS', uid } = req.query;

  if (!name || !amount || !uid) {
    return res.status(400).json({ error: 'Faltan parámetros: name, amount, uid' });
  }

  const API_KEY = 'AIzaSyB3zegEcGBBZ5Pm_D_Yu8oM4iTON_hjoSQ';
  const PROJECT = 'gestorgt-1776720646';
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents/quick_expenses?key=${API_KEY}`;

  const body = {
    fields: {
      uid:      { stringValue: uid },
      name:     { stringValue: name },
      amount:   { doubleValue: parseFloat(amount) },
      currency: { stringValue: currency },
      cat:      { stringValue: 'Otro' },
    }
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    return res.status(500).json({ error: err });
  }

  return res.status(200).json({ ok: true, name, amount, currency });
}
