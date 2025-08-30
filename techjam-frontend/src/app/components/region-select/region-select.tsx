// Hardcoded list of regions
const REGION_OPTIONS = [
  { country: "EU", state: "" },
  { country: "US", state: "CA" },
  { country: "US", state: "FL" },
  { country: "US", state: "UT" },
  { country: "US", state: "" },
  { country: "NO", state: "TA" }
];

export default function RegionSelector({
  selected,
  onChange,
}: {
  selected: { country: string; state?: string } | null;
  onChange: (region: { country: string; state?: string } | null) => void;
}) {
  function toggle(region: { country: string; state?: string }) {
    // If already selected, clear it
    if (
      selected &&
      selected.country === region.country &&
      (selected.state || "") === (region.state || "")
    ) {
      onChange(null);
    } else {
      onChange(region);
    }
  }

  function label(r: { country: string; state?: string }) {
    if (r.country === "NO" && r.state === "TA") {
      return "No Specific Region";
    }
    return r.state ? `${r.country}/${r.state}` : r.country;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {REGION_OPTIONS.map((r, idx) => {
        const checked =
          selected &&
          selected.country === r.country &&
          (selected.state || "") === (r.state || "");
        return (
          <button
            key={idx}
            type="button"
            onClick={() => toggle(r)}
            className={`px-3 py-1.5 rounded-xl border text-sm transition 
              ${
                checked
                  ? "bg-orange-500 text-white border-orange-400"
                  : "bg-neutral-800 text-neutral-300 border-neutral-700 hover:bg-neutral-700"
              }`}
          >
            {label(r)}
          </button>
        );
      })}
    </div>
  );
}