"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check, RefreshCw } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [copied, setCopied] = useState<"uid" | "url" | null>(null);

  useEffect(() => {
    if (!loading && !user) router.replace("/login");
  }, [user, loading, router]);

  if (loading || !user) return null;

  const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shortcutUrl = `${baseUrl}/api/shortcuts/expense`;

  async function copy(text: string, key: "uid" | "url") {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-screen max-w-5xl mx-auto px-4 sm:px-6 md:px-8 pb-20 pt-4 sm:pt-6">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-zinc-400 hover:text-zinc-200 mb-6 transition-colors text-sm sm:text-base"
      >
        <ArrowLeft size={18} /> Volver
      </button>

      <h1 className="text-xl sm:text-2xl font-bold mb-6">Configuración</h1>

      {/* Perfil */}
      <div className="card mb-4 space-y-3">
        <h2 className="font-semibold text-zinc-300">Tu cuenta</h2>
        <div className="flex items-center gap-3">
          {user.photoURL && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={user.photoURL} alt="" className="w-10 h-10 rounded-full" />
          )}
          <div>
            <p className="font-medium">{user.displayName}</p>
            <p className="text-sm text-zinc-500">{user.email}</p>
          </div>
        </div>
      </div>

      {/* Shortcut info */}
      <div className="card space-y-4">
        <h2 className="font-semibold text-zinc-300">Atajo de iPhone</h2>
        <p className="text-sm text-zinc-400">
          Usá estos datos para configurar el atajo en tu iPhone.
          Necesitás la URL del endpoint y tu UID de Firebase.
        </p>

        <div>
          <label className="label">URL del endpoint</label>
          <div className="flex gap-2">
            <code className="input flex-1 text-xs text-green-400 font-mono truncate">
              {shortcutUrl}
            </code>
            <button
              onClick={() => copy(shortcutUrl, "url")}
              className="btn-ghost px-3"
            >
              {copied === "url" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div>
          <label className="label">Tu UID (para .env.local)</label>
          <div className="flex gap-2">
            <code className="input flex-1 text-xs text-yellow-400 font-mono truncate">
              {user.uid}
            </code>
            <button
              onClick={() => copy(user.uid, "uid")}
              className="btn-ghost px-3"
            >
              {copied === "uid" ? <Check size={16} className="text-green-400" /> : <Copy size={16} />}
            </button>
          </div>
        </div>

        <div className="bg-zinc-800 rounded-xl p-3 text-xs text-zinc-400 space-y-1">
          <p className="font-semibold text-zinc-300">Cómo usar el atajo:</p>
          <p>1. Instalá el atajo desde el link del README</p>
          <p>2. Al ejecutarlo, pedirá monto, descripción y categoría</p>
          <p>3. Se guardará automáticamente en tu cuenta</p>
        </div>
      </div>
    </div>
  );
}
