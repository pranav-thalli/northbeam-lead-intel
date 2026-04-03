"use client";

import { useState } from "react";
import type { Lead, TierFilter, AttributionFilter } from "@/lib/types";
import { LeadDetail } from "./lead-detail";

interface LeadTableProps {
  leads: Lead[];
}

const tierColors: Record<string, string> = {
  hot: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  warm: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  cool: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  cold: "bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function TierBadge({ tier }: { tier: string }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${tierColors[tier] || tierColors.cold}`}
    >
      {tier}
    </span>
  );
}

function TechPills({ items, color }: { items: string[]; color: string }) {
  if (items.length === 0)
    return (
      <span className="inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium bg-zinc-100 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500">
        None
      </span>
    );
  return (
    <div className="flex flex-wrap gap-1">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex items-center rounded px-1.5 py-0.5 text-[11px] font-medium ${color}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function LeadTable({ leads }: LeadTableProps) {
  const [tierFilter, setTierFilter] = useState<TierFilter>("all");
  const [attrFilter, setAttrFilter] = useState<AttributionFilter>("all");
  const [minChannels, setMinChannels] = useState<number>(0);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [sortField, setSortField] = useState<"score" | "name" | "channels">(
    "score"
  );
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const successLeads = leads.filter((l) => l.scrape_status === "success");

  const filtered = successLeads.filter((lead) => {
    if (tierFilter !== "all" && lead.tier !== tierFilter) return false;
    if (attrFilter === "none" && lead.attribution_tools.length > 0)
      return false;
    if (
      attrFilter === "northbeam" &&
      !lead.attribution_tools.includes("Northbeam")
    )
      return false;
    if (attrFilter === "competitor") {
      const hasCompetitor = lead.attribution_tools.some(
        (t) => t !== "Northbeam" && t !== "Segment"
      );
      if (!hasCompetitor) return false;
    }
    if (lead.ad_channel_count < minChannels) return false;
    return true;
  });

  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "desc" ? -1 : 1;
    if (sortField === "score") return (a.score - b.score) * dir;
    if (sortField === "channels")
      return (a.ad_channel_count - b.ad_channel_count) * dir;
    return a.name.localeCompare(b.name) * dir;
  });

  const handleSort = (field: "score" | "name" | "channels") => {
    if (sortField === field) {
      setSortDir(sortDir === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortField !== field)
      return <span className="text-zinc-300 dark:text-zinc-600 ml-1">{"\u2195"}</span>;
    return (
      <span className="text-indigo-500 ml-1">
        {sortDir === "desc" ? "\u25BC" : "\u25B2"}
      </span>
    );
  };

  if (selectedLead) {
    return (
      <LeadDetail lead={selectedLead} onBack={() => setSelectedLead(null)} />
    );
  }

  return (
    <div>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Score Tier
          </label>
          <select
            value={tierFilter}
            onChange={(e) => setTierFilter(e.target.value as TierFilter)}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All Tiers</option>
            <option value="hot">Hot</option>
            <option value="warm">Warm</option>
            <option value="cool">Cool</option>
            <option value="cold">Cold</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Attribution
          </label>
          <select
            value={attrFilter}
            onChange={(e) =>
              setAttrFilter(e.target.value as AttributionFilter)
            }
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value="all">All</option>
            <option value="none">No Attribution</option>
            <option value="northbeam">Northbeam Users</option>
            <option value="competitor">Competitor Users</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1">
            Min Ad Channels
          </label>
          <select
            value={minChannels}
            onChange={(e) => setMinChannels(Number(e.target.value))}
            className="rounded-lg border border-zinc-300 bg-white px-3 py-1.5 text-sm dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-200"
          >
            <option value={0}>Any</option>
            <option value={1}>1+</option>
            <option value={2}>2+</option>
            <option value={3}>3+</option>
          </select>
        </div>

        <div className="ml-auto text-sm text-zinc-500 dark:text-zinc-400 self-end pb-1.5">
          {sorted.length} lead{sorted.length !== 1 ? "s" : ""}
        </div>
      </div>

      {/* Mobile card layout */}
      <div className="md:hidden space-y-3">
        {sorted.map((lead) => (
          <div
            key={lead.name}
            className="cursor-pointer rounded-xl border border-zinc-200 bg-white p-4 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:bg-zinc-800/50"
            onClick={() => setSelectedLead(lead)}
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <div className="font-medium text-zinc-900 dark:text-zinc-100">
                  {lead.name}
                </div>
                <div className="text-xs text-zinc-400">{lead.estimated_size} &middot; {lead.category}</div>
              </div>
              <TierBadge tier={lead.tier} />
            </div>
            <div className="flex items-center gap-2 mb-3">
              <div className="h-2 flex-1 max-w-[120px] overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                <div
                  className={`h-full rounded-full ${
                    lead.score >= 75
                      ? "bg-red-500"
                      : lead.score >= 50
                        ? "bg-amber-500"
                        : "bg-blue-500"
                  }`}
                  style={{ width: `${(lead.score / 100) * 100}%` }}
                />
              </div>
              <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                {lead.score}
              </span>
            </div>
            <div className="mb-2">
                <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Attribution</div>
                <TechPills
                  items={lead.attribution_tools}
                  color={
                    lead.attribution_tools.includes("Northbeam")
                      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                      : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                  }
                />
              </div>
            <div className="mb-2">
                <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Ad Pixels</div>
                <TechPills
                  items={lead.ad_pixels}
                  color="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                />
              </div>
            <div>
                <div className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider mb-1">Martech</div>
                <TechPills
                  items={lead.marketing_tech.slice(0, 3)}
                  color="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                />
                {lead.marketing_tech.length > 3 && (
                  <span className="ml-1 text-[11px] text-zinc-400">
                    +{lead.marketing_tech.length - 3}
                  </span>
                )}
              </div>
          </div>
        ))}
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            No leads match filters
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-100 dark:border-zinc-800">
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => handleSort("name")}
              >
                Brand
                <SortIcon field="name" />
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => handleSort("score")}
              >
                Score
                <SortIcon field="score" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Tier
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Attribution
              </th>
              <th
                className="cursor-pointer px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200"
                onClick={() => handleSort("channels")}
              >
                Ad Pixels
                <SortIcon field="channels" />
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400 lg:table-cell hidden">
                Martech
              </th>
              <th className="px-4 py-3 text-left font-medium text-zinc-500 dark:text-zinc-400">
                Category
              </th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((lead) => (
              <tr
                key={lead.name}
                className="cursor-pointer border-b border-zinc-50 transition-colors hover:bg-zinc-50 dark:border-zinc-800/50 dark:hover:bg-zinc-800/50"
                onClick={() => setSelectedLead(lead)}
              >
                <td className="px-4 py-3">
                  <div className="font-medium text-zinc-900 dark:text-zinc-100">
                    {lead.name}
                  </div>
                  <div className="text-xs text-zinc-400">{lead.estimated_size}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-20 overflow-hidden rounded-full bg-zinc-100 dark:bg-zinc-800">
                      <div
                        className={`h-full rounded-full ${
                          lead.score >= 75
                            ? "bg-red-500"
                            : lead.score >= 50
                              ? "bg-amber-500"
                              : "bg-blue-500"
                        }`}
                        style={{ width: `${(lead.score / 100) * 100}%` }}
                      />
                    </div>
                    <span className="text-xs font-mono text-zinc-600 dark:text-zinc-300">
                      {lead.score}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <TierBadge tier={lead.tier} />
                </td>
                <td className="px-4 py-3">
                  <TechPills
                    items={lead.attribution_tools}
                    color={
                      lead.attribution_tools.includes("Northbeam")
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                        : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
                    }
                  />
                </td>
                <td className="px-4 py-3">
                  <TechPills
                    items={lead.ad_pixels}
                    color="bg-sky-50 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300"
                  />
                </td>
                <td className="hidden px-4 py-3 lg:table-cell">
                  <TechPills
                    items={lead.marketing_tech.slice(0, 3)}
                    color="bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400"
                  />
                  {lead.marketing_tech.length > 3 && (
                    <span className="ml-1 text-[11px] text-zinc-400">
                      +{lead.marketing_tech.length - 3}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-500 dark:text-zinc-400">
                  {lead.category}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {sorted.length === 0 && (
          <div className="px-4 py-8 text-center text-sm text-zinc-400">
            No leads match filters
          </div>
        )}
      </div>
    </div>
  );
}
