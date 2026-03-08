(()=>{var e={};e.id=131,e.ids=[131],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},35816:e=>{"use strict";e.exports=require("process")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},6162:e=>{"use strict";e.exports=require("worker_threads")},71568:e=>{"use strict";e.exports=require("zlib")},72254:e=>{"use strict";e.exports=require("node:buffer")},87561:e=>{"use strict";e.exports=require("node:fs")},88849:e=>{"use strict";e.exports=require("node:http")},22286:e=>{"use strict";e.exports=require("node:https")},87503:e=>{"use strict";e.exports=require("node:net")},49411:e=>{"use strict";e.exports=require("node:path")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},76402:e=>{"use strict";e.exports=require("node:stream/promises")},72477:e=>{"use strict";e.exports=require("node:stream/web")},41041:e=>{"use strict";e.exports=require("node:url")},47261:e=>{"use strict";e.exports=require("node:util")},65628:e=>{"use strict";e.exports=require("node:zlib")},58359:()=>{},93739:()=>{},2240:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>b,patchFetch:()=>A,requestAsyncStorage:()=>x,routeModule:()=>v,serverHooks:()=>S,staticGenerationAsyncStorage:()=>w});var s={};r.r(s),r.d(s,{POST:()=>y});var n=r(49303),a=r(88716),i=r(60670),o=r(87070),u=r(58954),c=r(17445),l=r(9907),d=r(48907),p=r(20593),m=r(59190);let f="AI analysis temporarily unavailable. Please rerun analysis.",h=process.env.GEMINI_MODEL||"gemini-2.5-flash";async function g(e,t,r){let s=[{role:"user",parts:[{text:r}]}];(0,p.g)(s);let n=await e.models.generateContent({model:h,config:{systemInstruction:t},contents:s});return(0,d.d)(n)}async function y(e){let t,r,s;let n=process.env.GEMINI_API_KEY;if(!n)return o.NextResponse.json({error:"GEMINI_API_KEY is not configured",report:f},{status:503});try{t=await e.json()}catch{return o.NextResponse.json({error:"Invalid JSON body",report:f},{status:400})}let a=JSON.stringify({accountSummary:t.accountSummary,campaigns:t.campaigns,searchTerms:t.searchTerms,asins:t.asins,patterns:t.patterns,sanity:t.sanity},null,2),i=`${c.Ih}

Use the following verified audit data (structured context only).

${a}`,d="string"==typeof t.metricsReferenceContext?t.metricsReferenceContext:"",p=d?`${c.Tt}

${d}`:c.Tt,h=new u.fA({apiKey:n}),y="",v=null,x=i.length,w=Date.now();for(let e=0;e<=1;e++)try{y=await g(h,p,i);let t=Date.now()-w;if(await (0,l.g)({mode:"insight_narrative",rawResponse:y.slice(0,1e4),outcome:y?"plain_text":"empty",...e>0?{error:`retry ${e}`}:{}}),await (0,m.f)({mode:"insight_narrative",promptLength:i.length,contextSize:x,responseLatencyMs:t,validationResult:y?"ok":"empty"}),!y){r="gemini_empty",s="Gemini returned no text. Check model name and API quota.";break}let n=function(e){let t=e.trim();if(!t)return{valid:!1,narrative:null,shouldRetry:!0,reason:"empty"};if(function(e){let t=e.trim();return!!(t.includes("```")||/^\s*(import |from |def |class )/m.test(t))}(t))return{valid:!1,narrative:null,shouldRetry:!0,reason:"response_was_code"};if(function(e){let t=e.trim();return t.startsWith("{")||t.startsWith("[")}(t)){let e=function(e){let t=e.indexOf("{");if(-1===t)return null;let r=0;for(let s=t;s<e.length;s++)if("{"===e[s]&&r++,"}"===e[s]&&0==--r)try{return JSON.parse(e.slice(t,s+1))}catch{break}return null}(t);if(e&&"object"==typeof e){let t="string"==typeof e.narrative?e.narrative:"string"==typeof e.report?e.report:"string"==typeof e.text?e.text:"string"==typeof e.content?e.content:null;if(t&&t.length>50)return{valid:!0,narrative:t,shouldRetry:!1}}return t.length>200?{valid:!0,narrative:t,shouldRetry:!1,reason:"response_was_json_used_raw"}:{valid:!1,narrative:null,shouldRetry:!0,reason:"response_was_json_no_narrative_field"}}return{valid:!0,narrative:t,shouldRetry:!1}}(y);if(n.valid&&n.narrative){v=n.narrative;break}if(n.shouldRetry&&e<1)continue;if(n.narrative){v=n.narrative;break}r="validation_failed",s=n.reason??"Response format was not accepted.";break}catch(t){let e=t instanceof Error?t.message:String(t);console.error("generate-insights error",t),await (0,l.g)({mode:"insight_narrative",rawResponse:y||"(no response)",outcome:"error",error:e}),await (0,m.f)({mode:"insight_narrative",promptLength:i.length,contextSize:x,responseLatencyMs:Date.now()-w,validationResult:"error",error:e.slice(0,200)}),r="gemini_error",s=e.slice(0,200);break}let S={report:v&&v.length>0?v:f};return r&&(S.errorCode=r),s&&(S.errorDetail=s),o.NextResponse.json(S,{status:200})}let v=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/generate-insights/route",pathname:"/api/generate-insights",filename:"route",bundlePath:"app/api/generate-insights/route"},resolvedPagePath:"/Users/ranjan.dasgupta/pousali.adsgupta_project/pousali.adsgupta/src/app/api/generate-insights/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:x,staticGenerationAsyncStorage:w,serverHooks:S}=v,b="/api/generate-insights/route";function A(){return(0,i.patchFetch)({serverHooks:S,staticGenerationAsyncStorage:w})}},17445:(e,t,r)=>{"use strict";r.d(t,{Cv:()=>m,HK:()=>l,Ih:()=>i,LR:()=>o,SY:()=>n,Tt:()=>a,Y3:()=>s,gF:()=>f,j5:()=>d,ou:()=>u,rx:()=>c,yl:()=>p});let s=`You are an Amazon PPC data auditor in verification mode.

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
- correctedMetrics: optional object of metric label to corrected numeric value when you disagree; empty {} when agree.`;function n(e,t,r){let s=`Dataset summary:
${JSON.stringify(e,null,2)}

SLM artifacts:
${JSON.stringify(t,null,2)}`;return r&&r.trim()&&(s+=`

User feedback (consider when verifying):
${r.trim()}

Recalculate and verify the above metrics where user indicated incorrect.`),s+=`

Return ONLY the JSON object. No other text.`}let a=`You are an Amazon PPC data analyst writing an executive audit narrative.

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
- No comments that are not valid Python. No prose. No JSON.`,u=`Generate a single Python script that loads the attached report files, computes metrics, builds charts, and creates a PowerPoint plus CSV action plan.

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
}`,l=`Analyze this normalized dataset and return structured JSON only.

Dataset:
`,d=`You are an Amazon Seller Central and Amazon Advertising report schema expert.
For each header, infer the most likely canonical Amazon metric.
Return ONLY valid JSON: {"mappings": [{"rawHeader": "...", "inferred_metric": "canonical", "confidence_score": number}]}`;function p(e){return`Infer the canonical Amazon metric for each of these report column headers:

${e.map(e=>`- "${e}"`).join("\n")}

Return ONLY the JSON object with mappings.`}let m='You are an Amazon Advertising Audit Analyst. You answer questions about an Amazon advertising account using ONLY the audit data provided. Never invent numbers, campaigns, or keywords. If information is missing, say: "The uploaded reports do not contain this data." Structure: Answer, Reason, Recommended Action, Confidence.';function f(e,t,r){let s=`Audit Context (use only this data):

${e}

---

User Question: ${t}`;return r&&r.trim()&&(s+=`

--- Feedback (re-evaluate if relevant) ---
${r.trim()}`),s+=`

Provide a clear answer using only the audit context. Structure: Answer, Reason, Recommended Action, Confidence.`}},20593:(e,t,r)=>{"use strict";r.d(t,{g:()=>a});class s extends Error{constructor(e){super(e),this.name="GeminiFileReferenceError"}}let n=["fileUri","files/","fileData","inlineData","fileReference"];function a(e){let t="string"==typeof e?e:JSON.stringify(e??"");for(let e of n)if(t.includes(e))throw new s("Raw files must not be sent to Gemini. Request must use only structured audit context (text).")}},59190:(e,t,r)=>{"use strict";r.d(t,{f:()=>i});var s=r(20629),n=r(55315),a=r.n(n);async function i(e){let t=new Date().toISOString(),r={...e,timestamp:t},n=function(){let e="undefined"!=typeof process&&process.cwd?process.cwd():".";return a().join(e,"logs/gemini-requests")}();try{await (0,s.mkdir)(n,{recursive:!0});let i=t.replace(/[:.]/g,"-").slice(0,19),o=a().join(n,`request-${e.mode}-${i}.json`);await (0,s.writeFile)(o,JSON.stringify(r,null,2),"utf-8")}catch(e){console.error("[geminiRequestLogger]",e)}}},48907:(e,t,r)=>{"use strict";function s(e){if("string"==typeof e.text&&e.text.trim().length>0)return e.text.trim();let t=e.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("").trim();return t&&t.length>0?t:""}r.d(t,{d:()=>s})},9907:(e,t,r)=>{"use strict";r.d(t,{g:()=>i});var s=r(20629),n=r(55315),a=r.n(n);async function i(e){let t=new Date().toISOString().replace(/[:.]/g,"-"),r={...e,timestamp:t},n=function(){let e="undefined"!=typeof process&&process.cwd?process.cwd():".";return a().join(e,"logs/gemini-responses")}();try{await (0,s.mkdir)(n,{recursive:!0});let i=a().join(n,`gemini-${e.mode}-${t.slice(0,19)}.json`);await (0,s.writeFile)(i,JSON.stringify(r,null,2),"utf-8")}catch(e){console.error("[geminiResponseLogger]",e)}}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,972,954],()=>r(2240));module.exports=s})();