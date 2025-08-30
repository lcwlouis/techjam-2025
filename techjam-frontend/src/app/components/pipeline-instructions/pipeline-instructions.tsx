import React from "react";

import { SectionTitle } from "../card-components/card-components";

export default function Pipeline() {
  return (
    <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
      <SectionTitle>Pipeline Instructions</SectionTitle>
      <ol className="list-decimal pl-5 text-sm text-neutral-300 grid gap-1">
        <li>Submit feature, feature description.</li>
        <li>
          Specify iterations (juror-critic loops) and k (number of documents RAG
          fetches).
        </li>
        <li>(Optional): Specify specific terminology in settings.</li>
        <li>Juror models generate individual reports.</li>
        <li>Critic models provide feedback on juror reports.</li>
        <li>Loop continues until max iterations hit / critic is satisfied.</li>
        <li>Output logged in pipeline chat.</li>
        <li>Final-response model generates own summarised final report.</li>
      </ol>
    </section>
  );
}
