"use client";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

interface FinalReport {
  feature: string;
  feature_description: string;
  needs_geo_specific_logic: boolean;
  reasoning: string;
  regions_affected?: Array<{
    region: string;
    requirement_summary: string;
    regulations?: Array<{
      name: string;
      citation: string;
      snippet: string;
      source_id: string;
    }>;
  }>;
  past_case_references?: Array<{
    case_id: string;
    similarity_reason: string;
    source_id: string;
  }>;
  confidence: number; // 0..1
}

interface SSEFinalOutput {
  final_report: FinalReport | Json; // tolerate string/plain JSON if backend varies
  jurors?: Record<string, Json>;
}

function formatPct(x: number | undefined) {
  if (typeof x !== "number" || isNaN(x)) return "—";
  const pct = Math.max(0, Math.min(1, x)) * 100;
  return `${pct.toFixed(0)}%`;
}

function clamp01(x: number | undefined) {
  if (typeof x !== "number" || isNaN(x)) return 0;
  return Math.max(0, Math.min(1, x));
}

function isFinalReportObj(x: any): x is FinalReport {
  return x && typeof x === "object" && "feature" in x && "confidence" in x;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded bg-neutral-900/80 border border-neutral-700 text-neutral-200 text-xs">
      {children}
    </span>
  );
}

function Badge({
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

function Meter({ value }: { value: number }) {
  const w = `${(clamp01(value) * 100).toFixed(0)}%`;
  return (
    <div className="w-full h-2 rounded-full bg-neutral-700/60 overflow-hidden">
      <div className="h-full rounded-full bg-indigo-400" style={{ width: w }} />
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-lg font-semibold text-slate-100">{children}</h3>;
}

function Subtle({ children }: { children: React.ReactNode }) {
  return <div className="text-sm text-neutral-300">{children}</div>;
}

function CodeSmall({ children }: { children: React.ReactNode }) {
  return (
    <code className="text-xs bg-neutral-900/70 border border-neutral-700 px-2 py-1 rounded">
      {children}
    </code>
  );
}

export default function FinalReportSection({
  data,
  colorFromString,
}: {
  data: SSEFinalOutput;
  colorFromString: (s: string) => {
    text: string;
    border: string;
    bg: string;
    dot: string;
  };
}) {
  const fr = isFinalReportObj(data.final_report) ? data.final_report : null;

  return (
    <section className="grid gap-5 bg-neutral-800/60 rounded-2xl p-5 border border-neutral-700/50">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">Final Report</h2>
          <p className="text-sm text-neutral-300">
            Consolidated Judge output based on Jury reports.
          </p>
        </div>
        {fr && (
          <div className="flex items-center gap-2">
            <Badge tone={fr.needs_geo_specific_logic ? "emerald" : "rose"}>
              {fr.needs_geo_specific_logic
                ? "Geo-specific logic: Yes"
                : "Geo-specific logic: No"}
            </Badge>
            <Badge tone="amber">Confidence: {formatPct(fr.confidence)}</Badge>
          </div>
        )}
      </div>

      {/* Confidence meter */}
      {fr && (
        <div className="grid gap-2">
          <Subtle>Confidence</Subtle>
          <Meter value={fr.confidence} />
        </div>
      )}

      {/* Feature summary */}
      {fr ? (
        <div className="grid gap-2">
          <SectionTitle>{fr.feature}</SectionTitle>
          <Subtle>{fr.feature_description}</Subtle>
        </div>
      ) : (
        <div className="text-sm text-neutral-300">
          <em>
            Final report content is not an object (raw JSON/string). See Raw
            Payload below.
          </em>
        </div>
      )}

      {/* Regions & Regulations */}
      {fr?.regions_affected?.length ? (
        <div className="grid gap-3">
          <SectionTitle>Regions & Regulations</SectionTitle>
          <div className="grid gap-3">
            {fr.regions_affected.map((r, i) => (
              <div
                key={`${r.region}-${i}`}
                className="rounded-xl border border-neutral-700/60 p-3 bg-neutral-900/40"
              >
                <div className="flex items-center justify-between">
                  <div className="text-slate-100 font-medium">{r.region}</div>
                  <Badge>
                    <Kbd>summary</Kbd>
                  </Badge>
                </div>
                <p className="text-sm text-neutral-300 mt-1">
                  {r.requirement_summary}
                </p>
                {r.regulations?.length ? (
                  <div className="mt-3 grid gap-2">
                    {r.regulations.map((g, j) => (
                      <div
                        key={`${g.citation}-${j}`}
                        className="rounded-lg border border-neutral-700/60 p-2 bg-neutral-950/40"
                      >
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-medium text-slate-100">
                            {g.name}
                          </span>
                          <CodeSmall>{g.citation}</CodeSmall>
                          <span className="text-xs text-neutral-400">
                            source:
                          </span>
                          <CodeSmall>{g.source_id}</CodeSmall>
                        </div>
                        <p className="text-sm text-neutral-300 mt-1">
                          {g.snippet}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Past Cases */}
      {fr?.past_case_references?.length ? (
        <div className="grid gap-2">
          <SectionTitle>Past Case References</SectionTitle>
          <div className="grid gap-2">
            {fr.past_case_references.map((c, i) => (
              <div
                key={`${c.case_id}-${i}`}
                className="rounded-lg border border-neutral-700/60 p-2 bg-neutral-900/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-100">
                    {c.case_id}
                  </span>
                  <CodeSmall>{c.source_id}</CodeSmall>
                </div>
                <p className="text-sm text-neutral-300 mt-1">
                  {c.similarity_reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Jurors */}
      {data.jurors && Object.keys(data.jurors).length > 0 && (
        <div className="grid gap-3">
          <SectionTitle>Jurors</SectionTitle>
          <div className="grid sm:grid-cols-1 lg:grid-cols-3 gap-3">
            {Object.entries(data.jurors).map(([juror, value]) => {
              const c = colorFromString(juror);
              return (
                <div
                  key={juror}
                  className="rounded-xl p-3 border"
                  style={{ borderColor: c.border, backgroundColor: c.bg }}
                >
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="inline-block w-2.5 h-2.5 rounded-full"
                      style={{ backgroundColor: c.dot }}
                    />
                    <span className="font-medium" style={{ color: c.text }}>
                      {juror}
                    </span>
                  </div>
                  <div className="mt-1 text-sm text-neutral-200 whitespace-pre-wrap break-words">
                    {typeof value === "string"
                      ? value
                      : JSON.stringify(value, null, 2)}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Raw payload (debug) */}
      {!fr && (
        <div className="grid gap-2">
          <SectionTitle>Raw Payload</SectionTitle>
          <pre className="text-xs leading-relaxed bg-neutral-950/60 border border-neutral-700/60 rounded-lg p-3 overflow-x-auto">
            {JSON.stringify(data.final_report, null, 2)}
          </pre>
        </div>
      )}
    </section>
  );
}
