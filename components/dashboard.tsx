"use client";

import { useState } from "react";
import type { PipelineData } from "@/lib/types";
import { InsightsBar } from "./insights-bar";
import { StatsRow } from "./stats-row";
import { LeadTable } from "./lead-table";
import { CompetitorChart } from "./competitor-chart";

interface DashboardProps {
  data: PipelineData;
}

type Tab = "leads" | "analysis";

export function Dashboard({ data }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<Tab>("leads");
  const successLeads = data.leads.filter((l) => l.scrape_status === "success");

  return (
    <div className="space-y-6">
      {/* Insights above the fold - the "aha moment" */}
      <InsightsBar insights={data.insights} />

      {/* Summary stats */}
      <StatsRow insights={data.insights} totalLeads={successLeads.length} />

      {/* Tab navigation */}
      <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => setActiveTab("leads")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "leads"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Lead Pipeline
        </button>
        <button
          onClick={() => setActiveTab("analysis")}
          className={`px-4 py-2 text-sm font-medium transition-colors ${
            activeTab === "analysis"
              ? "border-b-2 border-indigo-600 text-indigo-600 dark:border-indigo-400 dark:text-indigo-400"
              : "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
          }`}
        >
          Market Analysis
        </button>
      </div>

      {/* Content */}
      {activeTab === "leads" && <LeadTable leads={data.leads} />}
      {activeTab === "analysis" && <AnalysisView data={data} />}
    </div>
  );
}

function AnalysisView({ data }: { data: PipelineData }) {
  const insights = data.insights;

  // Martech data
  const martechEntries = Object.entries(insights.martech_breakdown).sort(
    (a, b) => b[1] - a[1]
  );
  const maxMartech = martechEntries[0]?.[1] || 1;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <CompetitorChart insights={insights} />

        {/* Martech stack */}
        <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
            Marketing Tech Adoption
          </h3>
          <div className="space-y-2">
            {martechEntries.map(([name, count]) => (
              <div key={name} className="flex items-center gap-3">
                <div className="w-28 text-sm text-zinc-600 dark:text-zinc-300 truncate">
                  {name}
                </div>
                <div className="flex-1 h-6 bg-zinc-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-indigo-400"
                    style={{ width: `${(count / maxMartech) * 100}%` }}
                  />
                </div>
                <div className="w-16 text-right text-sm text-zinc-500 dark:text-zinc-400">
                  {Math.round((count / insights.total_brands_analyzed) * 100)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key findings cards */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            Greenfield Opportunity
          </h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {(100 - insights.attribution_adoption.adoption_rate_pct).toFixed(0)}% of DTC brands
            in our sample have no attribution tool at all.{" "}
            {insights.attribution_adoption.no_attribution_tool} brands are
            greenfield prospects for Northbeam with zero competitor displacement
            needed.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            Competitor Landscape
          </h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {(() => {
              const competitors = Object.entries(insights.competitor_breakdown)
                .filter(([name]) => name !== "Northbeam" && name !== "Segment");
              if (competitors.length === 0) return "No direct attribution competitors detected in sample.";
              const top = competitors.sort((a, b) => b[1] - a[1])[0];
              return `${top[0]} is the closest competitor with ${top[1]} brand${top[1] !== 1 ? "s" : ""}. Northbeam already leads with ${insights.competitor_breakdown["Northbeam"] || 0} brands in the sample.`;
            })()}
          </p>
        </div>

        <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
          <h4 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-2">
            Platform Fit
          </h4>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            {insights.platform_breakdown["Shopify"] || 0} of{" "}
            {insights.total_brands_analyzed} brands ({Math.round(((insights.platform_breakdown["Shopify"] || 0) / insights.total_brands_analyzed) * 100)}%)
            run on Shopify, where Northbeam has a native integration. This means
            low-friction onboarding for the majority of the prospect pipeline.
          </p>
        </div>
      </div>

      {/* Pipeline methodology */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
          How This Pipeline Works
        </h3>
        <div className="grid grid-cols-1 gap-4 text-sm text-zinc-600 dark:text-zinc-300 sm:grid-cols-4">
          <div>
            <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              1. Scrape
            </div>
            Python pipeline fetches homepage HTML for each brand using concurrent
            requests.
          </div>
          <div>
            <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              2. Detect
            </div>
            Regex-based signature matching identifies ad pixels, marketing tech,
            attribution tools, and eCommerce platform.
          </div>
          <div>
            <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              3. Score
            </div>
            Multi-factor scoring (0-100) weighing ad channel diversity,
            attribution gaps, martech sophistication, and platform fit.
          </div>
          <div>
            <div className="mb-1 font-semibold text-zinc-900 dark:text-zinc-100">
              4. Display
            </div>
            Next.js dashboard with filterable lead table, detail views, and
            market analysis.
          </div>
        </div>
      </div>
    </div>
  );
}
