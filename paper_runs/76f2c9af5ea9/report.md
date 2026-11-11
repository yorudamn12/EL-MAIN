# DreamMachine results — multi-Qwen3-0.6B

**Mode:** PAPER  ·  **Paper-eligible:** yes  ·  **Complete:** yes

**Model:** `Qwen/Qwen3-0.6B`  ·  **Prompt:** `qwen_boxed`  ·  **Target:** `steps` 0.50, `n_div` 0.20, `log10_max` 0.13, `n_mul` 0.12, `n_distractors` 0.06 (multi, weight = share of effect)

**Comparison arms** (real_only, untargeted, matched_control, targeted) were trained in paper run `80b37628b193` and are not retrained here.

## Baseline (untrained model)

| benchmark | accuracy | n |
|---|---|---|
| gsm8k | 0.638 | 1319 |
| gsm_symbolic:main | 0.570 | 500 |
| probes_train_families | 0.384 | 432 |
| probes_heldout_families | 0.324 | 432 |

## Primary result (status: proposed)

_Does aiming at all significant weaknesses help beyond difficulty?_ multi_targeted − multi_matched_control

| benchmark | Δ accuracy | 95% CI | p | n | significant |
|---|---|---|---|---|---|
| gsm8k | -0.023 | [-0.051, +0.006] | 0.113 | 300 | no |
| gsm_symbolic:main | -0.028 | [-0.063, +0.007] | 0.117 | 200 | no |

## Before vs after (each arm vs the untrained model)

| arm | ratio | benchmark | accuracy (mean ± sd) | seeds | Δ vs base | 95% CI | regression |
|---|---|---|---|---|---|---|---|
| real_only | 0 | gsm8k | 0.458 ± 0.011 | 3 | -0.202 | [-0.254, -0.150] | **yes** |
| real_only | 0 | gsm_symbolic:main | 0.415 ± 0.018 | 3 | -0.160 | [-0.230, -0.090] | **yes** |
| real_only | 0 | probes_train_families | 0.237 ± 0.020 | 3 | -0.126 | [-0.205, -0.049] | **yes** |
| real_only | 0 | probes_heldout_families | 0.247 ± 0.023 | 3 | -0.101 | [-0.173, -0.030] | **yes** |
| untargeted | 3 | gsm8k | 0.447 ± 0.019 | 3 | -0.213 | [-0.266, -0.161] | **yes** |
| untargeted | 3 | gsm_symbolic:main | 0.418 ± 0.028 | 3 | -0.157 | [-0.222, -0.093] | **yes** |
| untargeted | 3 | probes_train_families | 0.941 ± 0.020 | 3 | +0.578 | [+0.491, +0.659] | no |
| untargeted | 3 | probes_heldout_families | 0.760 ± 0.037 | 3 | +0.412 | [+0.328, +0.496] | no |
| matched_control | 3 | gsm8k | 0.448 ± 0.034 | 3 | -0.212 | [-0.264, -0.161] | **yes** |
| matched_control | 3 | gsm_symbolic:main | 0.408 ± 0.034 | 3 | -0.167 | [-0.235, -0.100] | **yes** |
| matched_control | 3 | probes_train_families | 0.881 ± 0.020 | 3 | +0.519 | [+0.435, +0.598] | no |
| matched_control | 3 | probes_heldout_families | 0.760 ± 0.031 | 3 | +0.412 | [+0.331, +0.494] | no |
| targeted | 3 | gsm8k | 0.436 ± 0.029 | 3 | -0.224 | [-0.274, -0.176] | **yes** |
| targeted | 3 | gsm_symbolic:main | 0.407 ± 0.018 | 3 | -0.168 | [-0.233, -0.103] | **yes** |
| targeted | 3 | probes_train_families | 0.795 ± 0.031 | 3 | +0.432 | [+0.341, +0.516] | no |
| targeted | 3 | probes_heldout_families | 0.602 ± 0.035 | 3 | +0.254 | [+0.175, +0.333] | no |
| targeted | 9 | gsm8k | 0.422 ± 0.034 | 3 | -0.238 | [-0.288, -0.187] | **yes** |
| targeted | 9 | gsm_symbolic:main | 0.382 ± 0.031 | 3 | -0.193 | [-0.265, -0.125] | **yes** |
| targeted | 9 | probes_train_families | 0.869 ± 0.011 | 3 | +0.506 | [+0.425, +0.585] | no |
| targeted | 9 | probes_heldout_families | 0.704 ± 0.071 | 3 | +0.356 | [+0.274, +0.437] | no |
| multi_targeted | 3 | gsm8k | 0.432 ± 0.008 | 3 | -0.228 | [-0.279, -0.177] | **yes** |
| multi_targeted | 3 | gsm_symbolic:main | 0.400 ± 0.005 | 3 | -0.175 | [-0.240, -0.108] | **yes** |
| multi_targeted | 3 | probes_train_families | 0.919 ± 0.020 | 3 | +0.556 | [+0.469, +0.637] | no |
| multi_targeted | 3 | probes_heldout_families | 0.770 ± 0.066 | 3 | +0.422 | [+0.343, +0.501] | no |
| multi_matched_control | 3 | gsm8k | 0.456 ± 0.024 | 3 | -0.204 | [-0.257, -0.153] | **yes** |
| multi_matched_control | 3 | gsm_symbolic:main | 0.428 ± 0.018 | 3 | -0.147 | [-0.215, -0.080] | **yes** |
| multi_matched_control | 3 | probes_train_families | 0.923 ± 0.019 | 3 | +0.560 | [+0.474, +0.642] | no |
| multi_matched_control | 3 | probes_heldout_families | 0.719 ± 0.007 | 3 | +0.370 | [+0.291, +0.447] | no |

## Arm vs arm (paired, item-level bootstrap)

| comparison | ratio | benchmark | Δ accuracy | 95% CI | p | significant |
|---|---|---|---|---|---|---|
| targeted − matched_control | 3 | gsm8k | -0.012 | [-0.039, +0.014] | 0.393 | no |
| targeted − matched_control | 3 | gsm_symbolic:main | -0.002 | [-0.037, +0.032] | 0.934 | no |
| targeted − matched_control | 3 | probes_train_families | -0.086 | [-0.143, -0.030] | 0.003 | yes |
| targeted − matched_control | 3 | probes_heldout_families | -0.158 | [-0.225, -0.089] | 0.000 | yes |
| targeted − untargeted | 3 | gsm8k | -0.011 | [-0.038, +0.017] | 0.431 | no |
| targeted − untargeted | 3 | gsm_symbolic:main | -0.012 | [-0.045, +0.022] | 0.517 | no |
| targeted − untargeted | 3 | probes_train_families | -0.146 | [-0.200, -0.091] | 0.000 | yes |
| targeted − untargeted | 3 | probes_heldout_families | -0.158 | [-0.230, -0.086] | 0.000 | yes |
| matched_control − untargeted | 3 | gsm8k | +0.001 | [-0.026, +0.027] | 0.928 | no |
| matched_control − untargeted | 3 | gsm_symbolic:main | -0.010 | [-0.043, +0.023] | 0.594 | no |
| matched_control − untargeted | 3 | probes_train_families | -0.059 | [-0.099, -0.022] | 0.000 | yes |
| matched_control − untargeted | 3 | probes_heldout_families | +0.000 | [-0.049, +0.052] | 1.000 | no |
| targeted − real_only | 3 | gsm8k | -0.022 | [-0.059, +0.013] | 0.227 | no |
| targeted − real_only | 3 | gsm_symbolic:main | -0.008 | [-0.048, +0.030] | 0.670 | no |
| targeted − real_only | 3 | probes_train_families | +0.558 | [+0.486, +0.625] | 0.000 | yes |
| targeted − real_only | 3 | probes_heldout_families | +0.356 | [+0.299, +0.415] | 0.000 | yes |
| targeted − real_only | 9 | gsm8k | -0.036 | [-0.073, +0.001] | 0.054 | no |
| targeted − real_only | 9 | gsm_symbolic:main | -0.033 | [-0.077, +0.008] | 0.115 | no |
| targeted − real_only | 9 | probes_train_families | +0.632 | [+0.563, +0.696] | 0.000 | yes |
| targeted − real_only | 9 | probes_heldout_families | +0.457 | [+0.393, +0.521] | 0.000 | yes |
| multi_targeted − multi_matched_control | 3 | gsm8k | -0.023 | [-0.051, +0.006] | 0.113 | no |
| multi_targeted − multi_matched_control | 3 | gsm_symbolic:main | -0.028 | [-0.063, +0.007] | 0.117 | no |
| multi_targeted − multi_matched_control | 3 | probes_train_families | -0.005 | [-0.037, +0.027] | 0.751 | no |
| multi_targeted − multi_matched_control | 3 | probes_heldout_families | +0.052 | [+0.010, +0.094] | 0.014 | yes |
| multi_targeted − targeted | 3 | gsm8k | -0.003 | [-0.031, +0.024] | 0.816 | no |
| multi_targeted − targeted | 3 | gsm_symbolic:main | -0.007 | [-0.042, +0.028] | 0.698 | no |
| multi_targeted − targeted | 3 | probes_train_families | +0.123 | [+0.074, +0.175] | 0.000 | yes |
| multi_targeted − targeted | 3 | probes_heldout_families | +0.168 | [+0.109, +0.230] | 0.000 | yes |
| multi_targeted − untargeted | 3 | gsm8k | -0.014 | [-0.042, +0.014] | 0.308 | no |
| multi_targeted − untargeted | 3 | gsm_symbolic:main | -0.018 | [-0.050, +0.013] | 0.277 | no |
| multi_targeted − untargeted | 3 | probes_train_families | -0.022 | [-0.054, +0.007] | 0.140 | no |
| multi_targeted − untargeted | 3 | probes_heldout_families | +0.010 | [-0.032, +0.052] | 0.693 | no |
| multi_targeted − matched_control | 3 | gsm8k | -0.016 | [-0.044, +0.012] | 0.282 | no |
| multi_targeted − matched_control | 3 | gsm_symbolic:main | -0.008 | [-0.047, +0.030] | 0.658 | no |
| multi_targeted − matched_control | 3 | probes_train_families | +0.037 | [-0.002, +0.077] | 0.061 | no |
| multi_targeted − matched_control | 3 | probes_heldout_families | +0.010 | [-0.035, +0.054] | 0.685 | no |
| multi_targeted − real_only | 3 | gsm8k | -0.026 | [-0.060, +0.008] | 0.139 | no |
| multi_targeted − real_only | 3 | gsm_symbolic:main | -0.015 | [-0.052, +0.022] | 0.425 | no |
| multi_targeted − real_only | 3 | probes_train_families | +0.681 | [+0.612, +0.743] | 0.000 | yes |
| multi_targeted − real_only | 3 | probes_heldout_families | +0.523 | [+0.459, +0.585] | 0.000 | yes |
| multi_matched_control − matched_control | 3 | gsm8k | +0.008 | [-0.022, +0.037] | 0.631 | no |
| multi_matched_control − matched_control | 3 | gsm_symbolic:main | +0.020 | [-0.018, +0.058] | 0.315 | no |
| multi_matched_control − matched_control | 3 | probes_train_families | +0.042 | [+0.007, +0.081] | 0.021 | yes |
| multi_matched_control − matched_control | 3 | probes_heldout_families | -0.042 | [-0.086, +0.002] | 0.059 | no |
| multi_matched_control − untargeted | 3 | gsm8k | +0.009 | [-0.018, +0.036] | 0.537 | no |
| multi_matched_control − untargeted | 3 | gsm_symbolic:main | +0.010 | [-0.027, +0.048] | 0.582 | no |
| multi_matched_control − untargeted | 3 | probes_train_families | -0.017 | [-0.049, +0.012] | 0.314 | no |
| multi_matched_control − untargeted | 3 | probes_heldout_families | -0.042 | [-0.091, +0.007] | 0.088 | no |

## Each targeted weakness: held-out probes above the threshold (before → after)

| arm | ratio | trained in | steps | n_div | log10_max | n_mul | n_distractors |
|---|---|---|---|---|---|---|---|
| real_only | 0 | 80b37628b193 | 0.176 → 0.088 (n 68) | 0.068 → 0.076 (n 44) | 0.393 → 0.228 (n 89) | 0.290 → 0.210 (n 62) | 0.298 → 0.167 (n 94) |
| untargeted | 3 | 80b37628b193 | 0.176 → 0.706 (n 68) | 0.068 → 0.758 (n 44) | 0.393 → 0.764 (n 89) | 0.290 → 0.763 (n 62) | 0.298 → 0.720 (n 94) |
| matched_control | 3 | 80b37628b193 | 0.176 → 0.652 (n 68) | 0.068 → 0.735 (n 44) | 0.393 → 0.764 (n 89) | 0.290 → 0.737 (n 62) | 0.298 → 0.730 (n 94) |
| targeted | 3 | 80b37628b193 | 0.176 → 0.544 (n 68) | 0.068 → 0.348 (n 44) | 0.393 → 0.577 (n 89) | 0.290 → 0.538 (n 62) | 0.298 → 0.553 (n 94) |
| targeted | 9 | 80b37628b193 | 0.176 → 0.657 (n 68) | 0.068 → 0.515 (n 44) | 0.393 → 0.708 (n 89) | 0.290 → 0.661 (n 62) | 0.298 → 0.663 (n 94) |
| multi_targeted | 3 | 76f2c9af5ea9 | 0.176 → 0.701 (n 68) | 0.068 → 0.720 (n 44) | 0.393 → 0.768 (n 89) | 0.290 → 0.742 (n 62) | 0.298 → 0.734 (n 94) |
| multi_matched_control | 3 | 76f2c9af5ea9 | 0.176 → 0.662 (n 68) | 0.068 → 0.652 (n 44) | 0.393 → 0.738 (n 89) | 0.290 → 0.677 (n 62) | 0.298 → 0.677 (n 94) |

## Change in weaknesses (η after − before; negative = hurts less)

| arm | ratio | steps | log10_max | n_mul | n_div | n_carry | n_distractors | has_merge |
|---|---|---|---|---|---|---|---|---|
| real_only | 0 | -0.314 | +0.263 | -0.327 | +0.038 | +0.109 | +0.448 | — |
| untargeted | 3 | +0.049 | +1.818 | -1.761 | -1.508 | -0.085 | -0.888 | — |
| matched_control | 3 | +0.228 | +0.255 | -0.899 | -1.010 | -0.029 | -0.501 | — |
| targeted | 3 | -0.977 | +0.270 | -0.010 | -0.142 | +0.166 | -0.205 | — |
| targeted | 9 | -0.724 | +0.495 | -0.294 | -0.481 | +0.142 | -0.539 | — |
| multi_targeted | 3 | -0.356 | +0.762 | -0.930 | -0.630 | +0.073 | -0.617 | — |
| multi_matched_control | 3 | -0.262 | +0.595 | -0.755 | -0.553 | +0.017 | -0.914 | — |

## Error-type shift among wrong answers (after − before)

| arm | ratio | FORMAT_ERROR | ARITHMETIC_SLIP | DISTRACTOR_USE | PLAN_ERROR | UNVERIFIABLE |
|---|---|---|---|---|---|---|
| real_only | 0 | -0.003 | +0.142 | -0.025 | -0.023 | -0.092 |
| untargeted | 3 | -0.004 | +0.123 | -0.018 | +0.003 | -0.105 |
| matched_control | 3 | -0.003 | +0.119 | -0.008 | +0.030 | -0.138 |
| targeted | 3 | -0.004 | +0.104 | -0.031 | +0.049 | -0.118 |
| targeted | 9 | -0.003 | +0.117 | -0.045 | +0.040 | -0.110 |
| multi_targeted | 3 | -0.002 | +0.101 | -0.017 | +0.023 | -0.105 |
| multi_matched_control | 3 | -0.003 | +0.110 | -0.014 | +0.028 | -0.122 |

## Regressions (worse than the untrained model; whole 95% CI below 0)

- multi_targeted ratio 3 on gsm8k: -0.228 [-0.279, -0.177]
- multi_targeted ratio 3 on gsm_symbolic:main: -0.175 [-0.240, -0.108]
- multi_matched_control ratio 3 on gsm8k: -0.204 [-0.257, -0.153]
- multi_matched_control ratio 3 on gsm_symbolic:main: -0.147 [-0.215, -0.080]

## Warnings

- comparison arms come from paper run 80b37628b193 (code ebfb143); this run used code 21439f9: training and evaluation settings are identical (checked when the run was created)

## Provenance

git 21439f9acfe4395bf6b34b4f227146559ffc6a88 (dirty: False) · model revision c1899de289a04d12100db370d81485cdf75e47ca · precision {'train_load_in_4bit': True, 'eval_load_in_4bit': False, 'bitsandbytes_cuda': True} · Windows-10-10.0.26200-SP0 · GPU NVIDIA GeForce RTX 4060 Laptop GPU
