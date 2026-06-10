"use client";

import { useState } from "react";
import { agregarGasto, CATEGORIAS } from "@/lib/firestore";
import { useAuth } from "./AuthProvider";
import { format } from "date-fns";

export function GastoForm({ onClose }: { onClose?: () => void }) {
  const { user } = useAuth();
  const [monto, setMonto] = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [categoria, setCategoria] = useState<string>(CATEGORIAS[0]);
  const [fecha, setFecha] = useState(format(new Date(), "yyyy-MM-dd"));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!user) return;
    const montoNum = parseFloat(monto.replace(",", "."));
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("Ingresá un monto válido");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await agregarGasto(user.uid, {
        monto: montoNum,
        descripcion: descripcion.trim() || "Sin descripción",
        categoria,
        fecha: new Date(fecha + "T12:00:00"),
      });
      setMonto("");
      setDescripcion("");
      setCategoria(CATEGORIAS[0]);
      setFecha(format(new Date(), "yyyy-MM-dd"));
      onClose?.();
    } catch {
      setError("Error al guardar. Intentá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="label">Monto (ARS)</label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder="0.00"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            className="input pl-7"
            required
            autoFocus
          />
        </div>
      </div>

      <div>
        <label className="label">Descripción</label>
        <input
          type="text"
          placeholder="ej: medialunas, nafta, uber..."
          value={descripcion}
          onChange={(e) => setDescripcion(e.target.value)}
          className="input"
          maxLength={100}
        />
      </div>

      <div>
        <label className="label">Categoría</label>
        <select
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
          className="input"
        >
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="label">Fecha</label>
        <input
          type="date"
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
          className="input"
          required
        />
      </div>

      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div className="flex gap-3 pt-1">
        {onClose && (
          <button type="button" onClick={onClose} className="btn-ghost flex-1">
            Cancelar
          </button>
        )}
        <button type="submit" disabled={loading} className="btn-primary flex-1">
          {loading ? "Guardando..." : "Guardar gasto"}
        </button>
      </div>
    </form>
  );
}
