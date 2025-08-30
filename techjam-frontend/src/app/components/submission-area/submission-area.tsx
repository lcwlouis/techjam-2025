// FILE: components/SubmitArea.tsx
import React from "react";

import RegionSelector from "../region-select/region-select";
import { Labeled, Region } from "../card-components/card-components";

type ProcessFeatureResponse = {
  status: string;
  uuid: string;
  report: {
    feature: string;
    description: string;
    regions_flagged: Array<Region & { available: boolean; reasoning: string }>;
  };
};

export default function SubmitArea({
  feature,
  setFeature,
  featureDescription,
  setFeatureDescription,
  region,
  setRegion,
  k,
  setK,
  iterations,
  setIterations,
  isSubmitting,
  onSubmit,
}: {
  apiBase: string;
  feature: string;
  setFeature: (v: string) => void;
  featureDescription: string;
  setFeatureDescription: (v: string) => void;
  region: { country: string; state?: string } | null;
  setRegion: React.Dispatch<
    React.SetStateAction<{ country: string; state?: string } | null>
  >;
  iterations: string;
  setIterations: React.Dispatch<React.SetStateAction<string>>;
  k: string;
  setK: React.Dispatch<React.SetStateAction<string>>;
  setResp: (v: ProcessFeatureResponse | null) => void;
  setError: (v: string | null) => void;
  isSubmitting: boolean;
  onSubmit: (e?: React.SyntheticEvent) => void | Promise<void>;
}) {
  function handleSubmit() {
    if (!feature.trim()) {
      alert("Please fill in Feature Title.");
      return;
    }
    if (!featureDescription.trim()) {
      alert("Please fill in Feature Description.");
      return;
    }
    if (!region?.country.trim()) {
      alert("Please select a Country / Region.");
      return;
    }
    onSubmit();
  }

  return (
    <section className="grid gap-3 bg-neutral-800/60 rounded-2xl p-4">
      <h2 className="text-xl font-medium">Submit Feature Scenario</h2>
      <Labeled label="Feature Title">
        <input
          value={feature}
          onChange={(e) => setFeature(e.target.value)}
          className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none"
          placeholder="Curfew login blocker with ASL and GH for Utah minors.."
        />
      </Labeled>
      <Labeled label="Feature Description">
        <textarea
          value={featureDescription}
          onChange={(e) => setFeatureDescription(e.target.value)}
          rows={6}
          className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none"
          placeholder="Feature description goes here..."
        />
        <p className="text-xs text-neutral-400 mt-1">
          Selected: {region ? 1 : 0} region
        </p>
      </Labeled>
      <RegionSelector
        selected={region}
        onChange={setRegion}
        // Single select for now; can be multi-select later, just change to true
      />
      <div className="w-full h-px bg-white my-2" />
      <div className="grid grid-cols-2 gap-4">
        <Labeled label="Iterations">
          <input
            type="number"
            min={1}
            value={iterations}
            onChange={(e) => setIterations(e.target.value)} // allow "" as value
            className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none"
            placeholder="e.g. 3"
          />
        </Labeled>

        <Labeled label="k">
          <input
            type="number"
            min={1}
            value={k}
            onChange={(e) => setK(e.target.value)} // allow "" as value
            className="w-full px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 outline-none"
            placeholder="e.g. 5"
          />
        </Labeled>

      </div>

      <div>
        <button
          type="button" // prevent implicit form submit
          onClick={handleSubmit}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Process Feature"}
        </button>
      </div>
    </section>
  );
}
