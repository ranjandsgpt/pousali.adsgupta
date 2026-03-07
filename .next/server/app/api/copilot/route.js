(()=>{var e={};e.id=897,e.ids=[897],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},35816:e=>{"use strict";e.exports=require("process")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},6162:e=>{"use strict";e.exports=require("worker_threads")},71568:e=>{"use strict";e.exports=require("zlib")},72254:e=>{"use strict";e.exports=require("node:buffer")},87561:e=>{"use strict";e.exports=require("node:fs")},88849:e=>{"use strict";e.exports=require("node:http")},22286:e=>{"use strict";e.exports=require("node:https")},87503:e=>{"use strict";e.exports=require("node:net")},49411:e=>{"use strict";e.exports=require("node:path")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},76402:e=>{"use strict";e.exports=require("node:stream/promises")},72477:e=>{"use strict";e.exports=require("node:stream/web")},41041:e=>{"use strict";e.exports=require("node:url")},47261:e=>{"use strict";e.exports=require("node:util")},65628:e=>{"use strict";e.exports=require("node:zlib")},58359:()=>{},93739:()=>{},51783:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>A,requestAsyncStorage:()=>S,routeModule:()=>y,serverHooks:()=>v,staticGenerationAsyncStorage:()=>x});var s={};r.r(s),r.d(s,{POST:()=>b});var a=r(49303),i=r(88716),n=r(60670),o=r(87070),c=r(58954),l=r(17445),u=r(48907);let d=[/\bwhy\b/i,/\bwhat (is|are|does|do)\b/i,/\bexplain\b/i,/\breason\b/i,/\bhow (does|do)\b/i],p=[/\bhow much\b/i,/\bcalculate\b/i,/\bwhat (is|are) (the )?(total|sum|average)\b/i,/\bpercentage\b/i],m=[/\boptimize\b/i,/\bwhich (keywords|campaigns) (should|to)\b/i,/\bshould I (pause|scale)\b/i,/\brecommend\b/i,/\bwaste\b/i,/\bscale\b/i,/\bpause\b/i],h=[/\bwhat happens if\b/i,/\bif we (increase|reduce)\b/i,/\bforecast\b/i],g=[/\brisk\b/i,/\bissue\b/i,/\bworst\b/i,/\bwasting\b/i,/\bperformance\b/i],f=process.env.GEMINI_MODEL||"gemini-2.5-flash";async function b(e){let t,r;let s=process.env.GEMINI_API_KEY;if(!s)return o.NextResponse.json({error:"GEMINI_API_KEY not configured"},{status:503});try{t=await e.json()}catch{return o.NextResponse.json({error:"Invalid JSON"},{status:400})}let{question:a,auditContextInput:i}=t;if(!a||"string"!=typeof a)return o.NextResponse.json({error:"Missing or invalid question"},{status:400});if(!i||"object"!=typeof i)return o.NextResponse.json({error:"Missing or invalid auditContextInput"},{status:400});let n=function(e){let t=(e||"").trim(),r=t.slice(0,500);if(!t)return{intent:"explanation",engine:"gemini",normalizedQuery:t};let s=d.some(e=>e.test(t)),a=p.some(e=>e.test(t)),i=m.some(e=>e.test(t)),n=h.some(e=>e.test(t)),o=g.some(e=>e.test(t));return!a||i||s?n?{intent:"forecast",engine:"slm",normalizedQuery:r}:i||o&&/which|what should/i.test(t)?{intent:"strategy",engine:"gemini+slm",normalizedQuery:r}:o?{intent:"diagnostic",engine:"gemini+slm",normalizedQuery:r}:{intent:"explanation",engine:"gemini",normalizedQuery:r}:{intent:"calculation",engine:"slm",normalizedQuery:r}}(a);if(!((i.metrics?.length??0)>0||i.storeSummary?.metrics!=null))return o.NextResponse.json({answer:"The uploaded reports do not contain this data. Please upload and run an audit first.",validated:!0,confidence:"Low"});let b=function(e){var t,r,s,a,i,n;let o=(t=e.metrics).length?t.map(e=>`${e.label}: ${e.value}`).join("\n"):"No metrics available.",c=(r=e.tables).length?r.map(e=>{let t=e.columns.map(e=>e.label).join(" | "),r=e.rows.slice(0,15).map(t=>e.columns.map(e=>String(t[e.key]??"—")).join(" | "));return`[${e.title}]
${t}
${r.join("\n")}`}).join("\n\n"):"No tables available.",l=(s=e.insights).length?s.map(e=>`[${e.title}] ${e.description}${e.recommendedAction?` Action: ${e.recommendedAction}`:""}`).join("\n"):"No insights available.",u=(a=e.charts).length?a.map(e=>{let t=Array.isArray(e.data)?e.data.slice(0,10).map(e=>`${e.name}: ${e.value}`).join(", "):"";return`[${e.title}] ${t}`}).join("\n"):"No chart data available.",d=function(e){let t=e.metrics,r="EUR"===t.currency?"€":"GBP"===t.currency?"\xa3":"$",s=[`Total Ad Spend: ${r}${t.totalAdSpend.toLocaleString("en-US",{minimumFractionDigits:2})}`,`Total Ad Sales: ${r}${t.totalAdSales.toLocaleString("en-US",{minimumFractionDigits:2})}`,`Total Store Sales: ${r}${t.totalStoreSales.toLocaleString("en-US",{minimumFractionDigits:2})}`,`ROAS: ${t.roas.toFixed(2)}`,`ACOS: ${t.acos.toFixed(1)}%`,`TACOS: ${t.tacos.toFixed(1)}%`,`Sessions: ${t.totalSessions}`,`Clicks: ${t.totalClicks}`,`Orders: ${t.totalOrders}`,`CPC: ${r}${t.cpc.toFixed(2)}`,`Buy Box %: ${t.buyBoxPercent}`];return e.campaigns.length&&(s.push("\nTop campaigns (spend, sales, ACOS):"),e.campaigns.slice(0,20).forEach(e=>{s.push(`  ${e.campaignName}: spend ${e.spend.toFixed(0)}, sales ${e.sales.toFixed(0)}, ACOS ${e.acos.toFixed(0)}%`)})),e.keywords.length&&(s.push("\nTop keywords (spend, sales, clicks, ACOS, ROAS):"),e.keywords.slice(0,25).forEach(e=>{s.push(`  "${e.searchTerm}" (${e.campaign}): spend ${e.spend.toFixed(0)}, sales ${e.sales.toFixed(0)}, ACOS ${e.acos.toFixed(0)}%, ROAS ${e.roas.toFixed(2)}`)})),s.join("\n")}(e.storeSummary),p=[(i=e.patterns).length?i.map(e=>`[${e.problemTitle}] ${e.entityType}: ${e.entityName}. ${e.recommendedAction}${e.metricValues&&Object.keys(e.metricValues).length?` Metrics: ${JSON.stringify(e.metricValues)}`:""}`).join("\n"):"No detected issues.",(n=e.opportunities).length?n.map(e=>`[${e.title}] ${e.entityType}: ${e.entityName}. ${e.recommendedAction}${e.metricValues&&Object.keys(e.metricValues).length?` Metrics: ${JSON.stringify(e.metricValues)}`:""}`).join("\n"):"No opportunities detected."].filter(Boolean).join("\n\n"),m=["--- Metrics ---",o,"--- Account summary (profit/totals) ---",d,"--- Detected issues (patterns) ---",p,"--- Insights ---",l,"--- Tables (sample) ---",c,"--- Charts (data) ---",u].join("\n\n");return{metrics:o,tables:c,insights:l,charts:u,profit:d,trends:p,summary:m}}({metrics:i.metrics??[],tables:i.tables??[],charts:i.charts??[],insights:i.insights??[],storeSummary:i.storeSummary,patterns:i.patterns??[],opportunities:i.opportunities??[]}),y=(0,l.gF)(b.summary,n.normalizedQuery),S=new c.fA({apiKey:s});try{let e=await S.models.generateContent({model:f,config:{systemInstruction:l.Cv},contents:[{role:"user",parts:[{text:y}]}]});r=(0,u.d)(e)}catch(e){return console.error("[copilot] Gemini error:",e),o.NextResponse.json({answer:"AI insights temporarily unavailable — please try again.",validated:!1,error:String(e)})}if(!r)return o.NextResponse.json({answer:"No response from the AI. Please rephrase your question.",validated:!1});let x=function(e,t){let r=[],s=e.match(/(?:campaign\s+)?([A-Za-z0-9\s\-_]+(?:EC|SP|SB|SD)[A-Za-z0-9\s\-_]*)/g);for(let a of(s&&t.campaigns.length>0&&s.forEach(e=>{let s=e.replace(/^campaign\s+/i,"").trim();s.length>3&&!function(e,t){let r=e.trim().toLowerCase();return t.campaigns.some(e=>e.campaignName.trim().toLowerCase().includes(r)||r.includes(e.campaignName.trim().toLowerCase()))}(s,t)&&!t.campaigns.find(e=>e.campaignName.toLowerCase()===s.toLowerCase())&&r.push(`Campaign reference not found in data: "${s.slice(0,40)}"`)}),function(e){let t=[],r=e.match(/(?:ACOS|acos)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)\s*%?/gi);r&&r.forEach(e=>{let r=parseFloat(e.replace(/^.*?(\d+(?:\.\d+)?).*$/i,"$1"));Number.isNaN(r)||t.push({type:"acos",value:r})});let s=e.match(/(?:spend|spent)\s*(?:of|:|=)?\s*[€$£]?\s*(\d+(?:[.,]\d+)*)/gi);s&&s.forEach(e=>{let r=parseFloat(e.replace(/^.*?[€$£]?(\d+(?:[.,]\d+)*).*$/i,"$1").replace(",",""));Number.isNaN(r)||t.push({type:"spend",value:r})});let a=e.match(/(?:sales?)\s*(?:of|:|=)?\s*[€$£]?\s*(\d+(?:[.,]\d+)*)/gi);a&&a.forEach(e=>{let r=parseFloat(e.replace(/^.*?[€$£]?(\d+(?:[.,]\d+)*).*$/i,"$1").replace(",",""));Number.isNaN(r)||t.push({type:"sales",value:r})});let i=e.match(/(?:ROAS|roas)\s*(?:of|:|=)?\s*(\d+(?:\.\d+)?)/gi);return i&&i.forEach(e=>{let r=parseFloat(e.replace(/^.*?(\d+(?:\.\d+)?).*$/i,"$1"));Number.isNaN(r)||t.push({type:"roas",value:r})}),t}(e)))"acos"===a.type&&(a.value<0||a.value>1e3)&&r.push(`ACOS value out of reasonable range: ${a.value}`),"roas"===a.type&&(a.value<0||a.value>100)&&r.push(`ROAS value out of reasonable range: ${a.value}`);let a=0===r.length;return{valid:a,errors:r,fallbackMessage:a?void 0:"The uploaded reports do not contain this data, or the response could not be verified."}}(r,i.storeSummary);return!x.valid&&x.fallbackMessage?o.NextResponse.json({answer:x.fallbackMessage,reason:x.errors.join("; "),validated:!1,confidence:"Low"}):o.NextResponse.json({answer:r,validated:x.valid,suggestedFollowUps:["See the worst campaigns","View wasted keywords","Generate an action plan"]})}let y=new a.AppRouteRouteModule({definition:{kind:i.x.APP_ROUTE,page:"/api/copilot/route",pathname:"/api/copilot",filename:"route",bundlePath:"app/api/copilot/route"},resolvedPagePath:"/Users/ranjan.dasgupta/pousali.adsgupta_project/pousali.adsgupta/src/app/api/copilot/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:S,staticGenerationAsyncStorage:x,serverHooks:v}=y,w="/api/copilot/route";function A(){return(0,n.patchFetch)({serverHooks:v,staticGenerationAsyncStorage:x})}},17445:(e,t,r)=>{"use strict";r.d(t,{Cv:()=>h,HK:()=>u,Ih:()=>n,LR:()=>o,SY:()=>a,Tt:()=>i,Y3:()=>s,gF:()=>g,j5:()=>p,ou:()=>c,rx:()=>l,v:()=>d,yl:()=>m});let s=`You are an Amazon PPC data auditor in verification mode.

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
- correctedMetrics: optional object of metric label to corrected numeric value when you disagree; empty {} when agree.`;function a(e,t,r){let s=`Dataset summary:
${JSON.stringify(e,null,2)}

SLM artifacts:
${JSON.stringify(t,null,2)}`;return r&&r.trim()&&(s+=`

User feedback (consider when verifying):
${r.trim()}

Recalculate and verify the above metrics where user indicated incorrect.`),s+=`

Return ONLY the JSON object. No other text.`}let i=`You are an Amazon PPC data analyst writing an executive audit narrative.

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

Rules: plain text only; paragraphs and bullet points; no JSON; no code blocks; no markdown tables; no backticks.`,n=`Analyze the attached raw Amazon PPC report files first. Then use the normalized summary below for reference.

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
- No comments that are not valid Python. No prose. No JSON.`,c=`Generate a single Python script that loads the attached report files, computes metrics, builds charts, and creates a PowerPoint plus CSV action plan.

Attached files: `,l=`You are an Amazon PPC data analyst. You are given raw Amazon advertising and business report files (CSV or similar).

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
`,d=`The attached files are Amazon PPC reports. Use them for metric extraction, column inference, and validation.

Optional normalized summary (for reference; prefer extracting from raw files when possible):
`,p=`You are an Amazon Seller Central and Amazon Advertising report schema expert.
For each header, infer the most likely canonical Amazon metric.
Return ONLY valid JSON: {"mappings": [{"rawHeader": "...", "inferred_metric": "canonical", "confidence_score": number}]}`;function m(e){return`Infer the canonical Amazon metric for each of these report column headers:

${e.map(e=>`- "${e}"`).join("\n")}

Return ONLY the JSON object with mappings.`}let h='You are an Amazon Advertising Audit Analyst. You answer questions about an Amazon advertising account using ONLY the audit data provided. Never invent numbers, campaigns, or keywords. If information is missing, say: "The uploaded reports do not contain this data." Structure: Answer, Reason, Recommended Action, Confidence.';function g(e,t){return`Audit Context (use only this data):

${e}

---

User Question: ${t}

Provide a clear answer using only the audit context. Structure: Answer, Reason, Recommended Action, Confidence.`}},48907:(e,t,r)=>{"use strict";function s(e){if("string"==typeof e.text&&e.text.trim().length>0)return e.text.trim();let t=e.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("").trim();return t&&t.length>0?t:""}r.d(t,{d:()=>s})}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,972,954],()=>r(51783));module.exports=s})();