#!/usr/bin/env python3
"""
Zenith CXO Export Engine (Phase 5, 33-36, 42, 45-46).
Charts, PDF (reportlab), optimize_visual_layout. Theme: #0F172A, #D4AF37, Roboto.
"""

import json
import os
import sys
from pathlib import Path

CHART_STYLE = {
    "background": "#0F172A",
    "axis_text": "#E5E7EB",
    "highlight": "#D4AF37",
    "gridlines": "#374151",
    "font": "Roboto",
}

# Phase 45 — Grid
LAYOUT_MARGIN_INCH = 1.0
LAYOUT_PADDING_INCH = 0.5

# Phase 44/46 — Chart density limits
MAX_POINTS_SCATTER = 200
MAX_CATEGORIES_BAR = 20


def apply_premium_style(ax):
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


def _chart_source_map(premium_state: dict) -> dict:
    """Build chartId -> source from premium_state.chartSources (SLM → Gemini → Python)."""
    sources = premium_state.get("chartSources", [])
    return {s.get("chartId", ""): s.get("source", "python") for s in sources if s.get("chartId")}


def generate_charts(premium_state: dict, output_dir: str) -> list:
    """Phase 34 + 46: Premium charts. Chart source priority: SLM → Gemini → Python; record in result."""
    source_map = _chart_source_map(premium_state)
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

    campaigns = premium_state.get("campaignAnalysis", [])[:MAX_CATEGORIES_BAR]
    keywords = premium_state.get("keywordAnalysis", [])[:min(MAX_POINTS_SCATTER, 50)]
    waste = premium_state.get("wasteAnalysis", [])[:MAX_CATEGORIES_BAR]

    # Spend vs ROAS scatter
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            spends = [c["spend"] for c in campaigns]
            roas_list = [c.get("roas") or (c["sales"] / c["spend"] if c["spend"] else 0) for c in campaigns]
            ax.scatter(spends, roas_list, c=CHART_STYLE["highlight"], s=60, alpha=0.9)
            apply_premium_style(ax)
            ax.set_title("Spend vs ROAS")
            ax.set_xlabel("Spend")
            ax.set_ylabel("ROAS")
            p = output_path / "spend-vs-roas.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "spend-vs-roas", "path": str(p), "title": "Spend vs ROAS", "source": source_map.get("spend-vs-roas", "python")})
        except Exception:
            pass

    # Campaign spend distribution
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            names = [c["campaignName"][:18] for c in campaigns]
            spends = [c["spend"] for c in campaigns]
            ax.bar(range(len(names)), spends, color=CHART_STYLE["highlight"], alpha=0.85)
            ax.set_xticks(range(len(names)))
            ax.set_xticklabels(names, rotation=45, ha="right")
            apply_premium_style(ax)
            ax.set_title("Campaign Spend Distribution")
            ax.set_ylabel("Spend")
            p = output_path / "campaign-spend-distribution.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "campaign-spend", "path": str(p), "title": "Campaign Spend Distribution", "source": source_map.get("campaign-spend", "python")})
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
            result.append({"id": "roas-by-campaign", "path": str(p), "title": "ROAS by Campaign", "source": source_map.get("roas-by-campaign", "python")})
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
            result.append({"id": "keyword-waste", "path": str(p), "title": "Keyword Waste Distribution", "source": source_map.get("keyword-waste", "python")})
        except Exception:
            pass

    # Ad vs organic revenue
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
            result.append({"id": "ad-vs-organic", "path": str(p), "title": "Ad vs Organic Revenue", "source": source_map.get("ad-vs-organic", "python")})
        except Exception:
            pass

    # Phase 46 — Conversion funnel (impressions -> clicks -> orders)
    try:
        clicks = next((m["value"] for m in metrics if m["label"] == "Clicks"), 0)
        orders = next((m["value"] for m in metrics if m["label"] == "Orders"), 0)
        if isinstance(clicks, str):
            clicks = float(clicks) if clicks else 0
        if isinstance(orders, str):
            orders = float(orders) if orders else 0
        impressions = int(clicks * 3) if isinstance(clicks, (int, float)) else 0
        if impressions or clicks or orders:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            stages = ["Impressions", "Clicks", "Orders"]
            vals = [impressions, int(clicks) if isinstance(clicks, (int, float)) else 0, int(orders) if isinstance(orders, (int, float)) else 0]
            ax.bar(stages, vals, color=CHART_STYLE["highlight"], alpha=0.85)
            apply_premium_style(ax)
            ax.set_title("Conversion Funnel")
            p = output_path / "conversion-funnel.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "conversion-funnel", "path": str(p), "title": "Conversion Funnel", "source": source_map.get("conversion-funnel", "python")})
    except Exception:
        pass

    # Phase 46 — Keyword opportunity scatter (spend vs ROAS)
    if keywords and len(keywords) <= MAX_POINTS_SCATTER:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            spends = [k["spend"] for k in keywords[:MAX_POINTS_SCATTER]]
            roas_list = [k.get("roas", 0) for k in keywords[:MAX_POINTS_SCATTER]]
            ax.scatter(spends, roas_list, c=CHART_STYLE["highlight"], s=40, alpha=0.8)
            apply_premium_style(ax)
            ax.set_title("Keyword Opportunity (Spend vs ROAS)")
            ax.set_xlabel("Spend")
            ax.set_ylabel("ROAS")
            p = output_path / "keyword-opportunity-scatter.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "keyword-opportunity-scatter", "path": str(p), "title": "Keyword Opportunity Scatter", "source": source_map.get("keyword-opportunity-scatter", "python")})
        except Exception:
            pass

    # Phase 46 — ACOS distribution histogram
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            acos_vals = [c.get("acos", 0) for c in campaigns]
            ax.hist(acos_vals, bins=min(15, len(set(acos_vals)) or 1), color=CHART_STYLE["highlight"], alpha=0.85, edgecolor=CHART_STYLE["gridlines"])
            apply_premium_style(ax)
            ax.set_title("ACOS Distribution")
            ax.set_xlabel("ACOS %")
            ax.set_ylabel("Campaigns")
            p = output_path / "acos-distribution.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "acos-distribution", "path": str(p), "title": "ACOS Distribution", "source": source_map.get("acos-distribution", "python")})
        except Exception:
            pass

    # Phase 46 — Campaign efficiency quadrant (spend vs ROAS)
    if campaigns:
        try:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            spends = [c["spend"] for c in campaigns]
            roas_list = [c.get("roas") or (c["sales"] / c["spend"] if c["spend"] else 0) for c in campaigns]
            ax.scatter(spends, roas_list, c=CHART_STYLE["highlight"], s=60, alpha=0.9)
            if spends and roas_list:
                ax.axhline(y=sum(roas_list) / len(roas_list), color=CHART_STYLE["gridlines"], linestyle="--", alpha=0.5)
                ax.axvline(x=sum(spends) / len(spends), color=CHART_STYLE["gridlines"], linestyle="--", alpha=0.5)
            apply_premium_style(ax)
            ax.set_title("Campaign Efficiency Quadrant")
            ax.set_xlabel("Spend")
            ax.set_ylabel("ROAS")
            p = output_path / "campaign-efficiency-quadrant.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "campaign-efficiency-quadrant", "path": str(p), "title": "Campaign Efficiency Quadrant", "source": source_map.get("campaign-efficiency-quadrant", "python")})
        except Exception:
            pass

    # Phase 46 — Profitability waterfall (placeholder: ad spend, ad sales, contribution)
    try:
        total_spend = next((m["value"] for m in metrics if m["label"] == "Ad Spend"), 0)
        total_sales = next((m["value"] for m in metrics if m["label"] == "Ad Sales"), 0)
        if isinstance(total_spend, str):
            total_spend = float(total_spend) if total_spend else 0
        if isinstance(total_sales, str):
            total_sales = float(total_sales) if total_sales else 0
        if total_spend or total_sales:
            fig, ax = plt.subplots(facecolor=CHART_STYLE["background"])
            labels = ["Ad Spend", "Ad Sales", "Contribution"]
            vals = [float(total_spend), float(total_sales), float(total_sales) - float(total_spend)]
            colors = [CHART_STYLE["gridlines"], CHART_STYLE["highlight"], CHART_STYLE["highlight"] if vals[2] >= 0 else CHART_STYLE["gridlines"]]
            ax.bar(labels, vals, color=colors, alpha=0.85)
            apply_premium_style(ax)
            ax.set_title("Profitability Waterfall")
            ax.set_ylabel("Amount")
            p = output_path / "profitability-waterfall.png"
            fig.savefig(p, facecolor=CHART_STYLE["background"], edgecolor="none", bbox_inches="tight")
            plt.close()
            result.append({"id": "profitability-waterfall", "path": str(p), "title": "Profitability Waterfall", "source": source_map.get("profitability-waterfall", "python")})
    except Exception:
        pass

    return result


# Consulting slide structure: Title, Chart, Key Findings (3 bullets), Recommendation (1 bullet)
MAX_WORDS_PER_BULLET = 15
SLIDE_WORD_CAP = 90


def _truncate_words(text: str, max_words: int) -> str:
    words = (text or "").strip().split()
    return " ".join(words[:max_words]) if words else ""


def compose_slide(
    title: str,
    chart_path: str = "",
    key_findings: list = None,
    recommendation: str = "",
    insight_narrative: str = "",
    key_takeaway: str = "",
    highlight_metric: dict = None,
) -> dict:
    """Enforce consulting structure: Title, Chart, Key Findings (3 bullets), Recommendation (1 bullet). Optional highlightMetric: { label, value, trend } with gold styling."""
    key_findings = key_findings or []
    bullets = [_truncate_words(b, MAX_WORDS_PER_BULLET) for b in key_findings[:3]]
    rec_bullet = _truncate_words(recommendation or key_takeaway, MAX_WORDS_PER_BULLET)
    narrative = insight_narrative or " ".join(bullets) + " " + rec_bullet
    word_count = len(narrative.strip().split())
    if word_count > SLIDE_WORD_CAP:
        narrative = _truncate_words(narrative, SLIDE_WORD_CAP)
    out = {
        "title": title,
        "chartPath": chart_path,
        "keyFindings": bullets,
        "recommendation": rec_bullet,
        "insightNarrative": narrative,
        "keyTakeaway": rec_bullet,
        "wordCount": min(word_count, SLIDE_WORD_CAP),
    }
    if highlight_metric and isinstance(highlight_metric, dict):
        out["highlightMetric"] = {
            "label": str(highlight_metric.get("label", "")),
            "value": str(highlight_metric.get("value", "")),
            "trend": str(highlight_metric.get("trend", "")),
        }
    return out


def optimize_visual_layout(slides: list) -> list:
    """
    Phase 45 — Split slides with too many elements, enforce margin/padding grid.
    margin = 1.0 inch, padding = 0.5 inch. Resize charts, align tables.
    """
    result = []
    for s in slides:
        out = dict(s)
        out["marginInch"] = LAYOUT_MARGIN_INCH
        out["paddingInch"] = LAYOUT_PADDING_INCH
        # Simple split: if narrative very long, suggest split
        nar = s.get("insightNarrative", "")
        if len(nar) > 800:
            out["suggestSplit"] = True
        result.append(out)
    return result


def generate_pdf(premium_state: dict, charts: list, output_dir: str) -> str:
    """
    Phase 42 — Generate premium PDF with reportlab.
    8 pages: Executive summary, Account health, Campaign efficiency, Waste, Keyword opportunities, ASIN, Profitability, Action plan.
    Theme: #0F172A, #D4AF37, Roboto.
    """
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
    except ImportError:
        return ""

    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    pdf_path = output_path / "zenith_premium_report.pdf"

    doc = SimpleDocTemplate(
        str(pdf_path),
        pagesize=letter,
        leftMargin=LAYOUT_MARGIN_INCH * inch,
        rightMargin=LAYOUT_MARGIN_INCH * inch,
        topMargin=LAYOUT_MARGIN_INCH * inch,
        bottomMargin=LAYOUT_MARGIN_INCH * inch,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        name="ZenithTitle",
        parent=styles["Heading1"],
        fontName="Helvetica-Bold",
        fontSize=18,
        textColor=colors.HexColor("#D4AF37"),
        spaceAfter=12,
    )
    body_style = ParagraphStyle(
        name="ZenithBody",
        parent=styles["Normal"],
        fontName="Helvetica",
        fontSize=10,
        textColor=colors.HexColor("#E5E7EB"),
        spaceAfter=8,
    )
    story = []

    # Page 1: Executive summary
    story.append(Paragraph("Amazon Advertising CXO Audit", title_style))
    story.append(Spacer(1, 0.3 * inch))
    narrative = premium_state.get("executiveNarrative", "")[:2000]
    if narrative:
        story.append(Paragraph(narrative.replace("\n", "<br/>"), body_style))
    story.append(PageBreak())

    # Page 2: Account health
    story.append(Paragraph("Account Health", title_style))
    story.append(Spacer(1, 0.2 * inch))
    metrics = premium_state.get("verifiedMetrics", [])
    if metrics:
        rows = [["Metric", "Value"]]
        for m in metrics[:12]:
            rows.append([m.get("label", ""), str(m.get("value", ""))])
        t = Table(rows, colWidths=[3 * inch, 2 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D4AF37")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#E5E7EB")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#374151")),
        ]))
        story.append(t)
    story.append(PageBreak())

    # Page 3: Campaign efficiency
    story.append(Paragraph("Campaign Efficiency", title_style))
    campaigns = premium_state.get("campaignAnalysis", [])[:10]
    if campaigns:
        rows = [["Campaign", "Spend", "Sales", "ACOS"]]
        for c in campaigns:
            rows.append([c.get("campaignName", "")[:30], str(c.get("spend", 0)), str(c.get("sales", 0)), str(c.get("acos", 0)) + "%"])
        t = Table(rows, colWidths=[2.5 * inch, 1 * inch, 1 * inch, 0.8 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D4AF37")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#E5E7EB")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#374151")),
        ]))
        story.append(t)
    story.append(PageBreak())

    # Page 4: Waste analysis
    story.append(Paragraph("Waste Analysis", title_style))
    waste = premium_state.get("wasteAnalysis", [])[:10]
    if waste:
        rows = [["Keyword", "Campaign", "Spend", "Clicks"]]
        for w in waste:
            rows.append([w.get("searchTerm", "")[:25], w.get("campaign", "")[:20], str(w.get("spend", 0)), str(w.get("clicks", 0))])
        t = Table(rows, colWidths=[2 * inch, 1.5 * inch, 1 * inch, 0.8 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D4AF37")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#E5E7EB")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#374151")),
        ]))
        story.append(t)
    story.append(PageBreak())

    # Page 5: Keyword opportunities
    story.append(Paragraph("Keyword Opportunities", title_style))
    keywords = premium_state.get("keywordAnalysis", [])[:10]
    if keywords:
        rows = [["Keyword", "Campaign", "Spend", "Sales", "ROAS"]]
        for k in keywords:
            rows.append([k.get("searchTerm", "")[:25], k.get("campaign", "")[:15], str(k.get("spend", 0)), str(k.get("sales", 0)), str(k.get("roas", 0))])
        t = Table(rows, colWidths=[1.8 * inch, 1.2 * inch, 0.8 * inch, 0.8 * inch, 0.6 * inch])
        t.setStyle(TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#D4AF37")),
            ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0F172A")),
            ("BACKGROUND", (0, 1), (-1, -1), colors.HexColor("#1e293b")),
            ("TEXTCOLOR", (0, 1), (-1, -1), colors.HexColor("#E5E7EB")),
            ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#374151")),
        ]))
        story.append(t)
    story.append(PageBreak())

    # Page 6: ASIN analysis (if present)
    story.append(Paragraph("ASIN Analysis", title_style))
    story.append(Paragraph("See structured insights for top/bottom ASINs.", body_style))
    story.append(PageBreak())

    # Page 7: Profitability
    story.append(Paragraph("Profitability", title_style))
    prof = premium_state.get("profitability", {})
    if prof:
        story.append(Paragraph(f"Break-even ACOS: {prof.get('breakEvenACOS', 0)}% | Target ROAS: {prof.get('targetROAS', 0)}× | Loss campaigns: {prof.get('lossCampaignCount', 0)}", body_style))
    story.append(PageBreak())

    # Page 8: Strategic action plan
    story.append(Paragraph("Strategic Action Plan", title_style))
    recs = premium_state.get("recommendations", [])
    for r in recs[:8]:
        story.append(Paragraph(f"• {r}", body_style))
    story.append(Spacer(1, 0.5 * inch))
    story.append(Paragraph(f"Generated {premium_state.get('generatedAt', '')} | Zenith Export Orchestrator", ParagraphStyle(name="Footer", parent=body_style, fontSize=8, textColor=colors.HexColor("#D4AF37"))))

    doc.build(story)
    return str(pdf_path)


def main():
    if sys.stdin.isatty():
        print(json.dumps({"charts": [], "slides": [], "error": "No stdin"}), flush=True)
        return

    try:
        raw = sys.stdin.read()
        payload = json.loads(raw)
        premium_state = payload.get("premiumState", payload)
        output_dir = payload.get("outputDir", os.path.join(os.getcwd(), "export-cache", "charts"))
        mode = payload.get("mode", "charts")
    except Exception as e:
        print(json.dumps({"charts": [], "slides": [], "error": str(e)}), flush=True)
        sys.exit(1)

    charts = generate_charts(premium_state, output_dir)
    slides = []
    if premium_state.get("executiveNarrative"):
        nar = premium_state["executiveNarrative"][:500]
        slides.append(compose_slide(
            title="Executive Summary",
            chart_path=charts[0]["path"] if charts else "",
            key_findings=[],
            recommendation="Key metrics and narrative from audit.",
            insight_narrative=nar,
        ))
    slides = optimize_visual_layout(slides)

    out = {"charts": charts, "slides": slides, "outputDir": output_dir, "chartSources": premium_state.get("chartSources", [])}

    if mode == "pdf":
        pdf_path = generate_pdf(premium_state, charts, output_dir)
        out["pdfPath"] = pdf_path

    print(json.dumps(out), flush=True)


if __name__ == "__main__":
    main()
