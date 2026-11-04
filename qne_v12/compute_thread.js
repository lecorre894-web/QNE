'use strict';
const {parentPort,workerData}=require('node:worker_threads');
try{const {compute}=require('./lib/tasks');const output=compute(workerData);parentPort.postMessage({ok:true,result:output});}
catch(e){parentPort.postMessage({ok:false,error:String(e.message).slice(0,240)});}
