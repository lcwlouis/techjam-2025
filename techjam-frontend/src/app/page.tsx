"use client";

import React, { useState, useEffect, useRef } from "react";
import Pipeline from "./components/pipeline-instructions/pipeline-instructions";
import SettingsPanel from "./components/settings-panel/settings-panel";
import SubmitArea from "./components/submission-area/submission-area";
import FinalReportSection from "./components/final-report/final-report";

import { fetchEventSource } from "@microsoft/fetch-event-source"; // npm i @microsoft/fetch-event-source

export default function TechJamPage() {
  const abortRef = useRef<AbortController | null>(null);
  const inFlightRef = useRef(false);
  const [apiBase, setApiBase] = useState(
    process.env.NEXT_PUBLIC_API_BASE || "http://localhost"
  );
  const [feature_name, setFeatureName] = useState("");
  const [feature_description, setFeatureDescription] = useState("");
  const [region, setRegion] = useState<{
    country: string;
    state?: string;
  } | null>(null);
  const [iterations, setIterations] = useState("1");
  const [k, setK] = useState("5");

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
      chatContainerRef.current.scrollTop =
        chatContainerRef.current.scrollHeight;
    }
  }, [chatLog]);

  function colorFromString(s: string) {
    let hash = 0;
    for (let i = 0; i < s.length; i++)
      hash = s.charCodeAt(i) + ((hash << 5) - hash);
    const hue = Math.abs(hash) % 360;
    return {
      text: `hsl(${hue} 80% 60%)`,
      border: `hsl(${hue} 80% 50%)`,
      bg: `hsl(${hue} 80% 50% / 0.10)`,
      dot: `hsl(${hue} 80% 50%)`,
    };
  }

  function safeParse<T = any>(input: unknown): T | unknown {
    if (typeof input !== "string") return input;
    try {
      return JSON.parse(input) as T;
    } catch {
      return input; // fallback to raw string if it wasn't JSON
    }
  }

  function buildRegionCodeClient(
    country?: string | null,
    state?: string | null
  ) {
    const c = (country || "").trim().toUpperCase();
    const s = (state || "").trim().toUpperCase();
    return c ? `${c}${s}` : "";
  }

  async function uploadForLightragIngestion(final?: any) {
    const out = final ?? finalOutput;
    if (!out) return;

    const fr = out.final_report;
    const emptyObj =
      fr && typeof fr === "object" && Object.keys(fr).length === 0;
    if (!fr || emptyObj) {
      setChatLog((p) => [
        ...p,
        {
          author: "RAG",
          final: false,
          text: "Skip ingest: empty final_report",
        },
      ]);
      return;
    }

    // choose ONE region code (priority: server -> user selection -> final_report hint)
    let code = out?.rag?.region_code?.toString().trim().toUpperCase() || "";

    if (!code && region?.country) {
      code = buildRegionCodeClient(region.country, region.state ?? "");
    }

    if (!code) {
      const frCode = fr?.region_code?.toString().trim().toUpperCase?.() || "";
      if (frCode) code = frCode;
    }

    if (!code) {
      setChatLog((p) => [
        ...p,
        { author: "RAG", final: false, text: "Skip ingest: no region_code" },
      ]);
      return;
    }

    try {
      const resp = await fetch(`${apiBase}/lightrag_ingestion`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ final_report: fr, region_code: code }),
      });

      if (resp.ok) {
        setChatLog((p) => [
          ...p,
          { author: "RAG", final: false, text: `Ingest ${code}: ok` },
        ]);
      } else {
        const detail = await resp.text().catch(() => "");
        setChatLog((p) => [
          ...p,
          {
            author: "RAG",
            final: false,
            text: `Ingest ${code} failed: HTTP ${resp.status} ${detail}`.trim(),
          },
        ]);
      }
    } catch (e: any) {
      setChatLog((p) => [
        ...p,
        {
          author: "RAG",
          final: false,
          text: `Ingest ${code} error: ${e?.message ?? e}`,
        },
      ]);
    }
  }

  async function streamProcessFeature(e?: React.SyntheticEvent) {
    e?.preventDefault?.();

    if (inFlightRef.current || isSubmitting) return; // hard guard
    inFlightRef.current = true;
    setIsSubmitting(true);
    setError(null);
    setChatLog([]);
    setFinalOutput(null);

    // ensure any previous stream is closed
    abortRef.current?.abort();
    abortRef.current = new AbortController();
      const safeIterations = parseInt(iterations || "1", 10);
      const safeK = parseInt(k || "5", 10);
      try {
      await fetchEventSource(`${apiBase}/demo_agent_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_name,
          feature_description,
          region: region ?? {},
          iterations: safeIterations,
          k: safeK,
          run_id: crypto.randomUUID(),
        }),
        signal: abortRef.current.signal,
        openWhenHidden: true,

        onopen: async (resp) => {
          if (
            !resp.ok ||
            !resp.headers.get("content-type")?.includes("text/event-stream")
          ) {
            throw new Error(`SSE failed: ${resp.status} ${resp.statusText}`);
          }
        },

        async onmessage(ev) {
          if (ev.event === "message") {
            const msg = JSON.parse(ev.data);
            setChatLog((prev) => [...prev, msg]);
            return;
          }
          if (ev.event === "done") {
            const final = JSON.parse(ev.data);
            final.final_report = safeParse(final.final_report);
            if (final.jurors && typeof final.jurors === "object") {
              final.jurors = Object.fromEntries(
                Object.entries(final.jurors).map(([k, v]) => [k, safeParse(v)])
              );
            }
            console.log(final);
            setFinalOutput(final);
            uploadForLightragIngestion(final);
            // stop stream intentionally
            abortRef.current?.abort();
            return;
          }
        },

        onclose() {
          // If we didn't intentionally abort, treat as an error to prevent retry
          if (!abortRef.current?.signal.aborted) {
            throw new Error(
              "SSE closed by server before 'done'; stopping retries."
            );
          }
        },

        onerror(err) {
          // Throwing here also stops retries
          throw err;
        },
      });
    } catch (e: any) {
      // Only show an error if we didn't abort intentionally after 'done'
      if (!abortRef.current || !abortRef.current.signal.aborted) {
        setError(e?.message || "Streaming connection failed");
      }
    } finally {
      inFlightRef.current = false;
      setIsSubmitting(false);
      // If this stream instance is over, clear the controller
      abortRef.current = null;
    }
  }

  // Abort if component unmounts or before page unload/reload
  useEffect(() => {
    return () => abortRef.current?.abort();
  }, []);

  useEffect(() => {
    const beforeUnload = () => abortRef.current?.abort();
    window.addEventListener("beforeunload", beforeUnload);
    return () => window.removeEventListener("beforeunload", beforeUnload);
  }, []);

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
        k={k}
        setK={setK}
        iterations={iterations}
        setIterations={setIterations}
        setResp={() => {}} 
        setError={setError}
        isSubmitting={isSubmitting}
        onSubmit={streamProcessFeature}
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
                  <span className="text-indigo-400 font-semibold">
                    {msg.author}:{" "}
                  </span>
                  <span>{msg.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Final Output */}
        {finalOutput && (
          <FinalReportSection
            data={finalOutput}
            colorFromString={colorFromString}
          />
        )}

        <SettingsPanel apiBase={apiBase} setApiBase={setApiBase} />
      </div>
    </div>
  );
}
