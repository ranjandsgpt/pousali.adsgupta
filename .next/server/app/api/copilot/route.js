(()=>{var e={};e.id=897,e.ids=[897],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},35816:e=>{"use strict";e.exports=require("process")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},6162:e=>{"use strict";e.exports=require("worker_threads")},71568:e=>{"use strict";e.exports=require("zlib")},72254:e=>{"use strict";e.exports=require("node:buffer")},87561:e=>{"use strict";e.exports=require("node:fs")},88849:e=>{"use strict";e.exports=require("node:http")},22286:e=>{"use strict";e.exports=require("node:https")},87503:e=>{"use strict";e.exports=require("node:net")},49411:e=>{"use strict";e.exports=require("node:path")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},76402:e=>{"use strict";e.exports=require("node:stream/promises")},72477:e=>{"use strict";e.exports=require("node:stream/web")},41041:e=>{"use strict";e.exports=require("node:url")},47261:e=>{"use strict";e.exports=require("node:util")},65628:e=>{"use strict";e.exports=require("node:zlib")},58359:()=>{},93739:()=>{},70080:(e,t,s)=>{"use strict";s.r(t),s.d(t,{originalPathname:()=>N,patchFetch:()=>C,requestAsyncStorage:()=>x,routeModule:()=>v,serverHooks:()=>A,staticGenerationAsyncStorage:()=>$});var r={};s.r(r),s.d(r,{POST:()=>w});var a=s(49303),n=s(88716),i=s(60670),o=s(87070),l=s(58954),c=s(17445),u=s(48907);let d=[/\bwhy\b/i,/\bwhat (is|are|does|do)\b/i,/\bexplain\b/i,/\breason\b/i,/\bhow (does|do)\b/i],p=[/\bhow much\b/i,/\bcalculate\b/i,/\bwhat (is|are) (the )?(total|sum|average)\b/i,/\bpercentage\b/i],m=[/\boptimize\b/i,/\bwhich (keywords|campaigns) (should|to)\b/i,/\bshould I (pause|scale)\b/i,/\brecommend\b/i,/\bwaste\b/i,/\bscale\b/i,/\bpause\b/i],g=[/\bwhat happens if\b/i,/\bif we (increase|reduce)\b/i,/\bforecast\b/i],h=[/\brisk\b/i,/\bissue\b/i,/\bworst\b/i,/\bwasting\b/i,/\bperformance\b/i];var f=s(20593),y=s(59190);let b=process.env.GEMINI_MODEL||"gemini-2.5-flash",S=e=>"EUR"===e?"€":"GBP"===e?"\xa3":"$";async function w(e){let t,r;let a=process.env.GEMINI_API_KEY;if(!a)return o.NextResponse.json({error:"GEMINI_API_KEY not configured"},{status:503});try{t=await e.json()}catch{return o.NextResponse.json({error:"Invalid JSON"},{status:400})}let{question:n,auditContextInput:i}=t;if(!n||"string"!=typeof n)return o.NextResponse.json({error:"Missing or invalid question"},{status:400});if(!i||"object"!=typeof i)return o.NextResponse.json({error:"Missing or invalid auditContextInput"},{status:400});let w=function(e){let t=(e||"").trim(),s=t.slice(0,500);if(!t)return{intent:"explanation",engine:"gemini",normalizedQuery:t};let r=d.some(e=>e.test(t)),a=p.some(e=>e.test(t)),n=m.some(e=>e.test(t)),i=g.some(e=>e.test(t)),o=h.some(e=>e.test(t));return!a||n||r?i?{intent:"forecast",engine:"slm",normalizedQuery:s}:n||o&&/which|what should/i.test(t)?{intent:"strategy",engine:"gemini+slm",normalizedQuery:s}:o?{intent:"diagnostic",engine:"gemini+slm",normalizedQuery:s}:{intent:"explanation",engine:"gemini",normalizedQuery:s}:{intent:"calculation",engine:"slm",normalizedQuery:s}}(n);if(!((i.metrics?.length??0)>0||i.storeSummary?.metrics!=null))return o.NextResponse.json({answer:"The uploaded reports do not contain this data. Please upload and run an audit first.",validated:!0,confidence:"Low"});let v=i.storeSummary;if("slm"===w.engine){let e=function(e,t){let s=e.toLowerCase().trim(),r=t.metrics,a=S(r.currency);return/\b(total )?ad spend|total spend|spend\b/.test(s)&&!/\bsales\b/.test(s)?`Total ad spend: ${a}${r.totalAdSpend.toLocaleString("en-US",{minimumFractionDigits:2})}.`:/\b(total )?ad sales|total sales|sales\b/.test(s)&&!/\bspend\b/.test(s)?`Total ad sales: ${a}${r.totalAdSales.toLocaleString("en-US",{minimumFractionDigits:2})}.`:/\b(total )?store sales\b/.test(s)?`Total store sales: ${a}${r.totalStoreSales.toLocaleString("en-US",{minimumFractionDigits:2})}.`:/\broas\b/.test(s)?`ROAS (return on ad spend): ${r.roas.toFixed(2)}\xd7.`:/\bacos\b/.test(s)?`ACOS (ad cost of sales): ${r.acos.toFixed(1)}%.`:/\btacos\b/.test(s)?`TACOS: ${r.tacos.toFixed(1)}%.`:/\bcpc\b|cost per click/.test(s)?`CPC: ${a}${r.cpc.toFixed(2)}.`:/\bconversions?|orders\b/.test(s)?`Orders (conversions): ${r.totalOrders.toLocaleString()}.`:/\bclicks\b/.test(s)?`Total clicks: ${r.totalClicks.toLocaleString()}.`:/\bsessions\b/.test(s)?`Sessions: ${r.totalSessions.toLocaleString()}.`:null}(w.normalizedQuery,v);if(e)return o.NextResponse.json({answer:e,validated:!0,suggestedFollowUps:["Why is ACOS high?","Which campaigns should I pause?","View wasted keywords"]})}let x=function(e){var t,s,r,a,n,i,o;let l=(t=e.metrics).length?t.map(e=>`${e.label}: ${e.value}`).join("\n"):"No metrics available.",c=(s=e.tables).length?s.map(e=>{let t=e.columns.map(e=>e.label).join(" | "),s=e.rows.slice(0,15).map(t=>e.columns.map(e=>String(t[e.key]??"—")).join(" | "));return`[${e.title}]
${t}
${s.join("\n")}`}).join("\n\n"):"No tables available.",u=(r=e.insights).length?r.map(e=>`[${e.title}] ${e.description}${e.recommendedAction?` Action: ${e.recommendedAction}`:""}`).join("\n"):"No insights available.",d=(a=e.charts).length?a.map(e=>{let t=Array.isArray(e.data)?e.data.slice(0,10).map(e=>`${e.name}: ${e.value}`).join(", "):"";return`[${e.title}] ${t}`}).join("\n"):"No chart data available.",p=function(e){let t=e.metrics,s="EUR"===t.currency?"€":"GBP"===t.currency?"\xa3":"$",r=[`Total Ad Spend: ${s}${t.totalAdSpend.toLocaleString("en-US",{minimumFractionDigits:2})}`,`Total Ad Sales: ${s}${t.totalAdSales.toLocaleString("en-US",{minimumFractionDigits:2})}`,`Total Store Sales: ${s}${t.totalStoreSales.toLocaleString("en-US",{minimumFractionDigits:2})}`,`ROAS: ${t.roas.toFixed(2)}`,`ACOS: ${t.acos.toFixed(1)}%`,`TACOS: ${t.tacos.toFixed(1)}%`,`Sessions: ${t.totalSessions}`,`Clicks: ${t.totalClicks}`,`Orders: ${t.totalOrders}`,`CPC: ${s}${t.cpc.toFixed(2)}`,`Buy Box %: ${t.buyBoxPercent}`];return e.campaigns.length&&(r.push("\nTop campaigns (spend, sales, ACOS):"),e.campaigns.slice(0,20).forEach(e=>{r.push(`  ${e.campaignName}: spend ${e.spend.toFixed(0)}, sales ${e.sales.toFixed(0)}, ACOS ${e.acos.toFixed(0)}%`)})),e.keywords.length&&(r.push("\nTop keywords (spend, sales, clicks, ACOS, ROAS):"),e.keywords.slice(0,25).forEach(e=>{r.push(`  "${e.searchTerm}" (${e.campaign}): spend ${e.spend.toFixed(0)}, sales ${e.sales.toFixed(0)}, ACOS ${e.acos.toFixed(0)}%, ROAS ${e.roas.toFixed(2)}`)})),r.join("\n")}(e.storeSummary),m=[(n=e.patterns).length?n.map(e=>`[${e.problemTitle}] ${e.entityType}: ${e.entityName}. ${e.recommendedAction}${e.metricValues&&Object.keys(e.metricValues).length?` Metrics: ${JSON.stringify(e.metricValues)}`:""}`).join("\n"):"No detected issues.",(i=e.opportunities).length?i.map(e=>`[${e.title}] ${e.entityType}: ${e.entityName}. ${e.recommendedAction}${e.metricValues&&Object.keys(e.metricValues).length?` Metrics: ${JSON.stringify(e.metricValues)}`:""}`).join("\n"):"No opportunities detected."].filter(Boolean).join("\n\n"),g=function(e){if(!e)return"No agent signals available.";let t=[];return e.wasteSignals&&t.push(`Waste (deterministic): ${e.wasteSignals.summary}`),e.scalingSignals&&t.push(`Scaling (deterministic): ${e.scalingSignals.summary}`),e.profitSignals&&t.push(`Profit (deterministic): ${e.profitSignals.summary}`),e.trendSignals&&t.push(`Trend: ${e.trendSignals.summary}`),e.anomalySignals&&t.push(`Anomalies: ${e.anomalySignals.summary}`),t.length>0?t.join("\n"):"No agent signals available."}(e.agentSignals),h=(o=e.verifiedInsights,o?.length?o.map(e=>`[${e.sourceEngine}] (score ${Math.round(100*e.verificationScore)}%) ${e.insight}`).join("\n"):"No verified insights."),f=function(e){if(!e)return"No chart signals.";let t=[];return e.keywordScatter&&t.push(`Keyword scatter: ${e.keywordScatter}`),e.campaignROASDistribution&&t.push(`Campaign ROAS: ${e.campaignROASDistribution}`),e.salesBreakdown&&t.push(`Sales breakdown: ${e.salesBreakdown}`),e.funnelSignals&&t.push(`Funnel: ${e.funnelSignals}`),t.length>0?t.join("\n"):"No chart signals."}(e.chartSignals),y=e.conversationMemory?function(e){if(0===e.turns.length)return"";let t=["--- Conversation context ---"];return e.turns.slice(-5).forEach((e,s)=>{t.push(`Q: ${e.question.slice(0,150)}`),t.push(`A: ${e.response.slice(0,200)}...`)}),e.referencedCampaigns.length>0&&t.push(`Recently referenced campaigns: ${e.referencedCampaigns.slice(-10).join(", ")}`),e.referencedKeywords.length>0&&t.push(`Recently referenced keywords: ${e.referencedKeywords.slice(-10).join(", ")}`),t.join("\n")}(e.conversationMemory):"",b=["--- Metrics ---",l,"--- Account summary (profit/totals) ---",p,"--- Agent signals (deterministic) ---",g,"--- Detected issues (patterns) ---",m,"--- Verified insights ---",h,"--- Insights ---",u,"--- Chart signals ---",f,"--- Tables (sample) ---",c,"--- Charts (data) ---",d];return y&&b.push("--- Conversation context ---",y),{metrics:l,tables:c,insights:u,charts:d,profit:p,trends:m,agentSignals:g,verifiedInsights:h,chartSignals:f,conversationMemory:y,summary:b.join("\n\n")}}({metrics:i.metrics??[],tables:i.tables??[],charts:i.charts??[],insights:i.insights??[],storeSummary:v,patterns:i.patterns??[],opportunities:i.opportunities??[],agentSignals:i.agentSignals,verifiedInsights:i.verifiedInsights,chartSignals:i.chartSignals,conversationMemory:i.conversationMemory}),$="";try{let{getFeedbackContextForEngines:e}=await s.e(279).then(s.bind(s,75279));$=e();let{runCentralFeedbackAgent:t}=await s.e(476).then(s.bind(s,60476)),r=t();r.promptContextSnippet&&($=$?`${$}

${r.promptContextSnippet}`:r.promptContextSnippet)}catch{}let A=(0,c.gF)(x.summary,w.normalizedQuery,$),N=[{role:"user",parts:[{text:A}]}];(0,f.g)(N);let C=new l.fA({apiKey:a}),O=Date.now();try{let e=await C.models.generateContent({model:b,config:{systemInstruction:c.Cv},contents:N});r=(0,u.d)(e),await (0,y.f)({mode:"copilot",promptLength:A.length,contextSize:x.summary.length,responseLatencyMs:Date.now()-O,validationResult:r?"ok":"empty"})}catch(e){return console.error("[copilot] Gemini error:",e),await (0,y.f)({mode:"copilot",promptLength:A.length,contextSize:x.summary.length,responseLatencyMs:Date.now()-O,validationResult:"error",error:e instanceof Error?e.message:String(e)}),o.NextResponse.json({answer:"AI insights temporarily unavailable — please try again.",validated:!1,error:String(e)})}if(!r)return o.NextResponse.json({answer:"No response from the AI. Please rephrase your question.",validated:!1});let R=function(e,t){let s=[],r=e.match(/(?:campaign\s+)?([A-Za-z0-9\s\-_]+(?:EC|SP|SB|SD)[A-Za-z0-9\s\-_]*)/g);for(let a of(r&&t.campaigns.length>0&&r.forEach(e=>{let r=e.replace(/^campaign\s+/i,"").trim();r.length>3&&!function(e,t){let s=e.trim().toLowerCase();return t.campaigns.some(e=>e.campaignName.trim().toLowerCase().includes(s)||s.includes(e.campaignName.trim().toLowerCase()))}(r,t)&&!t.campaigns.find(e=>e.campaignName.toLowerCase()===r.toLowerCase())&&s.push(`Campaign reference not found in data: "${r.slice(0,40)}"`)}),function(e){let t=[],s=e.match(/(?:ACOS|acos)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*%?/gi);s&&s.forEach(e=>{let s=parseFloat(e.replace(/^.*?(\d+(?:\.\d+)?).*$/i,"$1"));Number.isNaN(s)||t.push({type:"acos",value:s})});let r=e.match(/(?:spend|spent)\s*(?:of|:|=)?\s*[€$£]?\s*(\d+(?:[.,]\d+)*)/gi);r&&r.forEach(e=>{let s=parseFloat(e.replace(/^.*?[€$£]?(\d+(?:[.,]\d+)*).*$/i,"$1").replace(",",""));Number.isNaN(s)||t.push({type:"spend",value:s})});let a=e.match(/(?:sales?)\s*(?:of|:|=)?\s*[€$£]?\s*(\d+(?:[.,]\d+)*)/gi);a&&a.forEach(e=>{let s=parseFloat(e.replace(/^.*?[€$£]?(\d+(?:[.,]\d+)*).*$/i,"$1").replace(",",""));Number.isNaN(s)||t.push({type:"sales",value:s})});let n=e.match(/(?:ROAS|roas)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)/gi);return n&&n.forEach(e=>{let s=parseFloat(e.replace(/^.*?(\d+(?:\.\d+)?).*$/i,"$1"));Number.isNaN(s)||t.push({type:"roas",value:s})}),t}(e)))"acos"===a.type&&(a.value<0||a.value>1e3)&&s.push(`ACOS value out of reasonable range: ${a.value}`),"roas"===a.type&&(a.value<0||a.value>100)&&s.push(`ROAS value out of reasonable range: ${a.value}`);let a=0===s.length;return{valid:a,errors:s,fallbackMessage:a?void 0:"The uploaded reports do not contain this data, or the response could not be verified."}}(r,i.storeSummary);return!R.valid&&R.fallbackMessage?o.NextResponse.json({answer:R.fallbackMessage,reason:R.errors.join("; "),validated:!1,confidence:"Low"}):o.NextResponse.json({answer:r,validated:R.valid,suggestedFollowUps:["See the worst campaigns","View wasted keywords","Generate an action plan"]})}let v=new a.AppRouteRouteModule({definition:{kind:n.x.APP_ROUTE,page:"/api/copilot/route",pathname:"/api/copilot",filename:"route",bundlePath:"app/api/copilot/route"},resolvedPagePath:"/Users/ranjan.dasgupta/pousali.adsgupta_project/pousali.adsgupta/src/app/api/copilot/route.ts",nextConfigOutput:"",userland:r}),{requestAsyncStorage:x,staticGenerationAsyncStorage:$,serverHooks:A}=v,N="/api/copilot/route";function C(){return(0,i.patchFetch)({serverHooks:A,staticGenerationAsyncStorage:$})}},17445:(e,t,s)=>{"use strict";s.d(t,{Cv:()=>m,HK:()=>u,Ih:()=>i,LR:()=>o,SY:()=>a,Tt:()=>n,Y3:()=>r,gF:()=>g,j5:()=>d,ou:()=>l,rx:()=>c,yl:()=>p});let r=`You are an Amazon PPC data auditor in verification mode.

You are given:
1) A normalized dataset summary.
2) SLM-generated metrics, tables, charts, and insights.

Your task: validate SLM outputs for consistency and correctness.
- Metrics: do numbers align with the dataset? (ACOS = spend/sales, ROAS = sales/spend, etc.)
- Tables: do row counts and values match the data?
- Charts: do chart data series match the tables they reference?
- Insights: are the insights supported by the data?

You MUST return ONLY a single JSON object. No markdown, no code blocks, no explanation, no narrative.
Output format exactly:
{"verification_result": "agree" | "disagree", "confidence_score": number between 0 and 1, "disagreements": string[], "correctedMetrics": object}

- verification_result: "agree" if SLM outputs are consistent with the data; "disagree" if you found material errors.
- confidence_score: 0–1 (1 = fully valid).
- disagreements: list of short descriptions of any discrepancies (e.g. "ACOS mismatch: SLM 24.5%, expected 23.1%").
- correctedMetrics: optional object of metric label to corrected numeric value when you disagree; empty {} when agree.`;function a(e,t,s){let r=`Dataset summary:
${JSON.stringify(e,null,2)}

SLM artifacts:
${JSON.stringify(t,null,2)}`;return s&&s.trim()&&(r+=`

User feedback (consider when verifying):
${s.trim()}

Recalculate and verify the above metrics where user indicated incorrect.`),r+=`

Return ONLY the JSON object. No other text.`}let n=`You are an Amazon PPC data analyst writing an executive audit narrative.

Execution mode: INSIGHT NARRATIVE. You must return PLAIN HUMAN TEXT only. Not JSON. Not code. Not markdown.

You will receive:
1) RAW uploaded report files (CSV/XLSX) — you MUST analyze these first. Do not rely only on aggregated metrics.
2) A normalized dataset summary (for reference; use raw reports as the source of truth where possible).
3) SLM summary metrics (for cross-check).

Metric integrity rule: You must NEVER invent metrics. Every number must come from:
- The uploaded reports
- Derived calculations using standard formulas (ACOS = Spend/Sales, ROAS = Sales/Spend, CTR = Clicks/Impressions, CVR = Orders/Clicks, CPC = Spend/Clicks)
- Validated formulas only

If a metric is missing or cannot be computed from the provided data, you must say exactly: "Metric unavailable in provided dataset"

Structure your response exactly as follows. Use plain paragraphs and bullet points only.

Executive Summary
[2–4 sentences on overall account performance, revenue, ROAS, key takeaway.]

Key Risks
• [Bullet 1: specific risk with numbers from the data]
• [Bullet 2]
• [As many as relevant]

Growth Opportunities
• [Bullet 1: specific opportunity with numbers from the data]
• [Bullet 2]
• [As many as relevant]

Strategic Recommendations
• [Bullet 1: actionable recommendation]
• [Bullet 2]
• [3–5 bullets]

Rules: plain text only; paragraphs and bullet points; no JSON; no code blocks; no markdown tables; no backticks.`,i=`Analyze the attached raw Amazon PPC report files first. Then use the normalized summary below for reference.

Raw files (attached): analyze these first for metrics, sessions, buy box, and any fields the aggregator may have missed.

Normalized dataset summary (for reference):
`,o=`You are a Python script generator for Amazon PPC report analysis.

Execution mode: PRESENTATION GENERATION. You must return ONLY executable Python code. No explanation. No JSON. No markdown. No markdown code fences.

You will receive raw uploaded report files (CSV/XLSX) and optionally a normalized summary.

Your script must:
1) Load the uploaded reports using pandas (read_csv for CSV, read_excel for XLSX).
2) Clean currency formatting (remove € $ , and convert to float).
3) Compute key metrics: Total Ad Spend, Total Ad Sales, ROAS, ACOS, TACOS, Wasted Spend, etc. using standard formulas.
4) Generate charts using matplotlib or seaborn (e.g. ROAS trend, ACOS by campaign, spend by keyword).
5) Build a PowerPoint using python-pptx with slides: title, KPI summary, bar/pie charts, tables, action plan bullets.
6) Export an action plan CSV (e.g. keyword, action, reason).

Allowed libraries only: pandas, matplotlib, seaborn, python-pptx.

Output requirements:
- Return ONLY the Python script as plain text.
- Script must be self-contained and assume input files are in the current working directory or paths provided.
- Script must write Amazon_Insights.pptx and Action_Plan.csv (or similar names).
- No comments that are not valid Python. No prose. No JSON.`,l=`Generate a single Python script that loads the attached report files, computes metrics, builds charts, and creates a PowerPoint plus CSV action plan.

Attached files: `,c=`You are an Amazon PPC data analyst. You are given raw Amazon advertising and business report files (CSV or similar).

Tasks:
1) Extract key metrics from the files: total ad spend, total ad sales, ACOS, ROAS, TACOS, sessions, buy_box_percentage, units_ordered, page_views, conversion_rate (CVR = orders/clicks), contribution_margin ((adSales - adSpend)/adSales), wasted_spend, lost_revenue_estimate if inferable.
2) Infer column meanings where headers vary.
3) Validate data consistency across reports.
4) For any metric missing in the normalized summary but present in the raw files, set recovered_fields with your best estimate.
5) Build 2-4 summary tables, 2-3 chart specs, 3-8 insights.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "metrics": [{label, value, numericValue}],
  "tables": [...],
  "charts": [...],
  "insights": [...],
  "recovered_fields": {},
  "schema_inferences": {}
}`,u=`Analyze this normalized dataset and return structured JSON only.

Dataset:
`,d=`You are an Amazon Seller Central and Amazon Advertising report schema expert.
For each header, infer the most likely canonical Amazon metric.
Return ONLY valid JSON: {"mappings": [{"rawHeader": "...", "inferred_metric": "canonical", "confidence_score": number}]}`;function p(e){return`Infer the canonical Amazon metric for each of these report column headers:

${e.map(e=>`- "${e}"`).join("\n")}

Return ONLY the JSON object with mappings.`}let m='You are an Amazon Advertising Audit Analyst. You answer questions about an Amazon advertising account using ONLY the audit data provided. Never invent numbers, campaigns, or keywords. If information is missing, say: "The uploaded reports do not contain this data." Structure: Answer, Reason, Recommended Action, Confidence.';function g(e,t,s){let r=`Audit Context (use only this data):

${e}

---

User Question: ${t}`;return s&&s.trim()&&(r+=`

--- Feedback (re-evaluate if relevant) ---
${s.trim()}`),r+=`

Provide a clear answer using only the audit context. Structure: Answer, Reason, Recommended Action, Confidence.`}},20593:(e,t,s)=>{"use strict";s.d(t,{g:()=>n});class r extends Error{constructor(e){super(e),this.name="GeminiFileReferenceError"}}let a=["fileUri","files/","fileData","inlineData","fileReference"];function n(e){let t="string"==typeof e?e:JSON.stringify(e??"");for(let e of a)if(t.includes(e))throw new r("Raw files must not be sent to Gemini. Request must use only structured audit context (text).")}},59190:(e,t,s)=>{"use strict";s.d(t,{f:()=>i});var r=s(20629),a=s(55315),n=s.n(a);async function i(e){let t=new Date().toISOString(),s={...e,timestamp:t},a=function(){let e="undefined"!=typeof process&&process.cwd?process.cwd():".";return n().join(e,"logs/gemini-requests")}();try{await (0,r.mkdir)(a,{recursive:!0});let i=t.replace(/[:.]/g,"-").slice(0,19),o=n().join(a,`request-${e.mode}-${i}.json`);await (0,r.writeFile)(o,JSON.stringify(s,null,2),"utf-8")}catch(e){console.error("[geminiRequestLogger]",e)}}},48907:(e,t,s)=>{"use strict";function r(e){if("string"==typeof e.text&&e.text.trim().length>0)return e.text.trim();let t=e.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("").trim();return t&&t.length>0?t:""}s.d(t,{d:()=>r})}};var t=require("../../../webpack-runtime.js");t.C(e);var s=e=>t(t.s=e),r=t.X(0,[276,972,954],()=>s(70080));module.exports=r})();