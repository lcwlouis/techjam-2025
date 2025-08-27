"use client";

import React, { useMemo, useState } from "react";
import Pipeline from "./components/pipeline-instructions/pipeline-instructions";
import SettingsPanel from "./components/settings-panel/settings-panel";
import SubmitArea, {
  Region,
  Row,
  RegionCard,
} from "./components/submission-area/submission-area";

export default function TechJamPage() {
  const [apiBase, setApiBase] = useState(
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8000"
  );
  const [feature, setFeature] = useState("");
  const [description, setDescription] = useState("");
  const [regionsText, setRegionsText] = useState(
    '[{"country":"US","state":"CA"},{"country":"EU"}]'
  );
  const regionsParsed: Region[] | null = useMemo(() => {
    try {
      const p = JSON.parse(regionsText);
      return Array.isArray(p) ? p : null;
    } catch {
      return null;
    }
  }, [regionsText]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resp, setResp] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function sendFeedback(regionStr: string, feedback: string) {
    if (!resp) return;
    await fetch(`${apiBase}/human_feedback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ uuid: resp.uuid, region: regionStr, feedback }),
    });
  }

  return (
    <div className="max-w-5xl mx-auto grid gap-6 p-6">
      <header className="flex flex-col gap-2">
        <h1 className="text-3xl font-semibold">
          TechJam – Judge/Jury Frontend MVP
        </h1>
      </header>

      <Pipeline />

      <SubmitArea
        apiBase={apiBase}
        feature={feature}
        setFeature={setFeature}
        description={description}
        setDescription={setDescription}
        regionsText={regionsText}
        setRegionsText={setRegionsText}
        regionsParsed={regionsParsed}
        setResp={setResp}
        setError={setError}
        isSubmitting={isSubmitting}
        setIsSubmitting={setIsSubmitting}
      />

      {resp && (
        <section className="grid gap-4 bg-neutral-800/60 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-medium">Consolidated Report</h2>
            <span className="text-xs text-neutral-400">UUID: {resp.uuid}</span>
          </div>
          <div className="grid gap-1">
            <Row label="Feature" value={resp.report.feature} />
            <Row label="Description" value={resp.report.description} />
          </div>
          <div className="grid gap-3">
            <h3 className="font-medium">Regions</h3>
            <div className="grid gap-3">
              {resp.report.regions_flagged.map((r: any, idx: number) => (
                <RegionCard
                  key={`${r.country}-${r.state}-${idx}`}
                  region={r}
                  onFeedback={(text: string) => {
                    const tag = r.state ? `${r.country}/${r.state}` : r.country;
                    return sendFeedback(tag, text);
                  }}
                />
              ))}
            </div>
          </div>
        </section>
      )}

      <SettingsPanel apiBase={apiBase} setApiBase={setApiBase} />
    </div>
  );
}
