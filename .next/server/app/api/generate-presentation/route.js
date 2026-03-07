(()=>{var e={};e.id=569,e.ids=[569],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},35816:e=>{"use strict";e.exports=require("process")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},6162:e=>{"use strict";e.exports=require("worker_threads")},71568:e=>{"use strict";e.exports=require("zlib")},72254:e=>{"use strict";e.exports=require("node:buffer")},87561:e=>{"use strict";e.exports=require("node:fs")},88849:e=>{"use strict";e.exports=require("node:http")},22286:e=>{"use strict";e.exports=require("node:https")},87503:e=>{"use strict";e.exports=require("node:net")},49411:e=>{"use strict";e.exports=require("node:path")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},76402:e=>{"use strict";e.exports=require("node:stream/promises")},72477:e=>{"use strict";e.exports=require("node:stream/web")},41041:e=>{"use strict";e.exports=require("node:url")},47261:e=>{"use strict";e.exports=require("node:util")},65628:e=>{"use strict";e.exports=require("node:zlib")},58359:()=>{},93739:()=>{},179:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>g,patchFetch:()=>x,requestAsyncStorage:()=>f,routeModule:()=>m,serverHooks:()=>y,staticGenerationAsyncStorage:()=>h});var s={};r.r(s),r.d(s,{POST:()=>d});var a=r(49303),o=r(88716),n=r(60670),i=r(87070),u=r(58954),c=r(17445),l=r(9907);let p=process.env.GEMINI_MODEL||"gemini-2.5-flash";async function d(e){let t=process.env.GEMINI_API_KEY;if(!t)return i.NextResponse.json({error:"GEMINI_API_KEY is not configured",script:null},{status:503});let r=e.headers.get("content-type")||"",s={},a=[];if(r.includes("multipart/form-data"))try{let t=await e.formData(),r=t.get("payload");for(let e of(r&&(s=JSON.parse(r)),t.getAll("files")))if(null!=e&&"function"==typeof e.arrayBuffer){let t=e instanceof File?e.name:"report.csv";a.push({blob:e,name:t})}}catch{return i.NextResponse.json({error:"Invalid multipart/form-data",script:null},{status:400})}else try{s=await e.json()}catch{return i.NextResponse.json({error:"Invalid JSON body",script:null},{status:400})}let o=a.length>0?a.map(e=>e.name).join(", "):s.fileNames?.join(", ")??"none",n=`${c.ou}${o}.

${s.summary??"No summary provided."}`;try{let e=new u.fA({apiKey:t}),r=[];if(a.length>0){for(let{blob:t,name:s}of a){let a=function(e){let t=e.toLowerCase();return t.endsWith(".xlsx")?"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":t.endsWith(".xls")?"application/vnd.ms-excel":"text/csv"}(s),o=await e.files.upload({file:t,config:{mimeType:a}});r.push({fileData:{fileUri:o.name,mimeType:a}})}r.push({text:n})}else r=[{text:n}];let s=r.filter(e=>e.fileData?.fileUri),o=await e.models.generateContent({model:p,config:{systemInstruction:c.LR},contents:[{role:"user",parts:s.length>0?[...s.map(e=>({fileData:e.fileData})),{text:n}]:[{text:n}]}]}),d=o.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("\n").trim()||"";if(await (0,l.g)({mode:"presentation",rawResponse:d.slice(0,8e3),outcome:d?"python_script":"empty"}),!d)return i.NextResponse.json({script:null,error:"No response from model"},{status:200});let m=d,f=d.match(/```(?:python)?\s*([\s\S]*?)```/);return f&&(m=f[1].trim()),i.NextResponse.json({script:m,executed:!1},{status:200})}catch(e){return console.error("generate-presentation error",e),i.NextResponse.json({script:null,error:e instanceof Error?e.message:"Generation failed"},{status:200})}}let m=new a.AppRouteRouteModule({definition:{kind:o.x.APP_ROUTE,page:"/api/generate-presentation/route",pathname:"/api/generate-presentation",filename:"route",bundlePath:"app/api/generate-presentation/route"},resolvedPagePath:"/Users/ranjan.dasgupta/pousali.adsgupta_project/pousali.adsgupta/src/app/api/generate-presentation/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:f,staticGenerationAsyncStorage:h,serverHooks:y}=m,g="/api/generate-presentation/route";function x(){return(0,n.patchFetch)({serverHooks:y,staticGenerationAsyncStorage:h})}},17445:(e,t,r)=>{"use strict";r.d(t,{HK:()=>l,Ih:()=>n,LR:()=>i,SY:()=>a,Tt:()=>o,Y3:()=>s,j5:()=>d,ou:()=>u,rx:()=>c,v:()=>p,yl:()=>m});let s=`You are an Amazon PPC data auditor in verification mode.

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
- correctedMetrics: optional object of metric label to corrected numeric value when you disagree; empty {} when agree.`;function a(e,t){return`Dataset summary:
${JSON.stringify(e,null,2)}

SLM artifacts:
${JSON.stringify(t,null,2)}

Return ONLY the JSON object. No other text.`}let o=`You are an Amazon PPC data analyst writing an executive audit narrative.

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
`,p=`The attached files are Amazon PPC reports. Use them for metric extraction, column inference, and validation.

Optional normalized summary (for reference; prefer extracting from raw files when possible):
`,d=`You are an Amazon Seller Central and Amazon Advertising report schema expert.
For each header, infer the most likely canonical Amazon metric.
Return ONLY valid JSON: {"mappings": [{"rawHeader": "...", "inferred_metric": "canonical", "confidence_score": number}]}`;function m(e){return`Infer the canonical Amazon metric for each of these report column headers:

${e.map(e=>`- "${e}"`).join("\n")}

Return ONLY the JSON object with mappings.`}},9907:(e,t,r)=>{"use strict";r.d(t,{g:()=>n});var s=r(20629),a=r(55315),o=r.n(a);async function n(e){let t=new Date().toISOString().replace(/[:.]/g,"-"),r={...e,timestamp:t},a=function(){let e="undefined"!=typeof process&&process.cwd?process.cwd():".";return o().join(e,"logs/gemini-responses")}();try{await (0,s.mkdir)(a,{recursive:!0});let n=o().join(a,`gemini-${e.mode}-${t.slice(0,19)}.json`);await (0,s.writeFile)(n,JSON.stringify(r,null,2),"utf-8")}catch(e){console.error("[geminiResponseLogger]",e)}}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,287],()=>r(179));module.exports=s})();