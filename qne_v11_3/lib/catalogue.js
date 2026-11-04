'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const SNAPSHOT = path.join(__dirname, '..', 'QNE_V11_2_SNAPSHOT.json');
function sha256(buffer) { return crypto.createHash('sha256').update(buffer).digest('hex'); }
function loadSnapshot(p = SNAPSHOT) {
  const obj = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!obj || obj.schema !== 'qne.v11.2.interfaces/1' || !Array.isArray(obj.modules)) throw Error('Rapport V11.2 invalide');
  const names = new Set(), aliases = new Set();
  for (const m of obj.modules) {
    if (!/^[\w.-]+\.js$/.test(m.name) || m.name.includes('..') || typeof m.alias !== 'string' || !/^(core|math|library|dqiv|legacy)\.[\w.-]+$/.test(m.alias)) throw Error('Entree non conforme dans V11.2');
    if (names.has(m.name) || aliases.has(m.alias)) throw Error('Alias ou nom duplique dans V11.2');
    names.add(m.name);aliases.add(m.alias);
  }
  return obj;
}
function modulePath(root, name) {
  const folder = path.resolve(root, 'imports_20261104');
  const target = path.resolve(folder, name);
  if (path.dirname(target) !== folder) throw Error('Chemin module non autorise');
  if (fs.existsSync(target)) {
    const realFolder = fs.realpathSync(folder), real = fs.realpathSync(target);
    if (!real.startsWith(realFolder + path.sep) || !fs.statSync(real).isFile()) throw Error('Module hors du depot ou non fichier');
  }
  return target;
}
function entry(snapshot, root, alias, acceptDrift = false) {
  const m = snapshot.modules.find(x => x.alias === alias);
  if (!m) throw Error('Alias inconnu : ' + alias);
  const file = modulePath(root, m.name);
  if (!fs.existsSync(file)) throw Error('Module absent : ' + m.name);
  const hash = sha256(fs.readFileSync(file));
  if (hash !== m.hash_sha256 && !acceptDrift) throw Error('Empreinte modifiee depuis V11.2 : ' + m.name + ' (utiliser --accept-drift apres verification)');
  return { ...m, file, current_sha256: hash, matched: hash === m.hash_sha256 };
}
function audit(root, snapshot = loadSnapshot()) {
  const results = [];
  for (const m of snapshot.modules) {
    let found = false, matched = false, syntax = 'MISSING', hash = null, error = null;
    try {
      const file = modulePath(root, m.name);
      if (fs.existsSync(file)) {
        found = true; hash = sha256(fs.readFileSync(file)); matched = hash === m.hash_sha256;
        const chk = cp.spawnSync(process.execPath, ['--check', file], { encoding: 'utf8', timeout: 10000, maxBuffer: 64 * 1024 });
        syntax = chk.status === 0 ? 'PASS' : 'FAIL';
        if (syntax !== 'PASS') error = (chk.stderr || chk.error?.message || '').slice(0, 256);
      }
    } catch (e) { error = e.message; }
    results.push({ name: m.name, alias: m.alias, style: m.style, found, syntax, sha256_match: matched, sha256_actual: hash, exports_candidates: m.exported_candidates, declared_not_exported: m.declared_not_exported, exports_unknown: m.exports_unknown, error });
  }
  const expected = results.length;
  const present = results.filter(m => m.found).length;
  const valid = results.filter(m => m.syntax === 'PASS').length;
  const matching = results.filter(m => m.sha256_match).length;
  const catalog = { schema: 'qne.v11.3.integration/1', generated_utc: new Date().toISOString(), source_revision: snapshot.timestamp, source: 'imports_20261104', summary: { expected, present, syntax_pass: valid, sha256_match: matching, executable_cjs: results.filter(m => m.style === 'cjs').length, script_only: results.filter(m => m.style === 'script').length, dqiv: results.filter(m => m.alias.startsWith('dqiv.')).length }, status: present === expected && valid === expected && matching === expected ? 'INVENTORY_VERIFIED' : 'REVIEW_REQUIRED', dynamic_interoperability: 'NOT_VERIFIED', results };
  return catalog;
}
module.exports = { loadSnapshot, entry, audit, sha256, modulePath };
