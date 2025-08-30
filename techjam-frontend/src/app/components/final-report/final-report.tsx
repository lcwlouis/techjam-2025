"use client";

import { ReactElement, JSXElementConstructor, ReactNode, ReactPortal } from "react";
import {
  Badge,
  Meter,
  SectionTitle,
  Subtle,
  CodeSmall,
} from "../card-components/card-components";

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

function isFinalReportObj(x: any): x is FinalReport {
  return x && typeof x === "object" && "feature" in x && "confidence" in x;
}

function tryParseFinalReport(x: Json): FinalReport | null {
  if (isFinalReportObj(x)) return x;
  if (typeof x === "string") {
    try {
      const parsed = JSON.parse(x);
      return isFinalReportObj(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }
  return null;
}

function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <span className="px-2 py-0.5 rounded bg-neutral-900/80 border border-neutral-700 text-neutral-200 text-xs">
      {children}
    </span>
  );
}

type RegionBlock = {
  region?: string;
  requirement_summary?: string;
  regulations?: Array<{
    name?: string;
    citation?: string;
    snippet?: string;
    source_id?: string;
  }>;
};

function normaliseRegions(val: unknown): RegionBlock[] {
  if (!val) return [];
  if (Array.isArray(val)) return val as RegionBlock[];

  // JSON string?
  if (typeof val === "string") {
    try {
      return normaliseRegions(JSON.parse(val));
    } catch {
      return [];
    }
  }

  // Object
  if (typeof val === "object") {
    const obj = val as Record<string, any>;
    // Case 1: looks like a single RegionBlock
    if (
      "region" in obj ||
      "requirement_summary" in obj ||
      "regulations" in obj
    ) {
      return [obj as RegionBlock];
    }
    // Case 2: map keyed by region name -> values
    return Object.entries(obj).map(([region, v]) => ({
      region,
      ...(v as any),
    }));
  }

  return [];
}

/** Reusable body for a FinalReport (used for the main report and each juror). */
function ReportBody({ fr }: { fr: FinalReport }) {
  const regions_normalised = normaliseRegions(fr.regions_affected);
  return (
    <div className="grid gap-5">
      {/* Confidence meter */}
      <div className="grid gap-2">
        <Subtle>Confidence</Subtle>
        <Meter value={fr.confidence} />
      </div>

      {/* Feature summary */}
      <div className="grid gap-2">
        <SectionTitle>{"Feature"}</SectionTitle>
        <Subtle>{fr.feature}</Subtle>
      </div>
      <div className="grid gap-2">
        <SectionTitle>{"Feature Description"}</SectionTitle>
        <Subtle>{fr.feature_description}</Subtle>
      </div>

      {/* Regions & Regulations */}
      <div className="grid gap-1">
        <SectionTitle>{"Affected Regions"}</SectionTitle>
      </div>
      {(Array.isArray(regions_normalised)
        ? regions_normalised
        : Object.entries(regions_normalised || {}).map(([region, val]) => ({
            region,
            ...(val as any),
          }))
      ).map((r, i) => (
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

          {Array.isArray(r.regulations) &&
            r.regulations.map((g: { citation: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; name: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; source_id: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; snippet: string | number | bigint | boolean | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | ReactPortal | Promise<string | number | bigint | boolean | ReactPortal | ReactElement<unknown, string | JSXElementConstructor<any>> | Iterable<ReactNode> | null | undefined> | null | undefined; }, j: any) => (
              <div
                key={`${g.citation}-${j}`}
                className="rounded-lg border border-neutral-700/60 p-2 bg-neutral-950/40"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-slate-100">{g.name}</span>
                  <CodeSmall>{g.citation}</CodeSmall>
                  <span className="text-xs text-neutral-400">source:</span>
                  <CodeSmall>{g.source_id}</CodeSmall>
                </div>
                <p className="text-sm text-neutral-300 mt-1">{g.snippet}</p>
              </div>
            ))}
        </div>
      ))}

      {/* Past Cases */}
      {fr.past_case_references?.length ? (
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
    </div>
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
                ? "Geo-specific logic required?: Yes"
                : "Geo-specific logic required?: No"}
            </Badge>
            <Badge tone="amber">Confidence: {formatPct(fr.confidence)}</Badge>
          </div>
        )}
      </div>

      {/* Main final report body OR fallback */}
      {fr ? (
        <ReportBody fr={fr} />
      ) : (
        <>
          <div className="text-sm text-neutral-300">
            <em>
              Final report content is not an object (raw JSON/string). See Raw
              Payload below.
            </em>
          </div>
          <div className="grid gap-2">
            <SectionTitle>Raw Payload</SectionTitle>
            <pre className="text-xs leading-relaxed bg-neutral-950/60 border border-neutral-700/60 rounded-lg p-3 overflow-x-auto">
              {JSON.stringify(data.final_report, null, 2)}
            </pre>
          </div>
        </>
      )}

      {/* Jurors — each juror value is a FinalReport-like body */}
      {data.jurors && Object.keys(data.jurors).length > 0 && (
        <div className="grid gap-3">
          <SectionTitle>Jurors Individual Reports</SectionTitle>
          <div className="grid sm:grid-cols-1 lg:grid-cols-1 gap-3">
            {Object.entries(data.jurors).map(([juror, value]) => {
              const c = colorFromString(juror);
              const jr = tryParseFinalReport(value);

              return (
                <div
                  key={juror}
                  className="rounded-xl p-4 border"
                  style={{ borderColor: c.border, backgroundColor: c.bg }}
                >
                  <div className="flex items-center justify-between gap-2">
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

                    {jr && (
                      <div className="flex items-center gap-2">
                        <Badge
                          tone={
                            jr.needs_geo_specific_logic ? "emerald" : "rose"
                          }
                        >
                          {jr.needs_geo_specific_logic
                            ? "Geo-specific logic required?: Yes"
                            : "Geo-specific logic required?: No"}
                        </Badge>
                        <Badge tone="amber">
                          Confidence: {formatPct(jr.confidence)}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <div className="mt-3">
                    {jr ? (
                      <ReportBody fr={jr} />
                    ) : (
                      <div className="mt-1 text-sm text-neutral-200 whitespace-pre-wrap break-words">
                        {typeof value === "string"
                          ? value
                          : JSON.stringify(value, null, 2)}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
