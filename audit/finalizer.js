#!/usr/bin/env node
/*
 * Deterministic finalizer — auditor v2 / R1.
 *
 * Input : an auditor-output JSON (path as argv[2], or stdin).
 * Output: the external decision OK | BLOCK_UNRESOLVED, recomputed from the
 *         auditor's per-check verdicts using registry.json's routing rules.
 *
 * Core guarantees:
 *  - Default state is BLOCK. OK is only reached by passing every routing gate.
 *  - It NEVER trusts the auditor's own `proposed_external`; it recomputes, and
 *    flags any mismatch (a divergence signal worth a codex-RED look).
 *  - fail-closed: any required check missing/unfired, or any P0 unresolved,
 *    forces BLOCK (CHECKER_INCOMPLETE).
 *  - GENERATOR_SELF_STAMP is neutralized: a self-stamp in the report is recorded
 *    but is never, by itself, a block reason — and never a reason to pass either.
 *  - don't-false-kill: when a collapse check blocks, the required_fix is surfaced
 *    so downstream sees "relabel, do NOT change the business verdict to KILL".
 *
 * Usage:  node finalizer.js <auditor_output.json> [registry.json]
 */
'use strict';
const fs = require('fs');
const path = require('path');

function load(p) { return JSON.parse(fs.readFileSync(p, 'utf8')); }

const auditorPath = process.argv[2];
const registryPath = process.argv[3] || path.join(__dirname, 'registry.json');
if (!auditorPath) { console.error('usage: node finalizer.js <auditor_output.json> [registry.json]'); process.exit(2); }

const registry = load(registryPath);
const audit = load(auditorPath);

const rule = Object.fromEntries(registry.checks.map(c => [c.id, c]));
const requiredIds = registry.checks.map(c => c.id);
const byId = Object.fromEntries((audit.checks || []).map(c => [c.id, c]));

const block_reasons = [];
const downgrade_notes = [];
const fix_directives = [];

// 1) Completeness (fail-closed): every required check must be present and fired.
const missing = requiredIds.filter(id => !byId[id] || byId[id].fired !== true);
let checker_incomplete = missing.length > 0;
if (checker_incomplete) {
  block_reasons.push(`CHECKER_INCOMPLETE: required checks missing/unfired -> ${missing.join(', ')}`);
}

// 2) Route each fired check by registry block_when.
let self_stamp_detected = false;
for (const c of (audit.checks || [])) {
  const r = rule[c.id];
  if (!r) { downgrade_notes.push(`UNKNOWN_CHECK ${c.id} (not in registry) — ignored`); continue; }
  if (c.id === 'GENERATOR_SELF_STAMP') { self_stamp_detected = (c.verdict === 'fail'); continue; }

  const failed = c.verdict === 'fail';
  const unresolved = c.verdict === 'unresolved';
  if (!failed && !unresolved) continue; // pass -> nothing

  let blocks = false;
  switch (r.block_when) {
    case 'never': blocks = false; break;
    case 'fail_or_unresolved': blocks = failed || unresolved; break;
    case 'fail_and_load_bearing': blocks = failed && c.load_bearing === true; break;
    case 'fail_and_affects_verdict': blocks = failed && c.affects_verdict === true; break;
    default: blocks = failed || unresolved; // unknown rule -> fail-closed
  }
  // fail-closed: any P0 left unresolved blocks regardless of finer rule
  if (unresolved && r.tier === 'P0') blocks = true;

  if (blocks) {
    block_reasons.push(`${c.id} [${r.tier}] ${c.verdict}: ${c.evidence || ''}`.trim());
    if (c.required_fix || r.fix) fix_directives.push(`${c.id}: FIX=${c.required_fix || r.fix}` + (r.must_not ? ` | MUST_NOT=${r.must_not}` : ''));
  } else {
    // failed but non-blocking -> downgrade trace (e.g. non-load-bearing fact, P2, P1-not-verdict)
    const why = r.block_when === 'fail_and_load_bearing' ? 'non-load-bearing -> P2'
              : r.block_when === 'fail_and_affects_verdict' ? 'does not affect verdict -> note'
              : r.tier === 'P2' ? 'P2 cleanup' : 'downgraded';
    downgrade_notes.push(`${c.id} [${r.tier}] ${c.verdict} (${why}): ${c.evidence || ''}`.trim());
  }
}

// 3) Decision: default BLOCK, OK only if no block reasons.
const decision = block_reasons.length === 0 ? 'OK' : 'BLOCK_UNRESOLVED';

// 4) Mismatch signal vs auditor's own claim (never overrides; just flags).
const mismatch = audit.proposed_external && audit.proposed_external !== decision
  ? `AUDITOR_PROPOSED=${audit.proposed_external} but DETERMINISTIC=${decision}` : null;

const out = {
  case_id: audit.case_id || null,
  decision,
  must_fire_complete: !checker_incomplete,
  self_stamp_detected,
  block_reasons,
  downgrade_notes,
  fix_directives,
  mismatch_with_auditor: mismatch,
  report_verdict_as_written: audit.report_verdict_as_written || null
};
process.stdout.write(JSON.stringify(out, null, 2) + '\n');
// exit code: 0 = OK, 1 = BLOCK (lets a SubagentStop hook / CI gate read $?)
process.exit(decision === 'OK' ? 0 : 1);
