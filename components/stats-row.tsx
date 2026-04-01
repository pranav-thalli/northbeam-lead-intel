import type { Insights } from "@/lib/types";

interface StatsRowProps {
  insights: Insights;
  totalLeads: number;
}

export function StatsRow({ insights, totalLeads }: StatsRowProps) {
  const stats = [
    {
      label: "Total Leads",
      value: totalLeads.toString(),
    },
    {
      label: "Avg Score",
      value: insights.score_stats.avg.toFixed(0),
    },
    {
      label: "Hot Prospects",
      value: (insights.tier_distribution["hot"] || 0).toString(),
    },
    {
      label: "Avg Ad Channels",
      value: insights.ad_channels.avg_channels_per_brand.toFixed(1),
    },
  ];

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
      {stats.map((stat) => (
        <div
          key={stat.label}
          className="rounded-xl border border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900"
        >
          <div className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {stat.value}
          </div>
          <div className="text-xs text-zinc-500 dark:text-zinc-400">
            {stat.label}
          </div>
        </div>
      ))}
    </div>
  );
}
