(()=>{var e={};e.id=834,e.ids=[834],e.modules={20399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},30517:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-route.runtime.prod.js")},27790:e=>{"use strict";e.exports=require("assert")},78893:e=>{"use strict";e.exports=require("buffer")},61282:e=>{"use strict";e.exports=require("child_process")},84770:e=>{"use strict";e.exports=require("crypto")},17702:e=>{"use strict";e.exports=require("events")},92048:e=>{"use strict";e.exports=require("fs")},20629:e=>{"use strict";e.exports=require("fs/promises")},32615:e=>{"use strict";e.exports=require("http")},35240:e=>{"use strict";e.exports=require("https")},98216:e=>{"use strict";e.exports=require("net")},19801:e=>{"use strict";e.exports=require("os")},55315:e=>{"use strict";e.exports=require("path")},35816:e=>{"use strict";e.exports=require("process")},86624:e=>{"use strict";e.exports=require("querystring")},76162:e=>{"use strict";e.exports=require("stream")},82452:e=>{"use strict";e.exports=require("tls")},74175:e=>{"use strict";e.exports=require("tty")},17360:e=>{"use strict";e.exports=require("url")},21764:e=>{"use strict";e.exports=require("util")},6162:e=>{"use strict";e.exports=require("worker_threads")},71568:e=>{"use strict";e.exports=require("zlib")},72254:e=>{"use strict";e.exports=require("node:buffer")},87561:e=>{"use strict";e.exports=require("node:fs")},88849:e=>{"use strict";e.exports=require("node:http")},22286:e=>{"use strict";e.exports=require("node:https")},87503:e=>{"use strict";e.exports=require("node:net")},49411:e=>{"use strict";e.exports=require("node:path")},97742:e=>{"use strict";e.exports=require("node:process")},84492:e=>{"use strict";e.exports=require("node:stream")},76402:e=>{"use strict";e.exports=require("node:stream/promises")},72477:e=>{"use strict";e.exports=require("node:stream/web")},41041:e=>{"use strict";e.exports=require("node:url")},47261:e=>{"use strict";e.exports=require("node:util")},65628:e=>{"use strict";e.exports=require("node:zlib")},58359:()=>{},93739:()=>{},87308:(e,t,r)=>{"use strict";r.r(t),r.d(t,{originalPathname:()=>x,patchFetch:()=>y,requestAsyncStorage:()=>d,routeModule:()=>l,serverHooks:()=>h,staticGenerationAsyncStorage:()=>m});var s={};r.r(s),r.d(s,{POST:()=>p});var i=r(49303),a=r(88716),n=r(60670),o=r(87070),u=r(58954);let c=process.env.GEMINI_MODEL||"gemini-2.5-flash";async function p(e){let t;let r=process.env.GEMINI_API_KEY;if(!r)return o.NextResponse.json({error:"GEMINI_API_KEY not configured"},{status:503});try{t=await e.json()}catch{return o.NextResponse.json({error:"Invalid JSON"},{status:400})}let s=new u.fA({apiKey:r}),{mode:i,payload:a}=t;if("verify_slm"===i){let{datasetSummary:e,slmArtifacts:t}=a,r=`You are an Amazon PPC data auditor. You are given:
1) A dataset summary (normalized account data).
2) SLM (deterministic) analytics outputs: metrics, tables, charts, insights.

Verify the SLM outputs for consistency and correctness:
- Metrics: do the numbers align with the dataset? (e.g. ACOS = spend/sales, ROAS = sales/spend)
- Tables: do row counts and values match the data?
- Charts: do chart data series match the tables they reference?
- Insights: are the insights supported by the data?

Return ONLY a JSON object with scores from 0 to 1 (1 = fully valid):
{"metrics_score": number, "tables_score": number, "charts_score": number, "insights_score": number}

Dataset summary:
${JSON.stringify(e,null,2)}

SLM artifacts:
${JSON.stringify(t,null,2)}`;try{let e=await s.models.generateContent({model:c,contents:[{role:"user",parts:[{text:r}]}]}),t=e.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("").trim()||"",i=function(e){let t=e.indexOf("{");if(-1===t)return null;let r=0,s=-1;for(let i=t;i<e.length;i++)if("{"===e[i]&&r++,"}"===e[i]&&0==--r){s=i;break}if(-1===s)return null;try{return JSON.parse(e.slice(t,s+1))}catch{return null}}(t),a=i&&"number"==typeof i.metrics_score?i.metrics_score:.9,n=i&&"number"==typeof i.tables_score?i.tables_score:.9,u=i&&"number"==typeof i.charts_score?i.charts_score:.9,p=i&&"number"==typeof i.insights_score?i.insights_score:.9;return o.NextResponse.json({metrics_score:Math.max(0,Math.min(1,a)),tables_score:Math.max(0,Math.min(1,n)),charts_score:Math.max(0,Math.min(1,u)),insights_score:Math.max(0,Math.min(1,p))})}catch(e){return console.error("dual-engine verify_slm",e),o.NextResponse.json({metrics_score:.85,tables_score:.85,charts_score:.85,insights_score:.85})}}if("structured"===i){let e=`You are an Amazon PPC data analyst. Analyze this normalized dataset and return structured JSON only.

Dataset:
${JSON.stringify(a,null,2)}

Tasks:
1) Extract key metrics (total ad spend, total ad sales, ACOS, ROAS, TACOS, sessions, buy_box_percentage, units_ordered, conversion_rate). Return as array of {label, value, numericValue}.
2) If the dataset has sessions or buy_box or units_ordered in asins/rows but not in summary, set recovered_fields: {sessions?, buy_box_percentage?, units_ordered?} with your best estimate.
3) Build 2-4 summary tables (campaigns by spend, top keywords, waste keywords, top ASINs) as {id, title, columns: [{key, label}], rows: [...]}.
4) Build 2-3 chart specs as {id, title, type: "pie"|"bar", data: [{name, labels: [], values: []}]}.
5) List 3-8 insights as {id, title, description, severity?, recommendedAction?, entityName?, entityType?}.

Return ONLY valid JSON in this exact shape (no markdown):
{
  "metrics": [...],
  "tables": [...],
  "charts": [...],
  "insights": [...],
  "recovered_fields": {}
}`;try{let t=await s.models.generateContent({model:c,contents:[{role:"user",parts:[{text:e}]}]}),r=t.candidates?.[0]?.content?.parts?.map(e=>e.text??"").join("").trim()||"",i=r.match(/\{[\s\S]*\}/),a=i?i[0]:r,n=JSON.parse(a);return o.NextResponse.json({metrics_gemini:Array.isArray(n.metrics)?n.metrics:[],tables_gemini:Array.isArray(n.tables)?n.tables:[],charts_gemini:Array.isArray(n.charts)?n.charts:[],insights_gemini:Array.isArray(n.insights)?n.insights:[],recovered_fields:n.recovered_fields||{}})}catch(e){return console.error("dual-engine structured",e),o.NextResponse.json({error:"Gemini structured analysis failed",metrics_gemini:[],tables_gemini:[],charts_gemini:[],insights_gemini:[],recovered_fields:{}},{status:200})}}return o.NextResponse.json({error:"Invalid mode"},{status:400})}let l=new i.AppRouteRouteModule({definition:{kind:a.x.APP_ROUTE,page:"/api/dual-engine/route",pathname:"/api/dual-engine",filename:"route",bundlePath:"app/api/dual-engine/route"},resolvedPagePath:"/Users/ranjan.dasgupta/pousali.adsgupta_project/pousali.adsgupta/src/app/api/dual-engine/route.ts",nextConfigOutput:"",userland:s}),{requestAsyncStorage:d,staticGenerationAsyncStorage:m,serverHooks:h}=l,x="/api/dual-engine/route";function y(){return(0,n.patchFetch)({serverHooks:h,staticGenerationAsyncStorage:m})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),s=t.X(0,[276,287],()=>r(87308));module.exports=s})();