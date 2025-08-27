import React from "react";

export default function Pipeline() {
  return (
    <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
      <h2 className="text-xl font-medium">Pipeline</h2>
      <ol className="list-decimal pl-5 text-sm text-neutral-300 grid gap-1">
        <li>Submit a feature scenario (free text).</li>
        <li>Juror models generate individual reports.</li>
        <li>Consolidator (judge) summarizes into a consolidated report.</li>
        <li>Accept/Reject; on reject, re-query jurors with feedback.</li>
        <li>Optional RAG: enrich with terminology and past cases.</li>
      </ol>
    </section>
  );
}
