import type { Insights } from "@/lib/types";

interface InsightsBarProps {
  insights: Insights;
}

export function InsightsBar({ insights }: InsightsBarProps) {
  const greenfield = 100 - insights.attribution_adoption.adoption_rate_pct;
  const topCompetitor = Object.entries(insights.competitor_breakdown)
    .filter(([name]) => name !== "Northbeam" && name !== "Segment")
    .sort((a, b) => b[1] - a[1])[0];
  const northbeamCount = insights.competitor_breakdown["Northbeam"] || 0;

  return (
    <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-6 dark:border-indigo-900 dark:from-indigo-950/50 dark:to-zinc-900">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
          What the Data Reveals
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          Live scrape of {insights.total_brands_analyzed} DTC brands
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        {/* Aha Moment */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-800 dark:ring-zinc-700">
          <div className="text-3xl font-bold text-indigo-600 dark:text-indigo-400">
            {greenfield.toFixed(0)}%
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            have no attribution tool
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {insights.attribution_adoption.no_attribution_tool} of{" "}
            {insights.total_brands_analyzed} brands are greenfield prospects
          </div>
        </div>

        {/* Competitor Intel */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-800 dark:ring-zinc-700">
          <div className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {northbeamCount}/{insights.total_brands_analyzed}
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            already use Northbeam
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            {topCompetitor
              ? `${topCompetitor[0]} is closest competitor with ${topCompetitor[1]} brands`
              : "No direct competitors detected"}
          </div>
        </div>

        {/* Platform Fit */}
        <div className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-zinc-100 dark:bg-zinc-800 dark:ring-zinc-700">
          <div className="text-3xl font-bold text-amber-600 dark:text-amber-400">
            {insights.platform_breakdown["Shopify"] || 0}/
            {insights.total_brands_analyzed}
          </div>
          <div className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
            run on Shopify
          </div>
          <div className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
            Native Northbeam integration available — low friction onboarding
          </div>
        </div>
      </div>
    </div>
  );
}
