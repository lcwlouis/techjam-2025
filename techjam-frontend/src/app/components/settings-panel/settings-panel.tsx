// FILE: components/SettingsPanel.tsx
import React, { useEffect, useState } from "react";
import { SectionTitle, Labeled } from "../card-components/card-components";

type Terminology = Record<string, string>;

export default function SettingsPanel({
  apiBase,
  setApiBase,
}: {
  apiBase: string;
  setApiBase: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const [kvText, setKvText] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  // Optional: auto-load existing terminology when panel opens
  useEffect(() => {
    const load = async () => {
      if (!open || !apiBase) return;
      try {
        setMsg(null);
        setLoading(true);
        const r = await fetch(`${apiBase}/terminology_table`, {
          method: "GET",
          cache: "no-store",
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache",
          },
        });
        if (!r.ok) throw new Error(`GET /terminology_table -> ${r.status}`);
        const data: Terminology = await r.json();
        const text = Object.entries(data)
          .map(([k, v]) => `${k} = ${v}`)
          .join("\n");
        console.log("Loaded terminology:", data);
        setKvText(text);
      } catch (e: any) {
        setMsg(e.message || "Failed to load terminology");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [open, apiBase]);

  async function fetchTerminology() {
    setLoading(true);
    const r = await fetch(`${apiBase}/terminology_table`, {
      method: "GET",
      cache: "no-store",
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-cache",
      },
    });
    if (!r.ok) throw new Error(`GET /terminology_table -> ${r.status}`);
    const data: Terminology = await r.json();
    const text = Object.entries(data)
      .map(([k, v]) => `${k} = ${v}`)
      .join("\n");
    console.log("Loaded terminology:", data);
    setKvText(text);
  }

  function parseKv(text: string): Terminology {
    const out: Terminology = {};
    const lines = text.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const raw = lines[i].trim();
      if (!raw) continue; // skip blanks
      const m = raw.match(/^([^=:#]+)\s*[:=]\s*(.+)$/); // supports "KEY = val" or "KEY: val"
      if (!m)
        throw new Error(`Line ${i + 1} is not in KEY = VALUE format:\n${raw}`);
      const key = m[1].trim();
      const val = m[2].trim();
      if (!key) throw new Error(`Line ${i + 1}: empty key`);

      if (key in out) {
        const overwrite = window.confirm(
          `Duplicate definition for key "${key}".\n` +
            `Existing value: "${out[key]}"\n` +
            `New value: "${val}"\n\n` +
            `Do you want to overwrite it?`
        );
        if (!overwrite) {
          continue;
        }
      }
      out[key] = val;
    }
    return out;
  }

  async function handleSave() {
    try {
      setMsg(null);
      const parsed = parseKv(kvText);
      setLoading(true);
      const r = await fetch(`${apiBase}/update_terminology_table`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ terms: parsed }),
      });
      if (!r.ok)
        throw new Error(`POST /update_terminology_table -> ${r.status}`);
      setMsg("Saved terminology ✅");
      fetchTerminology(); // refresh
    } catch (e: any) {
      setMsg(e.message || "Failed to save terminology");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <SectionTitle>Settings</SectionTitle>
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
        >
          {open ? "Hide Settings" : "Show Settings"}
        </button>
      </div>

      {open && (
        <div className="grid gap-4">
          {/* Terminology KV Textbox */}
          <div className="grid gap-2">
            <div className="flex items-center justify-between"></div>{" "}
            <Labeled label="Feature Description">
              <textarea
                className="min-h-[180px] w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none font-mono text-sm"
                placeholder={`NR = Not recommended\nPF = Personalized feed\nGH = Geo-handler; module routing by region\n...`}
                value={kvText}
                onChange={(e) => setKvText(e.target.value)}
              />{" "}
              <p className="text-xs text-neutral-400">
                Tip: one entry per line. Supports <code>KEY = Value</code> or{" "}
                <code>KEY: Value</code>. Existing terms load automatically when
                you open this panel.
              </p>
            </Labeled>
            <div className="flex gap-2">
              <button
                onClick={handleSave}
                className="px-4 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition disabled:opacity-50"
                disabled={loading || !apiBase}
              >
                {loading ? "Saving..." : "Save"}
              </button>
            </div>
            {msg && (
              <div
                className={`text-sm ${
                  msg.includes("✅") ? "text-emerald-400" : "text-rose-400"
                }`}
              >
                {msg}
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
