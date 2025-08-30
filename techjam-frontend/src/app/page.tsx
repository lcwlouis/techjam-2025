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

  // // --- Streaming version of processFeature ---
  // async function streamProcessFeature() {
  //   if (isSubmitting) return;
  //   setIsSubmitting(true);
  //   setError(null);
  //   setChatLog([]);
  //   setFinalOutput(null);

  //   try {
  //     console.log(feature_name);
  //     console.log(feature_description);
  //     console.log(region);
  //     await fetchEventSource(`${apiBase}/demo_agent_stream`, {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify({
  //         feature_name,
  //         feature_description,
  //         region: region ?? {},
  //       }),
  //       async onmessage(ev) {
  //         if (ev.event === "message") {
  //           const msg = JSON.parse(ev.data);
  //           setChatLog((prev) => [...prev, msg]);
  //         }
  //         if (ev.event === "done") {
  //           const final = JSON.parse(ev.data);
  //           setFinalOutput(final);
  //           console.log(final);
  //         }
  //       },
  //       onerror(err) {
  //         console.error("SSE error", err);
  //         setError("Streaming connection failed");
  //         throw err;
  //       },
  //     });
  //   } catch (e: any) {
  //     setError(e.message || "Unknown error");
  //   } finally {
  //     setIsSubmitting(false);
  //   }
  // }

  function safeParse<T = any>(input: unknown): T | unknown {
    if (typeof input !== "string") return input;
    try {
      return JSON.parse(input) as T;
    } catch {
      return input; // fallback to raw string if it wasn't JSON
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

    try {
      await fetchEventSource(`${apiBase}/demo_agent_stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          feature_name,
          feature_description,
          region: region ?? {},
          run_id: crypto.randomUUID(),
        }),
        signal: abortRef.current.signal,
        openWhenHidden: true,

        onopen(resp) {
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
          setResp={() => {}} // not used in streaming version
          setError={setError}
          isSubmitting={isSubmitting}
          onSubmit={streamProcessFeature} // 👈 swap in streaming
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
                    {msg.author} {idx}:
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
        {/* {finalOutput && (
          <>
            <section className="grid gap-4 bg-neutral-800/60 rounded-2xl p-4">
              <h2 className="text-xl font-medium">Final Report</h2>
              <div className="grid gap-1">
                <Row label="Feature" value={finalOutput.final_report.feature} />
                <Row
                  label="Feature Description"
                  value={finalOutput.final_report.feature_description}
                />
                <Row
                  label="Requires Geo-specific Logic / Confidence"
                  value={`${
                    finalOutput.final_report.needs_geo_specific_logic
                      ? "Yes"
                      : "No"
                  } (${finalOutput.final_report.confidence * 100}%)`}
                />
              </div>
            </section>
            <section className="grid gap-4 bg-neutral-800/60 rounded-2xl p-4">
              <div className="grid gap-3">
                <h3 className="font-medium">Juror Breakdown</h3>
                <div className="grid gap-3">
                  <div className="grid gap-3">
                    {Object.entries(finalOutput.jurors).map(
                      ([juror, value]) => {
                        const c = colorFromString(juror);
                        return (
                          <div
                            key={juror}
                            className="rounded-xl p-3 border"
                            style={{
                              borderColor: c.border,
                              backgroundColor: c.bg,
                            }}
                          >
                            <div className="flex items-center gap-2">
                              <span
                                aria-hidden
                                className="inline-block w-2.5 h-2.5 rounded-full"
                                style={{ backgroundColor: c.dot }}
                              />
                              <span
                                className="font-medium"
                                style={{ color: c.text }}
                              >
                                {juror}
                              </span>
                            </div>
                            <div className="mt-1 text-sm text-neutral-200">
                              {value ? String(value) : "N/A"}
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                </div>
              </div>
            </section>
          </>
        )} */}

        <SettingsPanel apiBase={apiBase} setApiBase={setApiBase} />
      </div>
    </div>
  );
}
