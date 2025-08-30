import React from "react";

export function clamp01(x: number | undefined) {
  if (typeof x !== "number" || isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

export type Region = { country: string; state?: string };
export type FeatureRequest = {
  feature: string;
  feature_description: string;
  regions?: Region[];
};

export function Labeled({
  label,
  children,
}: React.PropsWithChildren<{ label: string }>) {
  return (
    <label className="grid gap-1">
      <span className="text-sm text-neutral-300">{label}</span>
      {children}
    </label>
  );
}

export function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid md:grid-cols-[160px_1fr] gap-2 items-start">
      <div className="text-neutral-400">{label}</div>
      <div className="text-neutral-100">{value}</div>
    </div>
  );
}

export function RegionCard({
  region,
  onFeedback,
}: {
  region: Region & { available: boolean; reasoning: string };
  onFeedback: (text: string) => Promise<void> | void;
}) {
  const [open, setOpen] = React.useState(false);
  const [text, setText] = React.useState("");

  const tag = region.state
    ? `${region.country}/${region.state}`
    : region.country;
  return (
    <div className="rounded-2xl border border-neutral-700 p-3 bg-neutral-900/40 grid gap-2">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-1 rounded-lg text-xs bg-white/10">
            {tag}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-lg ${
              region.available
                ? "bg-green-500/20 text-green-300"
                : "bg-red-500/20 text-red-300"
            }`}
          >
            {region.available ? "available" : "blocked"}
          </span>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          className="text-sm px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 transition"
        >
          {open ? "Hide details" : "Show details"}
        </button>
      </div>
      {open && (
        <div className="text-sm text-neutral-200 whitespace-pre-wrap">
          {region.reasoning}
        </div>
      )}
      <div className="grid gap-2">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Feedback for ${tag} (why reject / request changes)`}
          rows={3}
          className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none text-sm"
        />
        <div className="flex gap-2">
          <button
            onClick={() => setText("")}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 transition text-sm"
          >
            Clear
          </button>
          <button
            onClick={() => onFeedback(text)}
            className="px-3 py-2 rounded-xl bg-amber-500/90 hover:bg-amber-500 transition text-sm"
          >
            Send Feedback
          </button>
        </div>
      </div>
    </div>
  );
}

export function Badge({
  children,
  tone = "indigo",
}: {
  children: React.ReactNode;
  tone?: "indigo" | "emerald" | "rose" | "amber";
}) {
  const map: Record<string, string> = {
    indigo: "bg-indigo-500/15 text-indigo-300 border-indigo-400/40",
    emerald: "bg-emerald-500/15 text-emerald-300 border-emerald-400/40",
    rose: "bg-rose-500/15 text-rose-300 border-rose-400/40",
    amber: "bg-amber-500/15 text-amber-300 border-amber-400/40",
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs ${map[tone]}`}
    >
      {children}
    </span>
  );
}

export function Meter({ value }: { value: number }) {
  const w = `${(clamp01(value) * 100).toFixed(0)}%`;
  return (
    <div className="w-full h-2 rounded-full bg-neutral-700/60 overflow-hidden">
      <div className="h-full rounded-full bg-indigo-400" style={{ width: w }} />
    </div>
  );
}

export function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-slate-100">{children}</h3>;
}

export function Subtle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-neutral-300">{children}</div>;
}

export function CodeSmall({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs bg-neutral-900/70 border border-neutral-700 px-2 py-1 rounded">
      {children}
    </code>
  );
}
