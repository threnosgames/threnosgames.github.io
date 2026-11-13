# RTX 3060 Tensor Unlock: independent evidence (2026-11-13)

**Status:** Functional benchmark **PASS (operator-reported)**; register read-back **PENDING**; full raw-log audit **PENDING**.

Independent community experiment, not an alternate unlocker. The upstream method is [physicsdolphin/nv-uefi-unlocker](https://github.com/physicsdolphin/nv-uefi-unlocker), stable release **v2.1.11**. This folder contributes original measurement metadata and a reusable, dependency-free benchmark comparison script. No NVIDIA binaries, EFI images, GSP assets, unlock payloads or upstream GPL code are redistributed.

## Reported platform

- GPU: GeForce RTX 3060 12 GB / GA106, PCI ID `10de:2504` (operator report)
- CPU: Intel Core i5-12400F
- Motherboard: MSI H610M-E
- Display: two monitors connected to the single discrete GPU
- Boot: manual UEFI USB transaction; operator reports successful POST-FLR, console reconstruction and POST-GOP
- OS: Windows (build, NVIDIA driver and benchmark versions **not yet attached**)
- Data provenance: operator's spoken account from 2026-11-13, not independently inspected log files

## Numeric results reported by operator

| Precision path | Stock (TFLOPS) | After (TFLOPS) | Recomputed speedup | Type |
|---|---:|---:|---:|---|
| FP16 input / FP32 accumulate | 25.84 | 43.16 | **1.670×** | Unlock-sensitive |
| BF16 input / FP32 accumulate | 25.57 | 47.36 | **1.852×** | Unlock-sensitive |
| FP16 input / FP16 accumulate | 47.89 | 47.49 | **0.992×** | Unaffected control |

Operator additionally reports a separate official five-path comparison, with three accelerated target paths and two stable controls, plus TF32 at ~2.04× and another BF16 run at ~1.93×. The full paired five-path results have **not been provided**. An ambiguously transcribed “FP32 ×1.785” is not asserted as scalar FP32; it may refer to FP32 **accumulation**, which is a different kernel.

**Interpretation:** The selective acceleration and near-flat control form a strong functional signature consistent with the upstream GPU-family reports. However, passing mathematical consistency checks is **not** an independent attestation of measured hardware state.

## Reproduce the arithmetic QA

```sh
python compare.py evidence.json
```

Default acceptance in this independent QA helper: target >=1.20×, control within ±5%. This is a *consistency heuristic*, **not** the upstream official benchmark's acceptance rule.

## Missing evidence

1. Original USB `loader.log`: POST-FLR, POST-GOP, Windows handoff, timestamps, SHA-256.
2. Read-only administrator `ssdiag` output: FEAT/SS0/SS1 and actual verdict.
3. Original five-path baseline and after reports, exact command, driver/CUDA/Windows version, repeats, clocks, power and temperatures.
4. Repeated stock-clock tests and at least one practical application workload.

The method is **volatile**, not permanent VBIOS modification; power loss or some sleep/hibernate paths require USB replay. See the [upstream FAQ](https://github.com/physicsdolphin/nv-uefi-unlocker/blob/main/docs/faq.en.md). Preserve original evidence privately before redaction. Do not upload serial numbers, BitLocker keys, full private logs or proprietary firmware.

**Attribution:** Unlocker copyright/licensing remains with physicsdolphin (GPL-2.0). The independently authored data and comparison script in this folder are distributed under MIT (see LICENSE). This evidence note does not claim upstream authorship, new firmware exploits, wide adoption, or eligibility for a funding program.
