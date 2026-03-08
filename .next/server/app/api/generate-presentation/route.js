(()=>{var e={};e.id=569,e.ids=[569],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},35816:e=>{"use strict";e.exports=require("process")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},6162:e=>{"use strict";e.exports=require("worker_threads")},71568:e=>{"use strict";e.exports=require("zlib")},72254:e=>{"use strict";e.exports=require("node:buffer")},87561:e=>{"use strict";e.exports=require("node:fs")},88849:e=>{"use strict";e.exports=require("node:http")},22286:e=>{"use strict";e.exports=require("node:https")},87503:e=>{"use strict";e.exports=require("node:net")},49411:e=>{"use strict";e.exports=require("node:path")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},76402:e=>{"use strict";e.exports=require("node:stream/promises")},72477:e=>{"use strict";e.exports=require("node:stream/web")},41041:e=>{"use strict";e.exports=require("node:url")},47261:e=>{"use strict";e.exports=require("node:util")},65628:e=>{"use strict";e.exports=require("node:zlib")},58359:()=>{},93739:()=>{},179:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>w,patchFetch:()=>v,requestAsyncStorage:()=>y,routeModule:()=>g,serverHooks:()=>S,staticGenerationAsyncStorage:()=>x});var s={};r.r(s),r.d(s,{POST:()=>h});var n=r(49303),a=r(88716),o=r(60670),i=r(87070),u=r(58954),c=r(17445),l=r(9907),d=r(48907),p=r(20593),m=r(59190);let f=process.env.GEMINI_MODEL||"gemini-2.5-flash";async function h(e){let t=process.env.GEMINI_API_KEY;if(!t)return i.NextResponse.json({error:"GEMINI_API_KEY is not configured",script:null},{status:503});let r={};try{r=await e.json()}catch{return i.NextResponse.json({error:"Invalid JSON body",script:null},{status:400})}let s=r.fileNames?.join(", ")??"none (structured context only)",n=`${c.ou}${s}.

${r.summary??"No summary provided."}`,a=[{role:"user",parts:[{text:n}]}];(0,p.g)(a);let o=Date.now();try{let e=new u.fA({apiKey:t}),r=await e.models.generateContent({model:f,config:{systemInstruction:c.LR},contents:a}),s=(0,d.d)(r);if(await (0,l.g)({mode:"presentation",rawResponse:s.slice(0,8e3),outcome:s?"python_script":"empty"}),await (0,m.f)({mode:"presentation",promptLength:n.length,contextSize:n.length,responseLatencyMs:Date.now()-o,validationResult:s?"ok":"empty"}),!s)return i.NextResponse.json({script:null,error:"No response from model"},{status:200});let p=s,h=s.match(/```(?:python)?\s*([\s\S]*?)```/);return h&&(p=h[1].trim()),i.NextResponse.json({script:p,executed:!1},{status:200})}catch(e){return console.error("generate-presentation error",e),await (0,m.f)({mode:"presentation",promptLength:n.length,contextSize:n.length,responseLatencyMs:Date.now()-o,validationResult:"error",error:e instanceof Error?e.message:String(e)}),i.NextResponse.json({script:null,error:e instanceof Error?e.message:"Generation failed"},{status:200})}}let g=new n.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/generate-presentation/route",pathname:"/api/generate-presentation",filename:"route",bundlePath:"app/api/generate-presentation/route"},resolvedPagePath:"/Users/ranjan.dasgupta/pousali.adsgupta_project/pousali.adsgupta/src/app/api/generate-presentation/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:y,staticGenerationAsyncStorage:x,serverHooks:S}=g,w="/api/generate-presentation/route";function v(){return(0,o.patchFetch)({serverHooks:S,staticGenerationAsyncStorage:x})}},17445:(e,t,r)=>{"use strict";r.d(t,{Cv:()=>m,HK:()=>l,Ih:()=>o,LR:()=>i,SY:()=>n,Tt:()=>a,Y3:()=>s,gF:()=>f,j5:()=>d,ou:()=>u,rx:()=>c,yl:()=>p});let s=`You are an Amazon PPC data auditor in verification mode.

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

Rules: plain text only; paragraphs and bullet points; no JSON; no code blocks; no markdown tables; no backticks.`,o=`Analyze the attached raw Amazon PPC report files first. Then use the normalized summary below for reference.

Raw files (attached): analyze these first for metrics, sessions, buy box, and any fields the aggregator may have missed.

Normalized dataset summary (for reference):
`,i=`You are a Python script generator for Amazon PPC report analysis.

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

Provide a clear answer using only the audit context. Structure: Answer, Reason, Recommended Action, Confidence.`}},20593:(e,t,r)=>{"use strict";r.d(t,{g:()=>a});class s extends Error{constructor(e){super(e),this.name="GeminiFileReferenceError"}}let n=["fileUri","files/","fileData","inlineData","fileReference"];function a(e){let t="string"==typeof e?e:JSON.stringify(e??"");for(let e of n)if(t.includes(e))throw new s("Raw files must not be sent to Gemini. Request must use only structured audit context (text).")}},59190:(e,t,r)=>{"use strict";r.d(t,{f:()=>o});var s=r(20629),n=r(55315),a=r.n(n);async function o(e){let t=new Date().toISOString(),r={...e,timestamp:t},n=function(){let e="undefined"!=typeof process&&process.cwd?process.cwd():".";return a().join(e,"logs/gemini-requests")}();try{await (0,s.mkdir)(n,{recursive:!0});let o=t.replace(/[:.]/g,"-").slice(0,19),i=a().join(n,`request-${e.mode}-${o}.json`);await (0,s.writeFile)(i,JSON.stringify(r,null,2),"utf-8")}catch(e){console.error("[geminiRequestLogger]",e)}}},48907:(e,t,r)=>{"use strict";function s(e){if("string"==typeof e.text&&e.text.trim().length>0)return e.text.trim();let t=e.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("").trim();return t&&t.length>0?t:""}r.d(t,{d:()=>s})},9907:(e,t,r)=>{"use strict";r.d(t,{g:()=>o});var s=r(20629),n=r(55315),a=r.n(n);async function o(e){let t=new Date().toISOString().replace(/[:.]/g,"-"),r={...e,timestamp:t},n=function(){let e="undefined"!=typeof process&&process.cwd?process.cwd():".";return a().join(e,"logs/gemini-responses")}();try{await (0,s.mkdir)(n,{recursive:!0});let o=a().join(n,`gemini-${e.mode}-${t.slice(0,19)}.json`);await (0,s.writeFile)(o,JSON.stringify(r,null,2),"utf-8")}catch(e){console.error("[geminiResponseLogger]",e)}}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,972,954],()=>r(179));module.exports=s})();