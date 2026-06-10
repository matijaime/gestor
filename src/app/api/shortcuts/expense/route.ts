import { NextRequest, NextResponse } from "next/server";
import { initializeApp, getApps, cert } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

// ── Inicializar Firebase Admin ──────────────────────────────────────────────
// Usamos la service account desde variables de entorno (server-side only)
function getAdminDb() {
  if (getApps().length === 0) {
    initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
        clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, "\n"),
      }),
    });
  }
  return getFirestore();
}

// ── Categorías válidas ──────────────────────────────────────────────────────
const CATEGORIAS_VALIDAS = [
  "🍔 Comida",
  "🚗 Transporte",
  "🏠 Casa",
  "⚡ Servicios",
  "🎬 Entretenimiento",
  "👕 Ropa",
  "💊 Salud",
  "📚 Educación",
  "💸 Otros",
];

// ── Handler principal ───────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // 1. Verificar API key
  const apiKey = req.headers.get("x-api-key");
  const validKey = process.env.SHORTCUTS_API_KEY;

  if (!validKey || apiKey !== validKey) {
    return NextResponse.json(
      { ok: false, error: "API key inválida" },
      { status: 401 }
    );
  }

  // 2. Parsear body
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Body inválido, esperaba JSON" },
      { status: 400 }
    );
  }

  const { monto, descripcion, categoria } = body as Record<string, unknown>;
  const ownerUid = process.env.SHORTCUTS_OWNER_UID;

  if (!ownerUid) {
    return NextResponse.json(
      { ok: false, error: "SHORTCUTS_OWNER_UID no configurado en el servidor" },
      { status: 500 }
    );
  }

  // 3. Validar campos
  const montoNum = typeof monto === "string" ? parseFloat(monto) : Number(monto);
  if (isNaN(montoNum) || montoNum <= 0) {
    return NextResponse.json(
      { ok: false, error: "monto debe ser un número positivo" },
      { status: 400 }
    );
  }

  const desc = typeof descripcion === "string" && descripcion.trim()
    ? descripcion.trim().slice(0, 100)
    : "Sin descripción";

  // Normalizar categoría: acepta el emoji solo, el nombre solo, o el combo
  let catFinal = "💸 Otros";
  if (typeof categoria === "string") {
    const found = CATEGORIAS_VALIDAS.find(
      (c) =>
        c === categoria ||
        c.toLowerCase().includes(categoria.toLowerCase()) ||
        categoria.toLowerCase().includes(c.replace(/^\S+\s/, "").toLowerCase())
    );
    if (found) catFinal = found;
  }

  // 4. Guardar en Firestore
  try {
    const db = getAdminDb();
    const ref = await db.collection("gastos").add({
      uid: ownerUid,
      monto: montoNum,
      descripcion: desc,
      categoria: catFinal,
      fecha: Timestamp.now(),
      creadoEn: Timestamp.now(),
      fuente: "shortcut",
    });

    return NextResponse.json(
      {
        ok: true,
        id: ref.id,
        message: `✅ Gasto guardado: $${montoNum.toLocaleString("es-AR")} en ${catFinal}`,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error("Error Firestore:", err);
    return NextResponse.json(
      { ok: false, error: "Error al guardar en la base de datos" },
      { status: 500 }
    );
  }
}

// GET de prueba (para verificar que el endpoint está activo)
export async function GET() {
  return NextResponse.json({ ok: true, message: "Gestor de Finanzas API activa 💰" });
}
