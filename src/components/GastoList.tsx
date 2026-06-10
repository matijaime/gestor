"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Trash2 } from "lucide-react";
import { eliminarGasto } from "@/lib/firestore";
import type { Gasto } from "@/types";
import { clsx } from "clsx";

export function GastoList({ gastos }: { gastos: Gasto[] }) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    if (!confirm("¿Eliminar este gasto?")) return;
    setDeletingId(id);
    try {
      await eliminarGasto(id);
    } finally {
      setDeletingId(null);
    }
  }

  if (gastos.length === 0) {
    return (
      <div className="text-center py-16 text-zinc-500">
        <div className="text-4xl mb-3">🧾</div>
        <p className="font-medium">Sin gastos todavía</p>
        <p className="text-sm mt-1">Agregá tu primer gasto arriba</p>
      </div>
    );
  }

  // Agrupar por fecha
  const porFecha = gastos.reduce<Record<string, Gasto[]>>((acc, g) => {
    const key = format(g.fecha, "yyyy-MM-dd");
    if (!acc[key]) acc[key] = [];
    acc[key].push(g);
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      {Object.entries(porFecha).map(([fechaKey, items]) => {
        const fecha = new Date(fechaKey + "T12:00:00");
        const total = items.reduce((s, g) => s + g.monto, 0);
        return (
          <div key={fechaKey}>
            <div className="flex items-center justify-between mb-2 px-1">
              <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                {format(fecha, "EEEE dd MMM", { locale: es })}
              </span>
              <span className="text-xs text-zinc-500">
                ${total.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </span>
            </div>
            <div className="space-y-2">
              {items.map((g) => (
                <div
                  key={g.id}
                  className={clsx(
                    "card flex items-center gap-3 py-3 transition-opacity",
                    deletingId === g.id && "opacity-40"
                  )}
                >
                  <span className="text-xl w-8 text-center flex-shrink-0">
                    {g.categoria.split(" ")[0]}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-zinc-100 truncate">{g.descripcion}</p>
                    <p className="text-xs text-zinc-500 truncate">{g.categoria.replace(/^\S+\s/, "")}</p>
                  </div>
                  <span className="font-semibold text-green-400 flex-shrink-0">
                    ${g.monto.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
                  </span>
                  <button
                    onClick={() => handleDelete(g.id)}
                    disabled={deletingId === g.id}
                    className="text-zinc-600 hover:text-red-400 transition-colors p-1"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
