#!/usr/bin/env node
'use strict';
// Choose a worker count using *local* V13 measured timings; never extrapolate from another machine.
const fs=require('node:fs'),path=require('node:path');
const reportPath=path.join(__dirname,'QNE_V13_BENCH_LOCAL.json');
const mode=process.argv[2]||'repeated';
if(!['repeated','unique'].includes(mode))throw Error('Usage: node selection.js repeated|unique');
let count=2,source='fallback';
if(fs.existsSync(reportPath)){
 const r=JSON.parse(fs.readFileSync(reportPath));
 if(r.status==='PASSED'&&r.summary?.[mode]){
   const s=r.summary[mode];const sizes=[[1,s.v13_1_ms],[2,s.v13_2_ms],[4,s.v13_4_ms]].filter(x=>Number.isFinite(x[1])&&x[1]>0);
   if(sizes.length===3){sizes.sort((a,b)=>a[1]-b[1]);count=sizes[0][0];source='calibration-locale';}
 }
}
if(process.argv.includes('--json'))console.log(JSON.stringify({workers:count,workload:mode,source}));
else console.log(count);
