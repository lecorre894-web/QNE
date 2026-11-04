








"use strict";
function BB(n){const T=4*(n+1);let total=1;for(let i=0;i<2*n;i++)total*=T;
 const pw=[1];for(let i=1;i<=2*n;i++)pw[i]=pw[i-1]*T;
 const tape=new Int8Array(256);let best=0,champ=-1;
 for(let m=0;m<total;m++){tape.fill(0);let head=128,state=0,steps=0,res=-1;
  while(steps<100){const b=tape[head],idx=state*2+b,code=((m/pw[idx])|0)%T,next=code>>2;
   tape[head]=code&1;head+=(code&2)?1:-1;steps++;
   if(next===n){res=steps;break;}state=next;if(head<1||head>=255){res=-1;break;}}
  if(res>best){best=res;champ=m;}}
 return {best,champ,total};}
function rejoue(n,m){const T=4*(n+1),pw=[1];for(let i=1;i<=2*n;i++)pw[i]=pw[i-1]*T;
 const tape=new Int8Array(4096);let head=2048,state=0,steps=0;
 while(steps<100000){const b=tape[head],idx=state*2+b,code=((m/pw[idx])|0)%T,next=code>>2;
  tape[head]=code&1;head+=(code&2)?1:-1;steps++;if(next===n)return steps;state=next;if(head<1||head>=4095)return -1;}
 return -1;}
const connu={2:6,3:21};let tous=true;
console.log("LE PC SE CONCOIT ET SE RESOUT BB(n)");
console.log("--------------------------------------------------");
for(const n of [2,3]){const t=process.hrtime.bigint();const r=BB(n);const s=Number(process.hrtime.bigint()-t)/1e9;
 const v=rejoue(n,r.champ);const ok=(v===r.best)&&(r.best===connu[n]);if(!ok)tous=false;
 console.log("  BB("+n+")  concu ("+r.total.toLocaleString("fr-FR")+" machines) -> resolu BB("+n+")="+r.best+" pas");
 console.log("       -> VERIF : champion rejoue = "+v+" pas, valeur connue = "+connu[n]+"  -> "+(ok?"VERIFIE OK":"ECHEC")+"   ("+s.toFixed(1)+"s)");}
console.log("--------------------------------------------------");
console.log(tous?"TOUT VERIFIE : le PC a concu, resolu ET rejoue son propre champion. Seul.":"echec.");
console.log("HONNETE : BB(4) (~7 milliards de machines) = des heures ici ; BB(5)+ hors de portee ; BB(n) INDECIDABLE en general.");
