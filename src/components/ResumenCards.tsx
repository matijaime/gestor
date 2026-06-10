"use client";

import { useMemo } from "react";
import { startOfMonth, startOfWeek } from "date-fns";
import type { Gasto } from "@/types";

export function ResumenCards({ gastos }: { gastos: Gasto[] }) {
  const ahora = new Date();

  const { totalMes, totalSemana, totalHoy, cantidadMes } = useMemo(() => {
    const inicioMes = startOfMonth(ahora);
    const inicioSemana = startOfWeek(ahora, { weekStartsOn: 1 });
    const hoyStr = ahora.toDateString();

    let totalMes = 0, totalSemana = 0, totalHoy = 0, cantidadMes = 0;

    for (const g of gastos) {
      if (g.fecha >= inicioMes) {
        totalMes += g.monto;
        cantidadMes++;
      }
      if (g.fecha >= inicioSemana) totalSemana += g.monto;
      if (g.fecha.toDateString() === hoyStr) totalHoy += g.monto;
    }

    return { totalMes, totalSemana, totalHoy, cantidadMes };
  }, [gastos]);

  const fmt = (n: number) =>
    "$" + n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3">
      <Card label="Este mes" value={fmt(totalMes)} sub={`${cantidadMes} gastos`} color="green" />
      <Card label="Esta semana" value={fmt(totalSemana)} color="blue" />
      <Card label="Hoy" value={fmt(totalHoy)} color="yellow" />
      <Card label="Total gastos" value={gastos.length.toString()} sub="registrados" color="purple" />
    </div>
  );
}

function Card({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color: "green" | "blue" | "yellow" | "purple";
}) {
  const colors = {
    green: "text-green-400",
    blue: "text-blue-400",
    yellow: "text-yellow-400",
    purple: "text-purple-400",
  };

  return (
    <div className="card space-y-1">
      <p className="text-xs text-zinc-400 font-medium">{label}</p>
      <p className={`text-xl font-bold ${colors[color]}`}>{value}</p>
      {sub && <p className="text-xs text-zinc-600">{sub}</p>}
    </div>
  );
}
