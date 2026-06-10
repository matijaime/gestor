import {
  collection,
  addDoc,
  query,
  where,
  orderBy,
  getDocs,
  deleteDoc,
  doc,
  Timestamp,
  onSnapshot,
  type QuerySnapshot,
  type DocumentData,
} from "firebase/firestore";
import { db } from "./firebase";
import type { Gasto, NuevoGasto } from "@/types";

export const CATEGORIAS = [
  "🍔 Comida",
  "🚗 Transporte",
  "🏠 Casa",
  "⚡ Servicios",
  "🎬 Entretenimiento",
  "👕 Ropa",
  "💊 Salud",
  "📚 Educación",
  "💸 Otros",
] as const;

export type Categoria = (typeof CATEGORIAS)[number];

// Agregar gasto
export async function agregarGasto(uid: string, gasto: NuevoGasto): Promise<string> {
  const ref = await addDoc(collection(db, "gastos"), {
    uid,
    monto: gasto.monto,
    descripcion: gasto.descripcion,
    categoria: gasto.categoria,
    fecha: Timestamp.fromDate(gasto.fecha ?? new Date()),
    creadoEn: Timestamp.now(),
  });
  return ref.id;
}

// Obtener gastos en tiempo real
export function suscribirGastos(
  uid: string,
  callback: (gastos: Gasto[]) => void
) {
  const q = query(
    collection(db, "gastos"),
    where("uid", "==", uid),
    orderBy("fecha", "desc")
  );

  return onSnapshot(q, (snap: QuerySnapshot<DocumentData>) => {
    const gastos: Gasto[] = snap.docs.map((d) => ({
      id: d.id,
      uid: d.data().uid,
      monto: d.data().monto,
      descripcion: d.data().descripcion,
      categoria: d.data().categoria,
      fecha: (d.data().fecha as Timestamp).toDate(),
      creadoEn: (d.data().creadoEn as Timestamp).toDate(),
    }));
    callback(gastos);
  });
}

// Eliminar gasto
export async function eliminarGasto(id: string): Promise<void> {
  await deleteDoc(doc(db, "gastos", id));
}
