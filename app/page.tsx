"use client";

import { useEffect, useState } from "react";

type Status = {
  connected: boolean;
  name?: string;
  picture?: string;
  expires_at?: number;
  expired?: boolean;
};

export default function Home() {
  const [status, setStatus] = useState<Status | null>(null);
  const [url, setUrl] = useState("");
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ ok?: boolean; error?: string; id?: string } | null>(null);

  useEffect(() => {
    fetch("/api/status").then((r) => r.json()).then(setStatus);
    setPassword(sessionStorage.getItem("admin_password") || "");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    sessionStorage.setItem("admin_password", password);
    try {
      const res = await fetch("/api/repost", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": password },
        body: JSON.stringify({ url, message }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ ok: true, id: data.id });
        setUrl("");
        setMessage("");
      } else {
        setResult({ error: data.error || "Error" });
      }
    } catch (err: any) {
      setResult({ error: err.message || "Network error" });
    } finally {
      setSubmitting(false);
    }
  }

  const expiresInDays = status?.expires_at
    ? Math.max(0, Math.round((status.expires_at - Date.now()) / 86400000))
    : null;

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">LinkedIn Repost</h1>
          <p className="text-sm text-gray-500 mt-1">
            Repostea un enlace de LinkedIn en tu perfil desde un solo formulario.
          </p>
        </header>

        {status === null ? (
          <p className="text-gray-500">Cargando…</p>
        ) : !status.connected ? (
          <ConnectCard />
        ) : status.expired ? (
          <ConnectCard expired />
        ) : (
          <>
            <ProfileBadge status={status} expiresInDays={expiresInDays} />

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <Field label="URL del post de LinkedIn">
                <input
                  type="url"
                  required
                  placeholder="https://www.linkedin.com/posts/..."
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <Field label="Mensaje del repost (opcional)">
                <textarea
                  rows={4}
                  placeholder="Comparte tu opinión sobre este post…"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <Field label="Contraseña del equipo">
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </Field>

              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-lg bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium py-2.5 transition"
              >
                {submitting ? "Reposteando…" : "Aceptar y repostear"}
              </button>
            </form>

            {result?.ok && (
              <div className="mt-4 rounded-lg bg-green-50 border border-green-200 text-green-800 px-4 py-3 text-sm">
                ✓ Repost publicado correctamente{result.id ? ` (id ${result.id})` : ""}.
              </div>
            )}
            {result?.error && (
              <div className="mt-4 rounded-lg bg-red-50 border border-red-200 text-red-800 px-4 py-3 text-sm">
                {result.error}
              </div>
            )}
          </>
        )}

        <footer className="mt-8 text-xs text-gray-400 text-center">
          Solo el dueño del perfil debe usar &quot;Conectar LinkedIn&quot;. El equipo usa el formulario con la contraseña compartida.
        </footer>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-gray-700 mb-1">{label}</span>
      {children}
    </label>
  );
}

function ProfileBadge({
  status,
  expiresInDays,
}: {
  status: Status;
  expiresInDays: number | null;
}) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-gray-50 border border-gray-200 px-4 py-3">
      {status.picture ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={status.picture} alt="" className="w-10 h-10 rounded-full" />
      ) : (
        <div className="w-10 h-10 rounded-full bg-blue-100" />
      )}
      <div className="flex-1">
        <div className="text-sm font-medium">{status.name || "Perfil conectado"}</div>
        <div className="text-xs text-gray-500">
          Token válido {expiresInDays !== null ? `por ${expiresInDays} días` : ""}
        </div>
      </div>
      <a href="/api/auth/linkedin" className="text-xs text-blue-600 hover:underline">
        Re-conectar
      </a>
    </div>
  );
}

function ConnectCard({ expired }: { expired?: boolean } = {}) {
  return (
    <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center">
      <p className="text-sm text-gray-600 mb-4">
        {expired
          ? "El token de LinkedIn ha expirado. Vuelve a conectar tu perfil."
          : "Aún no has conectado tu perfil de LinkedIn. Hazlo una sola vez para autorizar a la app."}
      </p>
      <a
        href="/api/auth/linkedin"
        className="inline-block rounded-lg bg-[#0a66c2] hover:bg-[#004182] text-white font-medium px-5 py-2.5 transition"
      >
        Conectar con LinkedIn
      </a>
    </div>
  );
}
