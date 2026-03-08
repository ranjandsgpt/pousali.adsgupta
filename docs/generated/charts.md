# Charts & Visualizations

## Chart: Spend vs ROAS

**Purpose:** Identify inefficient campaigns.

**Axes:** X = Ad Spend, Y = ROAS

**Interpretation:**
- Top-left = low spend, high ROAS (scaling opportunity)
- Bottom-right = high spend, low ROAS (waste)

## Chart: Campaign Spend Distribution

**Purpose:** See spend concentration across campaigns.

## Chart: ACOS Distribution

**Purpose:** Distribution of ACOS across keywords/campaigns.

## Rendering

- **Python:** `export_engine.py` with PremiumState (timeout 8s).
- **Node fallback:** `renderChartsNodeFallback` — placeholder PNGs so export never blocks.
- Charts rendered in **parallel** for performance.
