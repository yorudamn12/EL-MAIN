# Check of the automatic error labels (paper §5.5)

`error_label_check.csv` has one row for each of the 300 sampled wrong answers: rows 0–149 come from the 0.6B
diagnosis sheet and rows 150–299 from the 1.7B sheet.

| Column | Meaning |
|---|---|
| `uid` | `<model>-<row>`; the row is the row number in `paper_runs/<job>/annotate_errors.csv`, which also has the question and the full response |
| `job`, `example_id`, `sample`, `gold` | as in the source sheet |
| `classifier_label` | the label from `dreammachine/diagnosis/taxonomy.py::classify` |
| `llm_label`, `llm_note` | the independent label and a short reason |
| `boxed_equals_gold` | 1 if the final `\boxed{}` value equals the gold answer, i.e. the answer is actually correct (answer-reading fault, see `docs/RUNNING.md` §19) |

**Annotator:** Claude Opus 5.5 (Anthropic), an LLM, not a human. The 300 answers were split into 6 batches of 50, and
each batch was labelled in a separate session. The annotator saw only the question, the gold answer and the response;
it never saw the classifier's label. It was given these rules, applied in this order (the first one that fits wins):

1. FORMAT_ERROR: no final numeric answer can be read (missing, cut off, not a number), or the response's own last
   calculation equals the gold answer but it reports something else.
2. ARITHMETIC_SLIP: at least one explicitly written calculation is false (checked exactly, with Python). Rounded
   decimals are not counted as slips.
3. UNVERIFIABLE: the response writes no explicit calculation that could be checked.
4. DISTRACTOR_USE: the arithmetic is correct, but a calculation uses a number from the question that is irrelevant
   to what is asked.
5. PLAN_ERROR: the arithmetic is correct and no distractor is used, but the plan is wrong (wrong operation, wrong
   order, a misread, skipped or repeated step).

To recompute κ:

```python
import csv
from dreammachine.diagnosis import cohen_kappa
rows = list(csv.DictReader(open("paper/annotation/error_label_check.csv", encoding="utf-8")))
print(cohen_kappa([r["classifier_label"] for r in rows], [r["llm_label"] for r in rows]))  # 0.331
```
