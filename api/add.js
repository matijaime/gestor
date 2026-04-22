export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Accept both query params (GET) and JSON body (POST)
  const q = req.query;
  const b = req.body || {};
  const name     = q.name     || b.name;
  const amount   = q.amount   || b.amount;
  const currency = q.currency || b.currency || 'ARS';
  const uid      = q.uid      || b.uid      || 'iPnoL7139ThQ1sctqWSfokqhNvV2';

  if (!name || !amount) {
    return res.status(400).json({ error: 'Faltan parámetros: name, amount' });
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
