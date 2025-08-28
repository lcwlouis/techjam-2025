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
  regionsParsed,
  isSubmitting,
  setIsSubmitting,
  onSubmit,
}: {
  apiBase: string;
  feature: string;
  setFeature: (v: string) => void;
  featureDescription: string;
  setFeatureDescription: (v: string) => void;
  regionsText: string;
  setRegionsText: (v: string) => void;
  regionsParsed: Region[] | null;
  setResp: (v: ProcessFeatureResponse | null) => void;
  setError: (v: string | null) => void;
  isSubmitting: boolean;
  setIsSubmitting: (v: boolean) => void;
  onSubmit: () => Promise<void>;
}) {
  const [regions, setRegions] = React.useState<
    { country: string; state?: string }[]
  >([]);

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
          Parsed:
          {regionsParsed
            ? `${regionsParsed.length} region(s)`
            : "Invalid / not provided (backend will infer)"}
        </p>
      </Labeled>
      <RegionSelector
        selected={regions}
        onChange={setRegions}
        selectMultiple={false}
        // Single select for now; can be multi-select later, just change to true
      />
      <div className="w-full h-px bg-white my-2" />

      <div>
        <button
          onClick={() => {
            onSubmit().finally(() => setIsSubmitting(false));
          }}
          disabled={isSubmitting}
          className="px-4 py-2 rounded-xl bg-indigo-500/90 hover:bg-indigo-500 transition disabled:opacity-50"
        >
          {isSubmitting ? "Submitting..." : "Process Feature"}
        </button>
      </div>
    </section>
  );
}
