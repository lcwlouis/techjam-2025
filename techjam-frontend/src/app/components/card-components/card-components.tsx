import React from "react";

export type Region = { country: string; state?: string };
export type FeatureRequest = {
  feature: string;
  feature_description: string;
  regions?: Region[];
};

type HumanFeedbackPayload = { uuid: string; region: string; feedback: string };

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
