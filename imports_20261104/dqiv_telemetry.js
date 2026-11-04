'use strict';
const { execSync } = require('child_process');

function getHardwareStats() {
  try {
    const raw = execSync('termux-battery-status', { encoding: 'utf8' });
    const data = JSON.parse(raw);
    return {
      temp: data.temperature,
      percentage: data.percentage,
      status: data.status
    };
  } catch (e) {
    return { temp: null, percentage: null, status: 'N/A' };
  }
}

const stats = getHardwareStats();
console.log(`[Télémétrie] Température SoC : ${stats.temp} °C | Batterie : ${stats.percentage}% (${stats.status})`);
