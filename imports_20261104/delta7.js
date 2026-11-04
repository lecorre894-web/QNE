'use strict';
const branch=+process.argv[2]||10,depth=+process.argv[3]||128,k=+process.argv[4]||4;
const l2=Math.log10(2);
const fmt=x=>x<1e15?Math.round(x).toLocaleString('fr'):x.toExponential(4);
const e10=L=>{const e=Math.floor(L),m=Math.pow(10,L-e);return m.toFixed(4)+'e+'+fmt(e);};
const Lc=depth*Math.log10(branch),Lq=Math.log10(k)+Lc;
console.log('Δ — '+branch+'^'+depth+', '+k+' qubits/îlot');
console.log('îlots        : '+e10(Lc));
console.log('qubits       : '+e10(Lq)+'  (= '+k+' × îlots)');
if(Lq<300){const LH=Math.pow(10,Lq)*l2;
 console.log('Hilbert 2^q  : 10^'+fmt(LH)+'  (~'+fmt(LH)+' chiffres)');}
else{const LL=Lq+Math.log10(l2);
 console.log('Hilbert 2^q  : 10^(10^'+fmt(LL)+')  — tour exponentielle');}
console.log('Δ enjambe le fossé : îlots lineaires, Hilbert exponentiel');
