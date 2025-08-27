import React from "react";

type Region = {
  country: string;
  state?: string;
  available: boolean;
  reasoning: string;
};

type AuditLogProps = {
  data: {
    status: string;
    uuid: string;
    report: {
      feature: string;
      description: string;
      regions_flagged: Region[];
    };
  } | null;
};

export default function AuditLog({ data }: AuditLogProps) {
  if (!data) {
    return (
      <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
        <h2 className="text-xl font-medium">Audit Log</h2>
        <p className="text-sm text-neutral-400">No data to display yet.</p>
      </section>
    );
  }

  return (
    <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-medium">Audit Log</h2>
        <span className="text-xs text-neutral-400">UUID: {data.uuid}</span>
      </div>

      {/* Top-level status */}
      <div className="text-sm text-neutral-300">
        <strong>Status:</strong> {data.status}
      </div>

      {/* Feature details */}
      <div className="grid gap-1 text-sm text-neutral-300">
        <div>
          <strong>Feature:</strong> {data.report.feature}
        </div>
        <div>
          <strong>Description:</strong> {data.report.description}
        </div>
      </div>

      {/* Regions */}
      <div className="grid gap-2">
        <h3 className="font-medium">Regions</h3>
        <div className="grid gap-2">
          {data.report.regions_flagged.map((r, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-neutral-700 bg-neutral-900/40 p-3 grid gap-1"
            >
              <div className="flex items-center justify-between text-sm">
                <span className="font-medium">
                  {r.state ? `${r.country}/${r.state}` : r.country}
                </span>
                <span
                  className={`text-xs px-2 py-1 rounded-lg ${
                    r.available
                      ? "bg-green-500/20 text-green-300"
                      : "bg-red-500/20 text-red-300"
                  }`}
                >
                  {r.available ? "available" : "blocked"}
                </span>
              </div>
              <div className="text-xs text-neutral-400 whitespace-pre-wrap">
                {r.reasoning}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
