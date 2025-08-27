// FILE: components/SettingsPanel.tsx
import React, { useState } from "react";

export default function SettingsPanel({
  apiBase,
  setApiBase,
}: {
  apiBase: string;
  setApiBase: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium">Settings</h2>
        <button
          onClick={() => setOpen(!open)}
          className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
        >
          {open ? "Hide Settings" : "Show Settings"}
        </button>
      </div>
      {open && (
        <div className="grid md:grid-cols-[1fr_auto] gap-3 items-center">
          <input
            className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none"
            value={apiBase}
            onChange={(e) => setApiBase(e.target.value)}
            placeholder="http://localhost:8000"
          />
          <button
            onClick={async () => {}}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition"
          >
            Test Connection
          </button>
        </div>
      )}
    </section>
  );
}
