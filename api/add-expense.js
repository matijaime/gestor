const { cert, getApps, initializeApp } = require('firebase-admin/app');
const { FieldValue, getFirestore }     = require('firebase-admin/firestore');
const { randomUUID }                   = require('crypto');

let _db = null;

function getDb() {
  if (_db) return _db;
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error('Firebase Admin env vars missing');
  }
  if (!getApps().length) {
    initializeApp({
      credential: cert({
        projectId:   FIREBASE_PROJECT_ID,
        clientEmail: FIREBASE_CLIENT_EMAIL,
        privateKey:  FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
      }),
    });
  }
  _db = getFirestore();
  return _db;
}

const VALID_CURRENCIES = new Set(['ARS', 'USD']);

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST' && req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // GET: token in query param — POST: Bearer token in header
  let token = '';
  if (req.method === 'GET') {
    token = (req.query.token || '').trim();
  } else {
    const auth = (req.headers['authorization'] || '').trim();
    token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  }
  if (!process.env.SHORTCUT_TOKEN || token !== process.env.SHORTCUT_TOKEN) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Accept params from query string (GET) or body (POST)
  const q = req.query;
  const b = req.body || {};
  const name     = q.name     || b.name;
  const amount   = q.amount   || b.amount;
  const currency = q.currency || b.currency || 'ARS';
  const category = q.category || b.category || 'Otro';
  const note     = q.note     || b.note     || '';

  if (!name || typeof name !== 'string' || !name.trim()) {
    return res.status(400).json({ error: 'name es requerido' });
  }
  const amt = parseFloat(amount);
  if (!amount || isNaN(amt) || amt <= 0) {
    return res.status(400).json({ error: 'amount debe ser un número mayor a 0' });
  }
  if (!VALID_CURRENCIES.has(String(currency))) {
    return res.status(400).json({ error: 'currency debe ser ARS o USD' });
  }
  if (!category || typeof category !== 'string') {
    return res.status(400).json({ error: 'category es requerida' });
  }

  let db;
  try {
    db = getDb();
  } catch {
    return res.status(503).json({ error: 'Firebase Admin SDK no configurado — faltan env vars' });
  }

  const id = randomUUID();
  await db.collection('quick_expenses').add({
    id,
    name:     name.trim(),
    amount:   amt,
    currency: String(currency),
    category: String(category),
    note:     String(note || ''),
    addedAt:  FieldValue.serverTimestamp(),
  });

  const label = currency === 'ARS'
    ? `$${Math.round(amt).toLocaleString('es-AR')}`
    : `USD ${amt.toLocaleString('es-AR')}`;

  return res.status(200).json({
    ok:      true,
    message: `Gasto guardado: ${name.trim()} · ${label} ${currency}`,
  });
};
