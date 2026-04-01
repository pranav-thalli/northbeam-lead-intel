"use client";

import type { Lead } from "@/lib/types";

interface LeadDetailProps {
  lead: Lead;
  onBack: () => void;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
      <h3 className="mb-3 text-sm font-semibold text-zinc-500 uppercase tracking-wider dark:text-zinc-400">
        {title}
      </h3>
      {children}
    </div>
  );
}

function DetectedList({
  items,
  emptyText,
  color,
}: {
  items: string[];
  emptyText: string;
  color: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-400 italic">{emptyText}</p>
    );
  }
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((item) => (
        <span
          key={item}
          className={`inline-flex items-center rounded-lg px-3 py-1.5 text-sm font-medium ${color}`}
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function LeadDetail({ lead, onBack }: LeadDetailProps) {
  const tierColors: Record<string, string> = {
    hot: "text-red-600 dark:text-red-400",
    warm: "text-amber-600 dark:text-amber-400",
    cool: "text-blue-600 dark:text-blue-400",
    cold: "text-zinc-500",
  };

  return (
    <div>
      {/* Back button + header */}
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-200 transition-colors"
      >
        <span>&larr;</span> Back to leads
      </button>

      <div className="mb-6 flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
            {lead.name}
          </h2>
          <div className="mt-1 flex items-center gap-3 text-sm text-zinc-500 dark:text-zinc-400">
            <span>{lead.category}</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <span className="capitalize">{lead.estimated_size} brand</span>
            <span className="text-zinc-300 dark:text-zinc-700">|</span>
            <a
              href={lead.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline dark:text-indigo-400"
            >
              {lead.url.replace("https://", "")}
            </a>
          </div>
        </div>
        <div className="text-right">
          <div className="text-4xl font-bold text-zinc-900 dark:text-zinc-100">
            {lead.score}
          </div>
          <div
            className={`text-sm font-semibold uppercase ${tierColors[lead.tier]}`}
          >
            {lead.tier} prospect
          </div>
        </div>
      </div>

      {/* Score reasons */}
      <div className="mb-6 rounded-xl border border-indigo-200 bg-indigo-50/50 p-4 dark:border-indigo-900 dark:bg-indigo-950/20">
        <h3 className="mb-2 text-sm font-semibold text-indigo-700 dark:text-indigo-300">
          Why this score?
        </h3>
        <ul className="space-y-1">
          {lead.score_reasons.map((reason, i) => (
            <li
              key={i}
              className="flex items-start gap-2 text-sm text-zinc-700 dark:text-zinc-300"
            >
              <span className="mt-0.5 text-indigo-400">&#8226;</span>
              {reason}
            </li>
          ))}
        </ul>
      </div>

      {/* Detail sections */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <Section title="Attribution Tools">
          <DetectedList
            items={lead.attribution_tools}
            emptyText="No attribution tools detected -- greenfield opportunity"
            color={
              lead.attribution_tools.includes("Northbeam")
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300"
                : "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
            }
          />
        </Section>

        <Section title="Ad Pixels">
          <DetectedList
            items={lead.ad_pixels}
            emptyText="No ad pixels detected in initial page load"
            color="bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-300"
          />
        </Section>

        <Section title="Marketing Tech">
          <DetectedList
            items={lead.marketing_tech}
            emptyText="No marketing tech detected"
            color="bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300"
          />
        </Section>

        <Section title="Platform">
          <DetectedList
            items={lead.platform}
            emptyText="Platform not detected"
            color="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300"
          />
        </Section>
      </div>

      {/* Meta Ad Library link */}
      {lead.meta_ad_library?.library_url && (
        <div className="mt-4">
          <a
            href={lead.meta_ad_library.library_url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-300 dark:hover:bg-zinc-700"
          >
            View in Meta Ad Library &rarr;
          </a>
        </div>
      )}
    </div>
  );
}
