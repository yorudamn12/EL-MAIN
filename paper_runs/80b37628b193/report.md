# DreamMachine results — paper-qwen3-0.6b

**Mode:** PAPER  ·  **Paper-eligible:** yes  ·  **Complete:** yes

**Model:** `Qwen/Qwen3-0.6B`  ·  **Prompt:** `qwen_boxed`  ·  **Target:** `steps` (threshold 4.0, auto)

## Baseline (untrained model)

| benchmark | accuracy | n |
|---|---|---|
| gsm8k | 0.638 | 1319 |
| gsm_symbolic:main | 0.570 | 500 |
| probes_train_families | 0.384 | 432 |
| probes_heldout_families | 0.324 | 432 |

## Primary result (status: proposed)

_Does aiming at the weakness help beyond difficulty?_ targeted − matched_control

| benchmark | Δ accuracy | 95% CI | p | n | significant |
|---|---|---|---|---|---|
| gsm8k | -0.012 | [-0.039, +0.014] | 0.393 | 300 | no |
| gsm_symbolic:main | -0.002 | [-0.037, +0.032] | 0.934 | 200 | no |

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

## Change in weaknesses (η after − before; negative = hurts less)

| arm | ratio | steps | log10_max | n_mul | n_div | n_carry | n_distractors | has_merge |
|---|---|---|---|---|---|---|---|---|
| real_only | 0 | -0.314 | +0.263 | -0.327 | +0.038 | +0.109 | +0.448 | — |
| untargeted | 3 | +0.049 | +1.818 | -1.761 | -1.508 | -0.085 | -0.888 | — |
| matched_control | 3 | +0.228 | +0.255 | -0.899 | -1.010 | -0.029 | -0.501 | — |
| targeted | 3 | -0.977 | +0.270 | -0.010 | -0.142 | +0.166 | -0.205 | — |
| targeted | 9 | -0.724 | +0.495 | -0.294 | -0.481 | +0.142 | -0.539 | — |

## Error-type shift among wrong answers (after − before)

| arm | ratio | FORMAT_ERROR | ARITHMETIC_SLIP | DISTRACTOR_USE | PLAN_ERROR | UNVERIFIABLE |
|---|---|---|---|---|---|---|
| real_only | 0 | -0.003 | +0.142 | -0.025 | -0.023 | -0.092 |
| untargeted | 3 | -0.004 | +0.123 | -0.018 | +0.003 | -0.105 |
| matched_control | 3 | -0.003 | +0.119 | -0.008 | +0.030 | -0.138 |
| targeted | 3 | -0.004 | +0.104 | -0.031 | +0.049 | -0.118 |
| targeted | 9 | -0.003 | +0.117 | -0.045 | +0.040 | -0.110 |

## Regressions (worse than the untrained model; whole 95% CI below 0)

- real_only ratio 0 on gsm8k: -0.202 [-0.254, -0.150]
- real_only ratio 0 on gsm_symbolic:main: -0.160 [-0.230, -0.090]
- real_only ratio 0 on probes_train_families: -0.126 [-0.205, -0.049]
- real_only ratio 0 on probes_heldout_families: -0.101 [-0.173, -0.030]
- untargeted ratio 3 on gsm8k: -0.213 [-0.266, -0.161]
- untargeted ratio 3 on gsm_symbolic:main: -0.157 [-0.222, -0.093]
- matched_control ratio 3 on gsm8k: -0.212 [-0.264, -0.161]
- matched_control ratio 3 on gsm_symbolic:main: -0.167 [-0.235, -0.100]
- targeted ratio 3 on gsm8k: -0.224 [-0.274, -0.176]
- targeted ratio 3 on gsm_symbolic:main: -0.168 [-0.233, -0.103]
- targeted ratio 9 on gsm8k: -0.238 [-0.288, -0.187]
- targeted ratio 9 on gsm_symbolic:main: -0.193 [-0.265, -0.125]

## Provenance

git ebfb143fc4789e066f0cb03268d40ccebe25612a (dirty: False) · model revision c1899de289a04d12100db370d81485cdf75e47ca · precision {'train_load_in_4bit': True, 'eval_load_in_4bit': False, 'bitsandbytes_cuda': True} · Windows-10-10.0.26200-SP0 · GPU NVIDIA GeForce RTX 4060 Laptop GPU
