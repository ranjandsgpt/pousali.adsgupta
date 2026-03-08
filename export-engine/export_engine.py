#!/usr/bin/env python3
"""
Zenith CXO Export Engine (Phase 5, 33-36).
Reads PremiumState JSON from stdin; generates charts to output dir; prints manifest JSON to stdout.
Design system: #0F172A background, #E5E5E7 axis, #D4AF37 highlight, #374151 grid, Roboto.
"""

import json
import os
import sys
from pathlib import Path

# Phase 35 — Chart Design System
CHART_STYLE = {
    "background": "#0F172A",
    "axis_text": "#E5E7EB",
    "highlight": "#D4AF37",
    "gridlines": "#374151",
    "font": "Roboto",
}

def apply_premium_style(ax):
    """Apply premium styling to matplotlib axes."""
    try:
        import matplotlib.pyplot as plt
        ax.set_facecolor(CHART_STYLE["background"])
        ax.tick_params(colors=CHART_STYLE["axis_text"])
        ax.xaxis.label.set_color(CHART_STYLE["axis_text"])
        ax.yaxis.label.set_color(CHART_STYLE["axis_text"])
        ax.spines["bottom"].set_color(CHART_STYLE["gridlines"])
        ax.spines["top"].set_color(CHART_STYLE["gridlines"])
        ax.spines["left"].set_color(CHART_STYLE["gridlines"])
        ax.spines["right"].set_color(CHART_STYLE["gridlines"])
        ax.grid(True, color=CHART_STYLE["gridlines"], alpha=0.3)
        ax.title.set_color(CHART_STYLE["axis_text"])
    except Exception:
        pass


def generate_charts(premium_state: dict, output_dir: str) -> list:
    """
    Phase 34 — Generate premium charts from PremiumState.
    Returns list of { "id", "path", "title" }.
    """
    result = []
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    try:
        import matplotlib
        matplotlib.use("Agg")
        import matplotlib.pyplot as plt
        plt.rcParams["font.family"] = CHART_STYLE["font"]
        plt.rcParams["axes.facecolor"] = CHART_STYLE["background"]
        plt.rcParams["figure.facecolor"] = CHART_STYLE["background"]
        plt.rcParams["text.color"] = CHART_STYLE["axis_text"]
        plt.rcParams["axes.labelcolor"] = CHART_STYLE["axis_text"]
        plt.rcParams["xtick.color"] = CHART_STYLE["axis_text"]
        plt.rcParams["ytick.color"] = CHART_STYLE["axis_text"]
    except Exception:
        return result

    campaigns = premium_state.get("campaignAnalysis", [])[:15]
    keywords = premium_state.get("keywordAnalysis", [])[:20]
    waste = premium_state.get("wasteAnalysis", [])[:15]

    # Spend vs ROAS scatter
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            spends = [c["spend"] for c in campaigns]
            roas_list = [c.get("roas") or (c["sales"] / c["spend"] if c["spend"] else 0) for c in campaigns]
            names = [c["campaignName"][:20] for c in campaigns]
            ax.scatter(spends, roas_list, c=CHART_STYLE["highlight"], s=60, alpha=0.9)
            apply_premium_style(ax)
            ax.set_title("Spend vs ROAS", color=CHART_STYLE["axis_text"])
            ax.set_xlabel("Spend")
            ax.set_ylabel("ROAS")
            p = output_path / "spend-vs-roas.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "spend-vs-roas", "path": str(p), "title": "Spend vs ROAS"})
        except Exception:
            pass

    # Campaign spend distribution
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            names = [c["campaignName"][:18] for c in campaigns]
            spends = [c["spend"] for c in campaigns]
            bars = ax.bar(range(len(names)), spends, color=CHART_STYLE["highlight"], alpha=0.85)
            ax.set_xticks(range(len(names)))
            ax.set_xticklabels(names, rotation=45, ha="right")
            apply_premium_style(ax)
            ax.set_title("Campaign Spend Distribution")
            ax.set_ylabel("Spend")
            p = output_path / "campaign-spend-distribution.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "campaign-spend", "path": str(p), "title": "Campaign Spend Distribution"})
        except Exception:
            pass

    # ROAS by campaign
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            names = [c["campaignName"][:18] for c in campaigns]
            roas_list = [c.get("roas") or (c["sales"] / c["spend"] if c["spend"] else 0) for c in campaigns]
            ax.barh(range(len(names)), roas_list, color=CHART_STYLE["highlight"], alpha=0.85)
            ax.set_yticks(range(len(names)))
            ax.set_yticklabels(names)
            apply_premium_style(ax)
            ax.set_title("ROAS by Campaign")
            ax.set_xlabel("ROAS")
            p = output_path / "roas-by-campaign.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "roas-by-campaign", "path": str(p), "title": "ROAS by Campaign"})
        except Exception:
            pass

    # Keyword waste distribution
    if waste:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            terms = [w["searchTerm"][:18] for w in waste]
            spends = [w["spend"] for w in waste]
            ax.bar(range(len(terms)), spends, color=CHART_STYLE["highlight"], alpha=0.85)
            ax.set_xticks(range(len(terms)))
            ax.set_xticklabels(terms, rotation=45, ha="right")
            apply_premium_style(ax)
            ax.set_title("Keyword Waste Distribution")
            ax.set_ylabel("Spend")
            p = output_path / "keyword-waste-distribution.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "keyword-waste", "path": str(p), "title": "Keyword Waste Distribution"})
        except Exception:
            pass

    # Ad vs organic revenue (pie)
    metrics = premium_state.get("verifiedMetrics", [])
    ad_sales = next((m["value"] for m in metrics if m["label"] == "Ad Sales"), 0)
    store_sales = next((m["value"] for m in metrics if m["label"] == "Store Sales"), 0)
    if isinstance(ad_sales, str):
        ad_sales = float(ad_sales.replace("%", "")) if ad_sales else 0
    if isinstance(store_sales, str):
        store_sales = float(store_sales.replace("%", "")) if store_sales else 0
    organic = max(0, store_sales - ad_sales) if isinstance(store_sales, (int, float)) and isinstance(ad_sales, (int, float)) else 0
    if ad_sales or organic:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            ax.pie(
                [ad_sales, organic],
                labels=["Ad Revenue", "Organic Revenue"],
                colors=[CHART_STYLE["highlight"], CHART_STYLE["gridlines"]],
                autopct="%1.1f%%",
                textprops={"color": CHART_STYLE["axis_text"]},
            )
            ax.set_title("Ad vs Organic Revenue")
            p = output_path / "ad-vs-organic-revenue.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "ad-vs-organic", "path": str(p), "title": "Ad vs Organic Revenue"})
        except Exception:
            pass

    return result


def compose_slide(title: str, insight_narrative: str, chart_path: str = "", key_takeaway: str = "") -> dict:
    """
    Phase 36 — Consulting slide layout spec.
    Returns a dict describing the slide: title, insight narrative, chart or table, key takeaway.
    """
    return {
        "title": title,
        "insightNarrative": insight_narrative,
        "chartPath": chart_path,
        "keyTakeaway": key_takeaway,
    }


def main():
    if sys.stdin.isatty():
        print(json.dumps({"charts": [], "slides": [], "error": "No stdin"}), flush=True)
        return

    try:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        premium_state = payload.get("premiumState", payload)
        output_dir = payload.get("outputDir", os.path.join(os.getcwd(), "export-cache", "charts"))
    except Exception as e:
        print(json.dumps({"charts": [], "slides": [], "error": str(e)}), flush=True)
        sys.exit(1)

    charts = generate_charts(premium_state, output_dir)
    slides = []
    if premium_state.get("executiveNarrative"):
        slides.append(compose_slide(
            "Executive Summary",
            premium_state["executiveNarrative"][:500],
            charts[0]["path"] if charts else "",
            "Key metrics and narrative from audit.",
        ))

    out = {"charts": charts, "slides": slides, "outputDir": output_dir}
    print(json.dumps(out), flush=True)


if __name__ == "__main__":
    main()
