"use client";

import { useState } from "react";

export default function CopyButton({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={copy}
      className={`px-2 py-1 text-xs rounded-md bg-white/10 hover:bg-white/20 text-white border border-white/20 ${className || ""}`}
    >
      {copied ? "Copiado ✓" : "Copiar"}
    </button>
  );
}
