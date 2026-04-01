export interface Lead {
  name: string;
  url: string;
  category: string;
  estimated_size: "small" | "mid" | "large";
  ad_pixels: string[];
  marketing_tech: string[];
  attribution_tools: string[];
  platform: string[];
  ad_channel_count: number;
  score: number;
  tier: "hot" | "warm" | "cool" | "cold";
  score_reasons: string[];
  meta_ad_library: {
    library_url: string;
    has_active_ads: boolean | null;
    checked: boolean;
  };
  scrape_status: "success" | "failed";
  scraped_at: string;
}

export interface Insights {
  total_brands_analyzed: number;
  attribution_adoption: {
    has_attribution_tool: number;
    no_attribution_tool: number;
    adoption_rate_pct: number;
  };
  competitor_breakdown: Record<string, number>;
  ad_channels: {
    avg_channels_per_brand: number;
    by_company_size: Record<string, number>;
  };
  tier_distribution: Record<string, number>;
  martech_breakdown: Record<string, number>;
  platform_breakdown: Record<string, number>;
  score_stats: {
    avg: number;
    max: number;
    min: number;
  };
  generated_at: string;
}

export interface PipelineData {
  leads: Lead[];
  insights: Insights;
  pipeline_metadata: {
    brands_input: number;
    brands_scraped: number;
    brands_failed: number;
    run_at: string;
  };
}

export type TierFilter = "all" | "hot" | "warm" | "cool" | "cold";
export type AttributionFilter = "all" | "none" | "northbeam" | "competitor";
