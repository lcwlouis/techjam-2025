"use client";

import React, { useState, useEffect, useRef } from "react";
import Pipeline from "./components/pipeline-instructions/pipeline-instructions";
import SettingsPanel from "./components/settings-panel/settings-panel";
import SubmitArea from "./components/submission-area/submission-area";
import {
  Row,
} from "./components/card-components/card-components";

import { fetchEventSource } from "@microsoft/fetch-event-source"; // npm i @microsoft/fetch-event-source

export default function TechJamPage() {
  const [apiBase, setApiBase] = useState(
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost"
  );
  const [feature_name, setFeatureName] = useState("");
  const [feature_description, setFeatureDescription] = useState("");
  const [region, setRegion] = useState<{ country: string; state?: string } | null>(null);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // new states for streaming
  const [chatLog, setChatLog] = useState<any[]>([]);
  const [finalOutput, setFinalOutput] = useState<any | null>(null);

  // ref for auto-scroll
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  // --- Streaming version of processFeature ---
  async function streamProcessFeature() {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setError(null);
    setChatLog([]);
    setFinalOutput(null);

    try {
      await fetchEventSource(`${apiBase}/demo_agent_stream`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          feature_name,
          feature_description,
          region: region ?? {},
        }),
        async onmessage(ev) {
          if (ev.event === "message") {
            const msg = JSON.parse(ev.data);
            setChatLog((prev) => [...prev, msg]);
          }
          if (ev.event === "done") {
            const final = JSON.parse(ev.data);
            setFinalOutput(final);
          }
        },
        onerror(err) {
          console.error("SSE error", err);
          setError("Streaming connection failed");
          throw err;
        },
      });
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-geo-gavel-grid text-slate-100 p-6">
      <div className="max-w-5xl mx-auto grid gap-6 p-6">
        <header className="flex flex-col gap-2">
          <h1 className="text-3xl font-semibold">
            TechJam – Judge/Jury Frontend MVP
          </h1>
        </header>

        <Pipeline />

        <SubmitArea
          apiBase={apiBase}
          feature={feature_name}
          setFeature={setFeatureName}
          featureDescription={feature_description}
          setFeatureDescription={setFeatureDescription}
          region={region}
          setRegion={setRegion}
          setResp={() => {}}   // not used in streaming version
          setError={setError}
          isSubmitting={isSubmitting}
          setIsSubmitting={setIsSubmitting}
          onSubmit={streamProcessFeature}  // 👈 swap in streaming
        />

        {/* Chat log */}
        {chatLog.length > 0 && (
          <section className="grid gap-4 bg-neutral-800/60 rounded-2xl p-4">
            <h2 className="text-xl font-medium">Pipeline Chat</h2>
            <div
              ref={chatContainerRef}
              className="space-y-2 max-h-96 overflow-y-auto pr-2"
            >
              {chatLog.map((msg, idx) => (
                <div key={idx} className="p-2 rounded bg-neutral-900">
                  <span className="text-indigo-400 font-semibold">{msg.author}:</span>{" "}
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Final Output */}
        {finalOutput && (
          <section className="grid gap-4 bg-neutral-800/60 rounded-2xl p-4">
            <h2 className="text-xl font-medium">Final Report</h2>
            <div className="grid gap-1">
              <Row label="Final Report" value={finalOutput.final_report} />
            </div>
            <div className="grid gap-3">
              <h3 className="font-medium">Jurors</h3>
              <div className="grid gap-3">
                {Object.entries(finalOutput.jurors).map(([juror, value], idx) => (
                  <Row key={idx} label={juror} value={value ? String(value) : "N/A"} />
                ))}
              </div>
            </div>
          </section>
        )}

        <SettingsPanel apiBase={apiBase} setApiBase={setApiBase} />
      </div>
    </div>
  );
}