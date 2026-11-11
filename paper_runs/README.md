# paper_runs — outputs of the four paper runs (GPU-verified)

These are copies of the small outputs of the four paper runs. They were made on one RTX 4060 laptop GPU
(8 GB) and every number in `paper/main.tex` comes from them. The originals live in `runs/pipelines/<job>/`,
which git ignores.

| Job | Model | Protocol | RUNNING.md |
|---|---|---|---|
| `80b37628b193` | Qwen/Qwen3-0.6B | single weakness (`steps`) | §14 |
| `409305f3e2f2` | Qwen/Qwen3-1.7B | single weakness (`steps`) | §15 |
| `76f2c9af5ea9` | Qwen/Qwen3-0.6B | multi-weakness (5 weaknesses; reuses the 4 arms of `80b37628b193`) | §16–§17 |
| `4e6b61903c00` | Qwen/Qwen3-1.7B | multi-weakness (4 weaknesses; reuses the 4 arms of `409305f3e2f2`) | §18 |

Each folder holds:

- `results.json`, `report.json`, `report.md`: the arm-by-arm results, paired comparisons and bootstrap intervals.
- `diagnosis.json`: the LLTM fit of the base model; `target.json`: the chosen target(s).
- `config.resolved.yaml`: the full resolved config (local paths replaced by `<repo>`).
- `provenance.json`: git commit, package versions, GPU and model revision.
- `evals/<arm>.json`: accuracy of every trained model, per benchmark.
- `responses/<arm>.jsonl.gz`: every answer the model gave (text, correctness, error type, diagnosis, problem features).
- `annotate_errors.csv`: the 150 stratified wrong answers sampled for checking the error labels
  (the multi-weakness folders hold a copy of the reference run's sheet; the labelling result is in `paper/annotation/`).

The LoRA adapters (0.3–1.2 GB per run) and the generated training data are not included. The data can be
rebuilt exactly from the config and seeds by the code generator.
