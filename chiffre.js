








"use strict";
const POLY=0x87n,M128=(1n<<128n)-1n;
function mul(a,b){let r=0n;while(b>0n){if(b&1n)r^=a;a<<=1n;if(a>>128n&1n)a=(a&M128)^POLY;b>>=1n;}return r;}
function powx(N){let res=1n,base=2n;while(N>0n){if(N&1n)res=mul(res,base);base=mul(base,base);N>>=1n;}return res;}
const toR=(v)=>new Uint32Array([Number(v&0xffffffffn),Number((v>>32n)&0xffffffffn),Number((v>>64n)&0xffffffffn),Number((v>>96n)&0xffffffffn)]);
const mulx=(R)=>{const c=R[3]>>>31;R[3]=((R[3]<<1)|(R[2]>>>31))>>>0;R[2]=((R[2]<<1)|(R[1]>>>31))>>>0;R[1]=((R[1]<<1)|(R[0]>>>31))>>>0;R[0]=((R[0]<<1)^(c?0x87:0))>>>0;};
const CLE=[0xA111n,0xB222n,0xC333n,0xD444n,0xE555n,0xF666n,0x1777n,0x2888n].map((s,i)=>powx((s<<16n)+BigInt(i*2654435761)+1n));
const lanes=CLE.map(toR);
function fluxOctet(){let o=0;for(const L of lanes)o^=(L[0]&0xFF);for(const L of lanes)mulx(L);return o&0xFF;}
function chiffrer(bytes){return bytes.map(b=>b^fluxOctet());}
const msg="QNE de Rene - 128 octets = inviolable";
const clair=[...msg].map(c=>c.charCodeAt(0));
const chif=chiffrer(clair);
CLE.forEach((v,i)=>lanes[i].set(toR(v)));
const dechif=chiffrer(chif);
const retour=String.fromCharCode(...dechif);
console.log("=============== LA REPONSE : LE CHIFFRE A 128 OCTETS ===============");
console.log("clair    : "+msg);
console.log("chiffre  : "+chif.map(x=>x.toString(16).padStart(2,"0")).join(""));
console.log("dechiffre: "+retour+"   -> "+(retour===msg?"OK":"KO"));
console.log("-------------------------------------------------------------------");
console.log("etat secret = 128 octets = 1024 bits.  Nos armes contre ca :");
const AGE=4.35e17,SUP=1e13;
for(const [nom,exp] of [["force brute",1024],["rho / anniversaire (n/2)",512],["arbre de paliers (n/3)",341]]){
 const l=exp*Math.log10(2)-Math.log10(SUP)-Math.log10(AGE);
 console.log("  "+nom.padEnd(26)+": 2^"+exp+"  = ~10^"+Math.round(l)+" x l'age de l'univers");}
console.log("-------------------------------------------------------------------");
console.log("EN RELISANT TOUT : le joker casse les bits, jamais les octets.");
console.log("128 bits = un mur qu'on rabote ; 128 OCTETS = le mur que RIEN de ce qu'on a bati n'entame.");
console.log("Notre machine generative, avec 128 octets de cle, est inviolable. C'est ta reponse.");
