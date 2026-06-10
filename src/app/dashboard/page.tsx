"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { Plus, LogOut, Settings } from "lucide-react";
import { auth } from "@/lib/firebase";
import { suscribirGastos } from "@/lib/firestore";
import { useAuth } from "@/components/AuthProvider";
import { GastoForm } from "@/components/GastoForm";
import { GastoList } from "@/components/GastoList";
import { ResumenCards } from "@/components/ResumenCards";
import { GraficoPorCategoria } from "@/components/GraficoPorCategoria";
import type { Gasto } from "@/types";

export default function DashboardPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [gastos, setGastos] = useState<Gasto[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [tab, setTab] = useState<"lista" | "grafico">("lista");

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  useEffect(() => {
    if (!user) return;
    const unsub = suscribirGastos(user.uid, setGastos);
    return unsub;
  }, [user]);

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-green-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen max-w-lg mx-auto px-4 pb-20 pt-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-green-600 rounded-xl flex items-center justify-center text-lg">
            💰
          </div>
          <div>
            <h1 className="font-bold text-zinc-100 leading-none">Mis Finanzas</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{user.displayName?.split(" ")[0]}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => router.push("/settings")}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
            title="Configuración"
          >
            <Settings size={18} />
          </button>
          <button
            onClick={() => signOut(auth)}
            className="w-9 h-9 flex items-center justify-center rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 transition-colors"
            title="Cerrar sesión"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      {/* Resumen */}
      <ResumenCards gastos={gastos} />

      {/* Tabs */}
      <div className="flex gap-2 mt-5 mb-4">
        <button
          onClick={() => setTab("lista")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === "lista" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Historial
        </button>
        <button
          onClick={() => setTab("grafico")}
          className={`flex-1 py-2 rounded-xl text-sm font-medium transition-colors ${
            tab === "grafico" ? "bg-zinc-700 text-zinc-100" : "text-zinc-500 hover:text-zinc-300"
          }`}
        >
          Gráficos
        </button>
      </div>

      {/* Contenido */}
      {tab === "lista" ? (
        <>
          {showForm && (
            <div className="card mb-5">
              <h2 className="font-semibold text-zinc-200 mb-4">Nuevo gasto</h2>
              <GastoForm onClose={() => setShowForm(false)} />
            </div>
          )}
          <GastoList gastos={gastos} />
        </>
      ) : (
        <GraficoPorCategoria gastos={gastos} />
      )}

      {/* FAB */}
      {!showForm && (
        <button
          onClick={() => { setTab("lista"); setShowForm(true); }}
          className="fixed bottom-6 right-6 w-14 h-14 bg-green-600 hover:bg-green-500 active:scale-95
                     rounded-2xl shadow-lg shadow-green-900/40 flex items-center justify-center
                     text-white transition-all z-50"
        >
          <Plus size={26} />
        </button>
      )}
    </div>
  );
}
