"use client";

import { useMemo } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { startOfMonth } from "date-fns";
import type { Gasto } from "@/types";

const COLORS = [
  "#22c55e", "#3b82f6", "#f59e0b", "#a855f7",
  "#ef4444", "#06b6d4", "#ec4899", "#84cc16", "#f97316",
];

export function GraficoPorCategoria({ gastos }: { gastos: Gasto[] }) {
  const data = useMemo(() => {
    const inicioMes = startOfMonth(new Date());
    const totales: Record<string, number> = {};
    for (const g of gastos) {
      if (g.fecha >= inicioMes) {
        totales[g.categoria] = (totales[g.categoria] ?? 0) + g.monto;
      }
    }
    return Object.entries(totales)
      .map(([name, value]) => ({ name: name.replace(/^\S+\s/, ""), emoji: name.split(" ")[0], value }))
      .sort((a, b) => b.value - a.value);
  }, [gastos]);

  if (data.length === 0) return null;

  return (
    <div className="card space-y-4">
      <h2 className="font-semibold text-zinc-200">Gastos este mes por categoría</h2>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={55}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip
              formatter={(v: number) =>
                "$" + v.toLocaleString("es-AR", { minimumFractionDigits: 0 })
              }
              contentStyle={{ background: "#18181b", border: "1px solid #27272a", borderRadius: 12 }}
              labelStyle={{ color: "#e4e4e7" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="space-y-2">
        {data.map((item, i) => {
          const total = data.reduce((s, d) => s + d.value, 0);
          const pct = ((item.value / total) * 100).toFixed(0);
          return (
            <div key={item.name} className="flex items-center gap-2 text-sm">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ background: COLORS[i % COLORS.length] }}
              />
              <span className="flex-1 text-zinc-300">
                {item.emoji} {item.name}
              </span>
              <span className="text-zinc-500 text-xs">{pct}%</span>
              <span className="text-zinc-200 font-medium w-24 text-right">
                ${item.value.toLocaleString("es-AR", { minimumFractionDigits: 0 })}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
