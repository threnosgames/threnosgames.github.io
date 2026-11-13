"""Regression tests for the independent arithmetic QA helper."""
import unittest
from compare import analyze

class ArithmeticQATests(unittest.TestCase):
    def test_reported_example(self):
        rows = analyze({"measurements": [
            {"id": "fp16", "kind": "target", "baseline": 25.84, "after": 43.16},
            {"id": "control", "kind": "control", "baseline": 47.89, "after": 47.49}
        ]})
        self.assertTrue(all(row[3] for row in rows))
        self.assertAlmostEqual(rows[0][2], 1.67027863777)

    def test_control_drift_detected(self):
        rows = analyze({"measurements": [
            {"id": "c", "kind": "control", "baseline": 10, "after": 11}
        ]})
        self.assertFalse(rows[0][3])

    def test_invalid_baseline_rejected(self):
        with self.assertRaises(ValueError):
            analyze({"measurements": [
                {"id": "bad", "kind": "target", "baseline": 0, "after": 5}
            ]})

if __name__ == "__main__":
    unittest.main()
