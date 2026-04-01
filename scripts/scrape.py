"""
Competitive Intel & Lead Enrichment Pipeline for Northbeam GTM

Scrapes eCommerce brand sites for:
- Ad pixels (Meta Pixel, Google Ads/gtag, TikTok Pixel, Snapchat, Pinterest)
- Marketing tech (Klaviyo, Attentive, Mailchimp, Omnisend, Postscript)
- Attribution tools (Northbeam, Triple Whale, Rockerbox, Hyros, Wicked Reports)
- Platform detection (Shopify, BigCommerce, WooCommerce, Magento)
- Meta Ad Library active ad signals

Scores each brand as a Northbeam prospect and outputs JSON for the dashboard.
"""

import json
import re
import sys
import time
import urllib.request
import urllib.error
import urllib.parse
import ssl
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from datetime import datetime, timezone


# --- Detection Signatures ---

AD_PIXELS = {
    "Meta Pixel": [
        r"connect\.facebook\.net",
        r"fbq\s*\(",
        r"facebook\.com/tr",
        r"_fbp",
        r"fb-pixel",
    ],
    "Google Ads": [
        r"googleads\.g\.doubleclick\.net",
        r"google_conversion_id",
        r"gtag\(.*config.*AW-",
        r"googleadservices\.com",
        r"google_tag_data",
    ],
    "Google Analytics": [
        r"google-analytics\.com",
        r"gtag\(.*config.*G-",
        r"gtag\(.*config.*UA-",
        r"googletagmanager\.com",
    ],
    "TikTok Pixel": [
        r"analytics\.tiktok\.com",
        r"ttq\.",
        r"tiktok\.com/i18n/pixel",
    ],
    "Snapchat Pixel": [
        r"sc-static\.net/scevent",
        r"snaptr\(",
        r"snap\.licdn",
    ],
    "Pinterest Tag": [
        r"pintrk\(",
        r"ct\.pinterest\.com",
        r"pinterest\.com/ct",
    ],
}

MARKETING_TECH = {
    "Klaviyo": [
        r"static\.klaviyo\.com",
        r"klaviyo\.com",
        r"_learnq",
        r"klav-",
    ],
    "Attentive": [
        r"attentive\.com",
        r"attn\.tv",
        r"attentivemobile",
    ],
    "Mailchimp": [
        r"chimpstatic\.com",
        r"list-manage\.com",
        r"mailchimp",
    ],
    "Omnisend": [
        r"omnisend\.com",
        r"omnisrc\.com",
    ],
    "Postscript": [
        r"postscript\.io",
        r"ps-widget",
    ],
    "Yotpo": [
        r"yotpo\.com",
        r"staticw2\.yotpo",
    ],
    "Gorgias": [
        r"gorgias\.chat",
        r"gorgias\.io",
    ],
    "Privy": [
        r"privy\.com",
        r"widget\.privy",
    ],
    "Retention.com": [
        r"retention\.com",
        r"r]etention\.co",
    ],
}

ATTRIBUTION_TOOLS = {
    "Northbeam": [
        r"northbeam\.io",
        r"j\.northbeam",
        r"northbeam",
    ],
    "Triple Whale": [
        r"triplewhale\.com",
        r"triple-whale",
        r"triplewhale",
    ],
    "Rockerbox": [
        r"rockerbox\.com",
        r"getrockerbox",
    ],
    "Hyros": [
        r"hyros\.com",
        r"hyros\.io",
        r"t\.hyros",
    ],
    "Wicked Reports": [
        r"wickedreports\.com",
        r"wicked_id",
    ],
    "Segment": [
        r"cdn\.segment\.com",
        r"analytics\.js",
        r"segment\.io",
    ],
}

PLATFORMS = {
    "Shopify": [
        r"cdn\.shopify\.com",
        r"shopify\.com",
        r"myshopify",
        r"Shopify\.theme",
    ],
    "BigCommerce": [
        r"bigcommerce\.com",
        r"cdn\.bigcommerce",
    ],
    "WooCommerce": [
        r"woocommerce",
        r"wc-ajax",
    ],
    "Magento": [
        r"mage/cookies",
        r"magento",
        r"Magento_",
    ],
    "Salesforce Commerce": [
        r"demandware\.net",
        r"salesforce-commerce",
    ],
}


def fetch_page(url: str, timeout: int = 15) -> str:
    """Fetch a webpage and return its HTML content."""
    ctx = ssl.create_default_context()
    ctx.check_hostname = False
    ctx.verify_mode = ssl.CERT_NONE

    headers = {
        "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9",
    }

    req = urllib.request.Request(url, headers=headers)
    try:
        with urllib.request.urlopen(req, timeout=timeout, context=ctx) as resp:
            charset = resp.headers.get_content_charset() or "utf-8"
            return resp.read().decode(charset, errors="replace")
    except Exception as e:
        print(f"  Warning: Could not fetch {url}: {e}", file=sys.stderr)
        return ""


def detect_tools(html: str, signatures: dict[str, list[str]]) -> list[str]:
    """Detect which tools are present based on regex signatures in the HTML."""
    detected = []
    for tool_name, patterns in signatures.items():
        for pattern in patterns:
            if re.search(pattern, html, re.IGNORECASE):
                detected.append(tool_name)
                break
    return detected


def check_meta_ad_library(brand_name: str) -> dict:
    """
    Check Meta Ad Library for active ads. Uses the public search page.
    Returns estimated activity level.
    """
    search_url = (
        f"https://www.facebook.com/ads/library/"
        f"?active_status=active&ad_type=all&country=US"
        f"&q={urllib.parse.quote(brand_name)}&media_type=all"
    )

    try:
        html = fetch_page(search_url, timeout=10)
        # Check for signals of active ads
        has_results = bool(html and len(html) > 5000)
        return {
            "library_url": search_url,
            "has_active_ads": has_results,
            "checked": True,
        }
    except Exception:
        return {
            "library_url": search_url,
            "has_active_ads": None,
            "checked": False,
        }


def score_lead(brand_data: dict) -> dict:
    """
    Score a brand as a Northbeam prospect (0-100).

    Scoring factors:
    - Ad channel count (more channels = more need for attribution)
    - No current attribution tool (opportunity)
    - Uses competitor attribution (displacement opportunity)
    - Marketing tech sophistication
    - Active Meta ads
    - Company size
    """
    score = 0
    reasons = []

    # Ad channel diversity (0-30 pts)
    ad_count = len(brand_data["ad_pixels"])
    if ad_count >= 4:
        score += 30
        reasons.append(f"Heavy multi-channel advertiser ({ad_count} pixel types)")
    elif ad_count >= 3:
        score += 25
        reasons.append(f"Multi-channel advertiser ({ad_count} pixel types)")
    elif ad_count >= 2:
        score += 15
        reasons.append(f"Multi-channel advertiser ({ad_count} pixel types)")
    elif ad_count >= 1:
        score += 5

    # Attribution tool status (0-30 pts)
    attribution = brand_data["attribution_tools"]
    if not attribution:
        score += 25
        reasons.append("No attribution tool detected — greenfield opportunity")
    elif "Northbeam" not in attribution:
        competitor_names = ", ".join(attribution)
        score += 30
        reasons.append(f"Uses competitor ({competitor_names}) — displacement opportunity")
    else:
        score += 0
        reasons.append("Already a Northbeam customer")

    # Marketing tech sophistication (0-15 pts)
    martech_count = len(brand_data["marketing_tech"])
    if martech_count >= 3:
        score += 15
        reasons.append(f"Sophisticated martech stack ({martech_count} tools)")
    elif martech_count >= 2:
        score += 10
    elif martech_count >= 1:
        score += 5

    # Platform (0-10 pts) — Shopify brands are ideal Northbeam customers
    if "Shopify" in brand_data.get("platform", []):
        score += 10
        reasons.append("Shopify store (native Northbeam integration)")

    # Company size (0-15 pts)
    size = brand_data.get("estimated_size", "unknown")
    if size == "large":
        score += 15
        reasons.append("Large brand — high-value prospect")
    elif size == "mid":
        score += 10
        reasons.append("Mid-market brand")
    elif size == "small":
        score += 5

    # Active Meta ads signal
    meta_ads = brand_data.get("meta_ad_library", {})
    if meta_ads.get("has_active_ads"):
        score += 5
        reasons.append("Active Meta ads detected")

    # Cap at 100
    score = min(score, 100)

    # Tier assignment
    if score >= 75:
        tier = "hot"
    elif score >= 50:
        tier = "warm"
    elif score >= 25:
        tier = "cool"
    else:
        tier = "cold"

    return {
        "score": score,
        "tier": tier,
        "reasons": reasons,
    }


def scrape_brand(brand: dict) -> dict:
    """Scrape a single brand and return enriched data."""
    name = brand["name"]
    url = brand["url"]
    print(f"Scraping {name} ({url})...")

    html = fetch_page(url)

    if not html:
        return {
            **brand,
            "ad_pixels": [],
            "marketing_tech": [],
            "attribution_tools": [],
            "platform": [],
            "meta_ad_library": {"checked": False},
            "scrape_status": "failed",
            "scraped_at": datetime.now(timezone.utc).isoformat(),
        }

    ad_pixels = detect_tools(html, AD_PIXELS)
    marketing_tech = detect_tools(html, MARKETING_TECH)
    attribution_tools = detect_tools(html, ATTRIBUTION_TOOLS)
    platform = detect_tools(html, PLATFORMS)

    result = {
        **brand,
        "ad_pixels": ad_pixels,
        "marketing_tech": marketing_tech,
        "attribution_tools": attribution_tools,
        "platform": platform,
        "ad_channel_count": len(ad_pixels),
        "scrape_status": "success",
        "scraped_at": datetime.now(timezone.utc).isoformat(),
    }

    # Check Meta Ad Library
    meta_data = check_meta_ad_library(name)
    result["meta_ad_library"] = meta_data

    # Score the lead
    scoring = score_lead(result)
    result["score"] = scoring["score"]
    result["tier"] = scoring["tier"]
    result["score_reasons"] = scoring["reasons"]

    return result


def compute_insights(results: list[dict]) -> dict:
    """Compute aggregate insights from the scraped data."""
    successful = [r for r in results if r["scrape_status"] == "success"]
    total = len(successful)

    if total == 0:
        return {"error": "No successful scrapes"}

    # Attribution tool adoption
    has_attribution = [r for r in successful if r["attribution_tools"]]
    no_attribution = [r for r in successful if not r["attribution_tools"]]

    # Competitor breakdown
    competitor_counts: dict[str, int] = {}
    for r in successful:
        for tool in r["attribution_tools"]:
            competitor_counts[tool] = competitor_counts.get(tool, 0) + 1

    # Ad channel stats
    channel_counts = [r["ad_channel_count"] for r in successful]
    avg_channels = sum(channel_counts) / len(channel_counts)

    # Channel by size
    size_channel_avg: dict[str, list[int]] = {}
    for r in successful:
        size = r.get("estimated_size", "unknown")
        size_channel_avg.setdefault(size, []).append(r["ad_channel_count"])

    size_avgs = {
        size: round(sum(counts) / len(counts), 1)
        for size, counts in size_channel_avg.items()
    }

    # Tier distribution
    tier_counts = {"hot": 0, "warm": 0, "cool": 0, "cold": 0}
    for r in successful:
        tier_counts[r["tier"]] = tier_counts.get(r["tier"], 0) + 1

    # Marketing tech adoption
    martech_counts: dict[str, int] = {}
    for r in successful:
        for tool in r["marketing_tech"]:
            martech_counts[tool] = martech_counts.get(tool, 0) + 1

    # Platform breakdown
    platform_counts: dict[str, int] = {}
    for r in successful:
        for p in r["platform"]:
            platform_counts[p] = platform_counts.get(p, 0) + 1

    # Scores
    scores = [r["score"] for r in successful]

    return {
        "total_brands_analyzed": total,
        "attribution_adoption": {
            "has_attribution_tool": len(has_attribution),
            "no_attribution_tool": len(no_attribution),
            "adoption_rate_pct": round(len(has_attribution) / total * 100, 1),
        },
        "competitor_breakdown": dict(
            sorted(competitor_counts.items(), key=lambda x: x[1], reverse=True)
        ),
        "ad_channels": {
            "avg_channels_per_brand": round(avg_channels, 1),
            "by_company_size": size_avgs,
        },
        "tier_distribution": tier_counts,
        "martech_breakdown": dict(
            sorted(martech_counts.items(), key=lambda x: x[1], reverse=True)
        ),
        "platform_breakdown": dict(
            sorted(platform_counts.items(), key=lambda x: x[1], reverse=True)
        ),
        "score_stats": {
            "avg": round(sum(scores) / len(scores), 1),
            "max": max(scores),
            "min": min(scores),
        },
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


def main():
    script_dir = Path(__file__).parent
    brands_file = script_dir / "brands.json"
    output_file = script_dir.parent / "public" / "data" / "leads.json"

    # Load brands
    with open(brands_file) as f:
        brands = json.load(f)

    print(f"\nStarting pipeline for {len(brands)} brands...\n")

    # Scrape brands with threading for speed
    results = []
    with ThreadPoolExecutor(max_workers=5) as executor:
        futures = {executor.submit(scrape_brand, brand): brand for brand in brands}
        for future in as_completed(futures):
            try:
                result = future.result()
                results.append(result)
                status = "OK" if result["scrape_status"] == "success" else "FAIL"
                print(
                    f"  [{status}] {result['name']}: "
                    f"score={result.get('score', 'N/A')} "
                    f"tier={result.get('tier', 'N/A')} "
                    f"pixels={result.get('ad_pixels', [])} "
                    f"attribution={result.get('attribution_tools', [])}"
                )
            except Exception as e:
                brand = futures[future]
                print(f"  [ERROR] {brand['name']}: {e}", file=sys.stderr)

    # Sort by score descending
    results.sort(key=lambda x: x.get("score", 0), reverse=True)

    # Compute insights
    insights = compute_insights(results)

    # Build output
    output = {
        "leads": results,
        "insights": insights,
        "pipeline_metadata": {
            "brands_input": len(brands),
            "brands_scraped": len([r for r in results if r["scrape_status"] == "success"]),
            "brands_failed": len([r for r in results if r["scrape_status"] == "failed"]),
            "run_at": datetime.now(timezone.utc).isoformat(),
        },
    }

    # Write output
    output_file.parent.mkdir(parents=True, exist_ok=True)
    with open(output_file, "w") as f:
        json.dump(output, f, indent=2)

    print(f"\nPipeline complete!")
    print(f"  Results written to: {output_file}")
    print(f"  Brands scraped: {output['pipeline_metadata']['brands_scraped']}/{len(brands)}")
    print(f"\n--- Insights ---")
    print(f"  Attribution adoption: {insights['attribution_adoption']['adoption_rate_pct']}%")
    print(f"  Competitor breakdown: {insights['competitor_breakdown']}")
    print(f"  Avg ad channels: {insights['ad_channels']['avg_channels_per_brand']}")
    print(f"  Tier distribution: {insights['tier_distribution']}")
    print(f"  Avg score: {insights['score_stats']['avg']}")

    return output


if __name__ == "__main__":
    main()
