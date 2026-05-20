import { cookies } from "next/headers";
import Link from "next/link";
import CopyButton from "./CopyButton";

export const dynamic = "force-dynamic";

type Pending = {
  access_token: string;
  expires_at: number;
  sub: string;
  name?: string;
  picture?: string;
};

export default async function ConnectedPage() {
  const store = await cookies();
  const raw = store.get("li_token_pending")?.value;

  if (!raw) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 text-center">
          <h1 className="text-xl font-semibold mb-2">Sin token pendiente</h1>
          <p className="text-sm text-gray-600 mb-6">
            Este enlace solo es válido durante 10 minutos después de conectar LinkedIn.
          </p>
          <Link href="/" className="text-blue-600 hover:underline">
            Volver al inicio
          </Link>
        </div>
      </main>
    );
  }

  let data: Pending;
  try {
    data = JSON.parse(raw);
  } catch {
    return (
      <main className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-xl bg-white rounded-2xl shadow-lg p-8 text-center text-red-600">
          Token corrupto. Vuelve a conectar.
        </div>
      </main>
    );
  }

  const expiresInDays = Math.max(0, Math.round((data.expires_at - Date.now()) / 86400000));

  const envLines = [
    `LINKEDIN_TOKEN=${data.access_token}`,
    `LINKEDIN_SUB=${data.sub}`,
    `LINKEDIN_TOKEN_EXPIRES_AT=${data.expires_at}`,
    data.name ? `LINKEDIN_NAME=${data.name}` : null,
    data.picture ? `LINKEDIN_PICTURE=${data.picture}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const vercelEntries: [string, string][] = [
    ["LINKEDIN_TOKEN", data.access_token],
    ["LINKEDIN_SUB", data.sub],
    ["LINKEDIN_TOKEN_EXPIRES_AT", String(data.expires_at)],
  ];
  if (data.name) vercelEntries.push(["LINKEDIN_NAME", data.name]);
  if (data.picture) vercelEntries.push(["LINKEDIN_PICTURE", data.picture]);

  const vercelCmd = vercelEntries
    .map(([k, v]) => `echo "${v.replace(/"/g, '\\"')}" | vercel env add ${k} production`)
    .join("\n");

  return (
    <main className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-lg p-8">
        <header className="mb-6">
          <h1 className="text-2xl font-semibold tracking-tight">¡Conectado! 🔗</h1>
          <p className="text-sm text-gray-500 mt-1">
            {data.name ? `Como ${data.name}.` : ""} Token válido por ~{expiresInDays} días.
          </p>
          <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 mt-3">
            ⚠️ Esta página se mostrará durante 10 minutos. Guarda los valores ahora —
            por seguridad no podrás volver a verlos.
          </p>
        </header>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            1) Setear en Vercel — opción dashboard (recomendado)
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Ve a tu proyecto en Vercel → <strong>Settings → Environment Variables</strong> y
            añade estas 5 variables a <em>Production</em>. Después haz un{" "}
            <strong>Redeploy</strong>.
          </p>
          <div className="relative">
            <pre className="bg-gray-100 text-gray-900 text-xs rounded-lg p-4 overflow-x-auto">
{envLines}
            </pre>
            <CopyButton text={envLines} className="absolute top-2 right-2" />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            2) O con Vercel CLI desde tu terminal
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Si tienes <code>vercel</code> CLI instalado y el proyecto enlazado
            (<code>vercel link</code>):
          </p>
          <div className="relative">
            <pre className="bg-gray-900 text-gray-100 text-xs rounded-lg p-4 overflow-x-auto">
{vercelCmd}
            </pre>
            <CopyButton text={vercelCmd} className="absolute top-2 right-2" />
          </div>
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-medium text-gray-700 mb-2">
            3) Para desarrollo local
          </h2>
          <p className="text-xs text-gray-500 mb-2">
            Pega lo mismo al final de tu <code>.env.local</code> y reinicia <code>npm run dev</code>.
          </p>
        </section>

        <section className="text-xs text-gray-500 space-y-1">
          <div>
            <span className="font-medium text-gray-700">Sub (member URN):</span>{" "}
            <code>urn:li:person:{data.sub}</code>
          </div>
          <div>
            <span className="font-medium text-gray-700">Expira:</span>{" "}
            {new Date(data.expires_at).toLocaleString()}
          </div>
        </section>

        <div className="mt-8 flex items-center justify-between">
          <Link href="/" className="text-blue-600 hover:underline text-sm">
            Volver al inicio
          </Link>
          <span className="text-xs text-gray-400">
            Tras setear las env vars en Vercel haz un Redeploy.
          </span>
        </div>
      </div>
    </main>
  );
}
