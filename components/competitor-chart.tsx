import type { Insights } from "@/lib/types";

interface CompetitorChartProps {
  insights: Insights;
}

export function CompetitorChart({ insights }: CompetitorChartProps) {
  const competitors = Object.entries(insights.competitor_breakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const max = competitors[0]?.[1] || 1;

  const barColors: Record<string, string> = {
    Northbeam: "bg-emerald-500",
    "Triple Whale": "bg-purple-500",
    Rockerbox: "bg-orange-500",
    Hyros: "bg-red-500",
    Segment: "bg-blue-500",
    "Wicked Reports": "bg-pink-500",
  };

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
        Attribution Tool Market Share (in sample)
      </h3>
      <div className="space-y-2">
        {competitors.map(([name, count]) => (
          <div key={name} className="flex items-center gap-3">
            <div className="w-28 text-sm text-zinc-600 dark:text-zinc-300 truncate">
              {name}
            </div>
            <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${barColors[name] || "bg-zinc-400"}`}
                style={{ width: `${(count / max) * 100}%` }}
              />
            </div>
            <div className="w-8 text-right text-sm font-mono text-zinc-500 dark:text-zinc-400">
              {count}
            </div>
          </div>
        ))}
      </div>
      {competitors.length === 0 && (
        <p className="text-sm text-zinc-400 italic">
          No attribution tools detected
        </p>
      )}
    </div>
  );
}
