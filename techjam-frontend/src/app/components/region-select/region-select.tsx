// Hardcoded list of regions
const REGION_OPTIONS = [
  { country: "EU", state: "" },
  { country: "US", state: "CA" },
  { country: "US", state: "FL" },
  { country: "US", state: "UT" },
  { country: "US", state: "" },
];

export default function RegionSelector({
  selected,
  onChange,
  selectMultiple = false,
}: {
  selected: { country: string; state?: string }[];
  onChange: (regions: { country: string; state?: string }[]) => void;
  selectMultiple?: boolean;
}) {
  function toggle(region: { country: string; state?: string }) {
    const exists = selected.some(
      (r) =>
        r.country === region.country && (r.state || "") === (region.state || "")
    );
    if (exists) {
      onChange(
        selected.filter(
          (r) =>
            !(
              r.country === region.country &&
              (r.state || "") === (region.state || "")
            )
        )
      );
    } else {
      if (!selectMultiple) {
        onChange([region]);
        return;
      } else {
        onChange([...selected, region]);
      }
    }
  }

  function label(r: { country: string; state?: string }) {
    return r.state ? `${r.country}/${r.state}` : r.country;
  }

  return (
    <div className="grid gap-2">
      {/* Bulk action row */}
      {selectMultiple && (
        <div className="flex gap-2 mb-2">
          <button
            type="button"
            onClick={() => onChange(REGION_OPTIONS)}
            className="px-3 py-1.5 rounded-xl bg-green-600 text-white text-sm hover:bg-green-500"
          >
            Select All
          </button>
          <button
            type="button"
            onClick={() => onChange([])}
            className="px-3 py-1.5 rounded-xl bg-red-600 text-white text-sm hover:bg-red-500"
          >
            Clear All
          </button>
        </div>
      )}

      {/* Region buttons */}
      <div className="flex flex-wrap gap-2">
        {REGION_OPTIONS.map((r, idx) => {
          const checked = selected.some(
            (s) =>
              s.country === r.country && (s.state || "") === (r.state || "")
          );
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
    </div>
  );
}
