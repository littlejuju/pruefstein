#!/usr/bin/env node
/* Smoke test for finalizer.js routing — validates the two-sided gate mechanics.
 * Builds an all-pass auditor output from registry.json, flips one check per scenario,
 * runs finalizer.js, and asserts the deterministic decision. */
'use strict';
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const DIR = path.join(__dirname, '..');
const registry = JSON.parse(fs.readFileSync(path.join(DIR, 'registry.json'), 'utf8'));

function allPass() {
  return {
    case_id: 'SMOKE',
    report_verdict_as_written: 'KILL (smoke)',
    checks: registry.checks.map(c => ({
      id: c.id, tier: c.tier, fired: true, verdict: 'pass',
      load_bearing: false, affects_verdict: false, evidence: 'baseline pass'
    })),
    proposed_external: 'OK'
  };
}
function setCheck(obj, id, patch) {
  const c = obj.checks.find(x => x.id === id);
  Object.assign(c, patch);
  return obj;
}
function run(obj) {
  const tmp = path.join(__dirname, '_smoke_tmp.json');
  fs.writeFileSync(tmp, JSON.stringify(obj));
  let decision, parsed, code = 0;
  try {
    const out = execFileSync('node', [path.join(DIR, 'finalizer.js'), tmp], { encoding: 'utf8' });
    parsed = JSON.parse(out);
  } catch (e) {
    parsed = JSON.parse(e.stdout); code = e.status;
  }
  fs.unlinkSync(tmp);
  return parsed;
}

const scenarios = [
  ['baseline all-pass', allPass(), 'OK'],
  ['HARM fail (load-bearing) -> BLOCK', setCheck(allPass(), 'HARM_UNSAFE_TEST_ACTION', { verdict: 'fail', load_bearing: true, affects_verdict: true, evidence: 'real lending test, no legal gate', required_fix: 'hard-gate' }), 'BLOCK_UNRESOLVED'],
  ['P2 over-green fail -> OK (anti-FP)', setCheck(allPass(), 'SOURCE_OVERCLAIM_NONLOADBEARING', { verdict: 'fail', evidence: 'decorative green' }), 'OK'],
  ['UNSUPPORTED fail but NON-load-bearing -> OK', setCheck(allPass(), 'UNSUPPORTED_LOAD_BEARING_FACT', { verdict: 'fail', load_bearing: false, evidence: 'weak source but not load-bearing' }), 'OK'],
  ['UNSUPPORTED fail + load-bearing -> BLOCK', setCheck(allPass(), 'UNSUPPORTED_LOAD_BEARING_FACT', { verdict: 'fail', load_bearing: true, evidence: 'KILL pinned on blog source' }), 'BLOCK_UNRESOLVED'],
  ['COLLAPSE_SOFT fail -> BLOCK + relabel fix', setCheck(allPass(), 'CURRENT_VS_PASSED_COLLAPSE_SOFT', { verdict: 'fail', load_bearing: true, affects_verdict: true, evidence: 'BLUF CAPPED, current KILL', required_fix: 'relabel current->TEST' }), 'BLOCK_UNRESOLVED'],
  ['POLICY_CURRENCY fail NOT affecting verdict -> OK', setCheck(allPass(), 'POLICY_CURRENCY', { verdict: 'fail', affects_verdict: false, evidence: 'draft labelled, verdict robust' }), 'OK'],
  ['POLICY_CURRENCY fail affecting verdict -> BLOCK', setCheck(allPass(), 'POLICY_CURRENCY', { verdict: 'fail', affects_verdict: true, evidence: 'verdict hangs on draft reg' }), 'BLOCK_UNRESOLVED'],
  ['self-stamp present -> still OK (neutralized)', setCheck(allPass(), 'GENERATOR_SELF_STAMP', { verdict: 'fail', evidence: 'BIZFEAS_AUDIT_OK in report' }), 'OK'],
  ['P0 unresolved (fail-closed) -> BLOCK', setCheck(allPass(), 'VERDICT_OBJECT_LABEL_CONFLICT', { verdict: 'unresolved', evidence: 'BLUF missing, cannot judge' }), 'BLOCK_UNRESOLVED'],
];

let pass = 0, fail = 0;
for (const [name, obj, expect] of scenarios) {
  const r = run(obj);
  const ok = r.decision === expect;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  => ${r.decision}${ok ? '' : ` (expected ${expect})`}`);
  if (name.includes('relabel')) console.log(`        fix_directives: ${JSON.stringify(r.fix_directives)}`);
  ok ? pass++ : fail++;
}

// incompleteness scenario: drop a required check
{
  const obj = allPass(); obj.checks = obj.checks.filter(c => c.id !== 'FACT_WALL_IMPURITY');
  const r = run(obj);
  const ok = r.decision === 'BLOCK_UNRESOLVED' && !r.must_fire_complete;
  console.log(`${ok ? 'PASS' : 'FAIL'}  missing check -> BLOCK + must_fire_complete=false  => ${r.decision}/${r.must_fire_complete}`);
  ok ? pass++ : fail++;
}

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail ? 1 : 0);
