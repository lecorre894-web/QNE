'use strict';
// ===== Δ-QI-V — Benchmark Pico μ-Packet Quantique =====
const fs = require('fs');

function benchmarkPacket(numQubits = 8) {
  const numStates = Math.pow(2, numQubits);
  const normFactor = 1 / Math.sqrt(numStates);

  // 1. Génération & Injection du Paquet Quantique
  const t0 = process.hrtime.bigint();
  let packetReal = new Float64Array(numStates);
  let packetImag = new Float64Array(numStates);
  for (let i = 0; i < numStates; i++) {
    packetReal[i] = normFactor;
    packetImag[i] = 0.0;
  }
  const t1 = process.hrtime.bigint();

  // 2. Traitement d'Onde & Déphasage (Porte Quantique Globale)
  const t2 = process.hrtime.bigint();
  const theta = Math.PI / 4;
  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  for (let i = 0; i < numStates; i++) {
    let r = packetReal[i];
    let img = packetImag[i];
    packetReal[i] = r * cosT - img * sinT;
    packetImag[i] = r * sinT + img * cosT;
  }
  const t3 = process.hrtime.bigint();

  // 3. Mesure d'Intrication du Paquet
  const t4 = process.hrtime.bigint();
  let probabilitySum = 0;
  for (let i = 0; i < numStates; i++) {
    probabilitySum += packetReal[i] * packetReal[i] + packetImag[i] * packetImag[i];
  }
  const t5 = process.hrtime.bigint();

  const dtInit_ns = Number(t1 - t0);
  const dtPhase_ns = Number(t3 - t2);
  const dtMeasure_ns = Number(t5 - t4);
  const dtTotal_ns = dtInit_ns + dtPhase_ns + dtMeasure_ns;

  return {
    qubits: numQubits,
    states: numStates,
    total_pico: (dtTotal_ns * 1000).toFixed(0),
    total_us: (dtTotal_ns / 1000).toFixed(4),
    phase_pico: (dtPhase_ns * 1000).toFixed(0),
    phase_us: (dtPhase_ns / 1000).toFixed(4)
  };
}

const res = benchmarkPacket(8);

console.log(`\n==================================================`);
console.log(`    Δ-QI-V BENCHMARK PICO μ-PACKET QUANTIQUE     `);
console.log(`==================================================`);
console.log(`• Registre Paquet      : ${res.qubits} Qubits (${res.states} états)`);
console.log(`• Traitement Déphasage : ${res.phase_pico} ps  (${res.phase_us} μs)`);
console.log(`• Temps Total Paquet   : ${res.total_pico} ps  (${res.total_us} μs)`);
console.log(`==================================================\n`);

fs.appendFileSync('dqiv.log', `[${new Date().toISOString()}] PICO_PACKET Qubits=${res.qubits} Total=${res.total_pico}ps (${res.total_us}us)\n`);
