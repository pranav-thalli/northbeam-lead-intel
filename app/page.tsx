import { promises as fs } from "fs";
import path from "path";
import type { PipelineData } from "@/lib/types";
import { Dashboard } from "@/components/dashboard";

async function getData(): Promise<PipelineData> {
  const filePath = path.join(process.cwd(), "public", "data", "leads.json");
  const raw = await fs.readFile(filePath, "utf-8");
  return JSON.parse(raw);
}

export default async function Home() {
  const data = await getData();

  return (
    <div className="flex min-h-screen flex-col">
      {/* Header */}
      <header className="border-b border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 text-white text-sm font-bold">
              NB
            </div>
            <span className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              Lead Intel Dashboard
            </span>
          </div>
          <div className="flex items-center gap-4 text-sm text-zinc-500 dark:text-zinc-400">
            <span>
              {data.pipeline_metadata.brands_scraped} brands scraped
            </span>
            <a
              href="https://github.com/pranav-thalli/northbeam-lead-intel"
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg border border-zinc-300 px-3 py-1.5 text-zinc-700 transition-colors hover:bg-zinc-50 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800"
            >
              Source
            </a>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <div className="mx-auto max-w-6xl px-6 py-8">
          <Dashboard data={data} />
        </div>
      </main>

      <footer className="border-t border-zinc-200 dark:border-zinc-800">
        <div className="mx-auto max-w-6xl px-6 py-4 text-sm text-zinc-500">
          Built by Pranav as a proof-of-work project for the Northbeam AI
          Operations Automation Analyst role. Data scraped from live eCommerce
          sites.
        </div>
      </footer>
    </div>
  );
}
