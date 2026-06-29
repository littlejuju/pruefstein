#!/usr/bin/env python3
"""
Stop-hook enforcement gate for the biz-feasibility audit layer.

Registered as a `Stop` hook (fires when the MAIN agent tries to end its turn).
It makes a BLOCK verdict un-skippable: if there is a pending audit whose
deterministic decision is BLOCK, it prints the reason to stderr and exits 2,
which prevents the main agent from stopping until the BLOCK is resolved.

Why Stop (not SubagentStop): verified 2026-06-29 against Claude Code docs —
SubagentStop's block only loops the *subagent*; it cannot stop the parent.
The Stop hook is the only primitive that can hold the main agent's turn open.

Convention:
  - The auditor subagent writes its verdict JSON to  <cwd>/.bizfeas/pending_audit.json
  - finalizer.js (deterministic OK|BLOCK) lives next to this script's parent dir
  - An emergency escape file  <cwd>/.bizfeas/override  lets a human force-pass
    (logged to stderr — leaves an audit trail).

Exit codes:  0 = let the agent stop (OK / no pending / overridden)
             2 = BLOCK — hold the turn open, reason on stderr
"""
import json
import os
import subprocess
import sys

def main():
    # Stop-hook input arrives on stdin; we mainly want cwd.
    try:
        hook_in = json.load(sys.stdin)
    except Exception:
        hook_in = {}
    cwd = hook_in.get("cwd") or os.getcwd()

    bizfeas = os.path.join(cwd, ".bizfeas")
    pending = os.path.join(bizfeas, "pending_audit.json")
    override = os.path.join(bizfeas, "override")

    # Nothing to gate -> let the agent stop.
    if not os.path.isfile(pending):
        return 0

    # Emergency human escape (audit-trailed).
    if os.path.isfile(override):
        sys.stderr.write("[audit_gate] OVERRIDE present — BLOCK bypassed by human; see .bizfeas/override\n")
        return 0

    finalizer = os.path.normpath(os.path.join(os.path.dirname(__file__), "..", "finalizer.js"))
    node = os.environ.get("BIZFEAS_NODE", "node")
    try:
        proc = subprocess.run([node, finalizer, pending],
                              capture_output=True, text=True, timeout=30)
    except Exception as e:
        # fail-closed: if we cannot evaluate the audit, do not let the turn end.
        sys.stderr.write(f"[audit_gate] could not run finalizer ({e}) — failing closed, BLOCK.\n")
        return 2

    try:
        result = json.loads(proc.stdout)
    except Exception:
        sys.stderr.write("[audit_gate] finalizer output unparseable — failing closed, BLOCK.\n")
        return 2

    if result.get("decision") == "OK":
        return 0

    # BLOCK — surface the reason + the required fixes, hold the turn open.
    reasons = "; ".join(result.get("block_reasons", [])) or "unresolved BLOCK"
    fixes = " | ".join(result.get("fix_directives", []))
    sys.stderr.write(
        "[audit_gate] AUDIT = BLOCK_UNRESOLVED — cannot deliver this report as-is.\n"
        f"  reasons: {reasons}\n"
        + (f"  required fix: {fixes}\n" if fixes else "")
        + "  resolve it (fix the report and re-audit to OK, or set .bizfeas/override to force-pass) then finish.\n"
    )
    return 2

if __name__ == "__main__":
    sys.exit(main())
