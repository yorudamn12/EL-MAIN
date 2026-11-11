# DreamMachine results — paper-qwen3-1.7b

**Mode:** PAPER  ·  **Paper-eligible:** yes  ·  **Complete:** yes

**Model:** `Qwen/Qwen3-1.7B`  ·  **Prompt:** `qwen_boxed`  ·  **Target:** `steps` (threshold 4.0, auto)

## Baseline (untrained model)

| benchmark | accuracy | n |
|---|---|---|
| gsm8k | 0.815 | 660 |
| gsm_symbolic:main | 0.773 | 300 |
| probes_train_families | 0.625 | 216 |
| probes_heldout_families | 0.583 | 216 |

## Primary result (status: proposed)

_Does aiming at the weakness help beyond difficulty?_ targeted − matched_control

| benchmark | Δ accuracy | 95% CI | p | n | significant |
|---|---|---|---|---|---|
| gsm8k | +0.011 | [-0.017, +0.039] | 0.424 | 300 | no |
| gsm_symbolic:main | +0.015 | [-0.020, +0.050] | 0.409 | 200 | no |

## Before vs after (each arm vs the untrained model)

| arm | ratio | benchmark | accuracy (mean ± sd) | seeds | Δ vs base | 95% CI | regression |
|---|---|---|---|---|---|---|---|
| real_only | 0 | gsm8k | 0.666 ± 0.007 | 3 | -0.148 | [-0.192, -0.102] | **yes** |
| real_only | 0 | gsm_symbolic:main | 0.625 ± 0.028 | 3 | -0.135 | [-0.198, -0.072] | **yes** |
| real_only | 0 | probes_train_families | 0.514 ± 0.059 | 3 | -0.131 | [-0.215, -0.047] | **yes** |
| real_only | 0 | probes_heldout_families | 0.499 ± 0.015 | 3 | -0.072 | [-0.151, +0.002] | no |
| untargeted | 3 | gsm8k | 0.660 ± 0.006 | 3 | -0.153 | [-0.197, -0.109] | **yes** |
| untargeted | 3 | gsm_symbolic:main | 0.600 ± 0.035 | 3 | -0.160 | [-0.222, -0.100] | **yes** |
| untargeted | 3 | probes_train_families | 0.973 ± 0.011 | 3 | +0.328 | [+0.244, +0.410] | no |
| untargeted | 3 | probes_heldout_families | 0.926 ± 0.007 | 3 | +0.356 | [+0.274, +0.437] | no |
| matched_control | 3 | gsm8k | 0.652 ± 0.010 | 3 | -0.161 | [-0.208, -0.116] | **yes** |
| matched_control | 3 | gsm_symbolic:main | 0.578 ± 0.008 | 3 | -0.182 | [-0.243, -0.120] | **yes** |
| matched_control | 3 | probes_train_families | 0.946 ± 0.015 | 3 | +0.301 | [+0.217, +0.385] | no |
| matched_control | 3 | probes_heldout_families | 0.919 ± 0.013 | 3 | +0.348 | [+0.267, +0.430] | no |
| targeted | 3 | gsm8k | 0.663 ± 0.029 | 3 | -0.150 | [-0.196, -0.104] | **yes** |
| targeted | 3 | gsm_symbolic:main | 0.593 ± 0.023 | 3 | -0.167 | [-0.227, -0.105] | **yes** |
| targeted | 3 | probes_train_families | 0.963 ± 0.007 | 3 | +0.319 | [+0.237, +0.400] | no |
| targeted | 3 | probes_heldout_families | 0.872 ± 0.038 | 3 | +0.301 | [+0.212, +0.388] | no |
| targeted | 9 | gsm8k | 0.656 ± 0.007 | 3 | -0.158 | [-0.204, -0.111] | **yes** |
| targeted | 9 | gsm_symbolic:main | 0.568 ± 0.039 | 3 | -0.192 | [-0.252, -0.133] | **yes** |
| targeted | 9 | probes_train_families | 0.963 ± 0.007 | 3 | +0.319 | [+0.237, +0.400] | no |
| targeted | 9 | probes_heldout_families | 0.894 ± 0.035 | 3 | +0.323 | [+0.240, +0.405] | no |

## Arm vs arm (paired, item-level bootstrap)

| comparison | ratio | benchmark | Δ accuracy | 95% CI | p | significant |
|---|---|---|---|---|---|---|
| targeted − matched_control | 3 | gsm8k | +0.011 | [-0.017, +0.039] | 0.424 | no |
| targeted − matched_control | 3 | gsm_symbolic:main | +0.015 | [-0.020, +0.050] | 0.409 | no |
| targeted − matched_control | 3 | probes_train_families | +0.017 | [-0.010, +0.049] | 0.238 | no |
| targeted − matched_control | 3 | probes_heldout_families | -0.047 | [-0.094, -0.000] | 0.042 | yes |
| targeted − untargeted | 3 | gsm8k | +0.003 | [-0.026, +0.032] | 0.824 | no |
| targeted − untargeted | 3 | gsm_symbolic:main | -0.007 | [-0.043, +0.030] | 0.717 | no |
| targeted − untargeted | 3 | probes_train_families | -0.010 | [-0.030, +0.007] | 0.340 | no |
| targeted − untargeted | 3 | probes_heldout_families | -0.054 | [-0.091, -0.020] | 0.001 | yes |
| matched_control − untargeted | 3 | gsm8k | -0.008 | [-0.036, +0.020] | 0.563 | no |
| matched_control − untargeted | 3 | gsm_symbolic:main | -0.022 | [-0.057, +0.013] | 0.228 | no |
| matched_control − untargeted | 3 | probes_train_families | -0.027 | [-0.057, -0.002] | 0.021 | yes |
| matched_control − untargeted | 3 | probes_heldout_families | -0.007 | [-0.042, +0.025] | 0.666 | no |
| targeted − real_only | 3 | gsm8k | -0.002 | [-0.036, +0.031] | 0.903 | no |
| targeted − real_only | 3 | gsm_symbolic:main | -0.032 | [-0.070, +0.007] | 0.092 | no |
| targeted − real_only | 3 | probes_train_families | +0.449 | [+0.378, +0.523] | 0.000 | yes |
| targeted − real_only | 3 | probes_heldout_families | +0.373 | [+0.301, +0.447] | 0.000 | yes |
| targeted − real_only | 9 | gsm8k | -0.010 | [-0.047, +0.027] | 0.582 | no |
| targeted − real_only | 9 | gsm_symbolic:main | -0.057 | [-0.102, -0.013] | 0.009 | yes |
| targeted − real_only | 9 | probes_train_families | +0.449 | [+0.380, +0.521] | 0.000 | yes |
| targeted − real_only | 9 | probes_heldout_families | +0.395 | [+0.319, +0.469] | 0.000 | yes |

## Change in weaknesses (η after − before; negative = hurts less)

| arm | ratio | steps | log10_max | n_mul | n_div | n_carry | n_distractors | has_merge |
|---|---|---|---|---|---|---|---|---|
| real_only | 0 | -0.162 | +0.069 | -0.008 | -0.128 | +0.000 | +0.361 | — |
| untargeted | 3 | -1.172 | +4.382 | -4.005 | +2.313 | +0.773 | -2.000 | — |
| matched_control | 3 | +0.585 | +0.869 | -1.013 | -1.013 | -0.201 | +0.209 | — |
| targeted | 3 | -0.791 | +1.067 | -0.271 | +0.370 | +0.324 | -0.785 | — |
| targeted | 9 | -0.378 | +0.635 | -2.545 | +0.144 | +0.198 | -0.835 | — |

## Error-type shift among wrong answers (after − before)

| arm | ratio | FORMAT_ERROR | ARITHMETIC_SLIP | DISTRACTOR_USE | PLAN_ERROR | UNVERIFIABLE |
|---|---|---|---|---|---|---|
| real_only | 0 | -0.019 | +0.067 | +0.112 | -0.106 | -0.053 |
| untargeted | 3 | -0.018 | +0.115 | +0.170 | -0.196 | -0.071 |
| matched_control | 3 | -0.016 | +0.107 | +0.171 | -0.174 | -0.088 |
| targeted | 3 | -0.019 | +0.102 | +0.176 | -0.188 | -0.071 |
| targeted | 9 | -0.019 | +0.105 | +0.171 | -0.147 | -0.110 |

## Regressions (worse than the untrained model; whole 95% CI below 0)

- real_only ratio 0 on gsm8k: -0.148 [-0.192, -0.102]
- real_only ratio 0 on gsm_symbolic:main: -0.135 [-0.198, -0.072]
- real_only ratio 0 on probes_train_families: -0.131 [-0.215, -0.047]
- untargeted ratio 3 on gsm8k: -0.153 [-0.197, -0.109]
- untargeted ratio 3 on gsm_symbolic:main: -0.160 [-0.222, -0.100]
- matched_control ratio 3 on gsm8k: -0.161 [-0.208, -0.116]
- matched_control ratio 3 on gsm_symbolic:main: -0.182 [-0.243, -0.120]
- targeted ratio 3 on gsm8k: -0.150 [-0.196, -0.104]
- targeted ratio 3 on gsm_symbolic:main: -0.167 [-0.227, -0.105]
- targeted ratio 9 on gsm8k: -0.158 [-0.204, -0.111]
- targeted ratio 9 on gsm_symbolic:main: -0.192 [-0.252, -0.133]

## Provenance

git d49128d406ede5f3236d1cc4af98696f7da46b9b (dirty: False) · model revision 70d244cc86ccca08cf5af4e1e306ecf908b1ad5e · precision {'train_load_in_4bit': True, 'eval_load_in_4bit': False, 'bitsandbytes_cuda': True} · Windows-10-10.0.26200-SP0 · GPU NVIDIA GeForce RTX 4060 Laptop GPU
