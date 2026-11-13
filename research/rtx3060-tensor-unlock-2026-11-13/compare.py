#!/usr/bin/env python3
"""Arithmetic QA for independent A/B GPU measurements; never modifies hardware."""
import json
import math
import sys

def analyze(report, target_min=1.20, control_tolerance=0.05):
    if not isinstance(report, dict) or not isinstance(report.get("measurements"), list):
        raise ValueError("Expected a JSON document with measurements array")
    rows = []
    for sample in report["measurements"]:
        label, kind = sample["id"], sample["kind"]
        if kind not in ("target", "control"):
            raise ValueError("invalid kind for " + label)
        before, after = float(sample["baseline"]), float(sample["after"])
        if not all(map(math.isfinite, (before, after))) or before <= 0 or after <= 0:
            raise ValueError("nonpositive/nonfinite observation for " + label)
        speedup = after / before
        valid = (speedup >= target_min if kind == "target"
                 else abs(speedup - 1.0) <= control_tolerance)
        rows.append((label, kind, speedup, valid))
    return rows

def main():
    if len(sys.argv) != 2:
        sys.exit("Usage: python compare.py evidence.json")
    with open(sys.argv[1], encoding="utf-8") as fp:
        report = json.load(fp)
    rows = analyze(report)
    for label, kind, speedup, valid in rows:
        print("{} [{}]: {:.3f}x {}".format(label, kind, speedup, "PASS" if valid else "FAIL"))
    if not report.get("independent_raw_evidence_verified", False):
        print("NOTE: self-reported data; raw hardware evidence pending.")
    passed = bool(rows) and all(row[-1] for row in rows)
    print("ARITHMETIC_QA: " + ("PASS" if passed else "FAIL"))
    return 0 if passed else 1

if __name__ == "__main__":
    sys.exit(main())
