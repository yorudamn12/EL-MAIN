// Plain-words reasons why each paper run's accuracy moved, per training arm.
// Source: docs/RUNNING.md §10-15 and docs/weakness.md (GPU-verified paper runs). Numbers quoted here are the
// docs' numbers; the live accuracy and change per arm are shown next to them from the API.
// Interpretation for the paper is the team's (PLAN.md open question 10) — keep wording to what the docs state.

export interface ArmNote {
  /** what happened, one line */
  summary: string;
  /** why, in plain words */
  why: string[];
}

export interface RunNotes {
  source: string;
  /** why this target was chosen */
  target: string;
  /** shared reason real-problem accuracy fell for every trained arm */
  realProblems: string;
  /** targeted vs matched control */
  headline: string;
  /** key = `${arm}` or `${arm}:${ratio}` (ratio only where one arm ran at several ratios) */
  arms: Record<string, ArmNote>;
}

const STYLE_COST =
  "Fine-tuned models write answers about 2.4× shorter (≈300 vs ≈750 characters, measured on Qwen3-0.6B). They copy the terse style of the " +
  "training solutions and lose part of their own step-by-step reasoning. Dev-set tests (RUNNING.md §10) showed this is " +
  "not a learning-rate problem and not caused by the synthetic data, since real-only training regresses just as much.";

export const RUN_NOTES: Record<string, RunNotes> = {
  // paper-qwen3-0.6b
  "80b37628b193": {
    source: "docs/RUNNING.md §14 and docs/weakness.md (Qwen3-0.6B)",
    target:
      "The diagnosis found many-step problems to be the biggest weakness: accuracy falls from 73% at 2 steps to 14% at 6–7 " +
      "steps, and every extra step roughly halves the odds of a right answer (effect 2.99). Target: problems with more than 4 steps.",
    realProblems:
      "All trained arms lose about 0.16–0.24 on real problems (GSM8K and GSM-Symbolic). " + STYLE_COST,
    headline:
      "Targeted vs matched control on real problems: no difference (GSM8K −0.012, 95% CI −0.039 to +0.014, p 0.39; " +
      "GSM-Symbolic −0.002, p 0.93). Targeting did not beat an equally hard set that is hard for a different reason.",
    arms: {
      real_only: {
        summary: "Worse on everything: GSM8K −0.20, probes −0.13 and −0.10; long problems 0.18 → 0.09.",
        why: [
          "It contains no generated problems, so nothing in it teaches the long, many-operation problems the probes test.",
          "The GSM8K fall is the solution-style cost: " + STYLE_COST,
          "The docs record that real-only training also lowers the probes, but do not give a further cause.",
        ],
      },
      untargeted: {
        summary: "Big gain on probes (+0.58 and +0.41; long problems 0.18 → 0.71), GSM8K −0.21.",
        why: [
          "The generated problems cover many problem types, and the model learned multiplication and division much more than any other arm (effect change −0.9 to −1.8). Long problems contain those operations too, so broad data helped them most.",
          "The probes are made by code like the training data, so part of the gain may be learning their format, not only the skill (RUNNING.md §13).",
          "GSM8K falls for the shared style reason above.",
        ],
      },
      matched_control: {
        summary: "Big gain on probes (+0.52 and +0.41; long problems 0.65), GSM8K −0.21.",
        why: [
          "It is as hard as the targeted set but hard for a different reason, so it trains the model on multiplication and division heavily while the many-steps effect stays (it rose by 0.23).",
          "That broad practice helped long problems about as much as aiming at them did.",
          "GSM8K falls for the shared style reason above.",
        ],
      },
      "targeted:3": {
        summary: "Gain on probes (+0.43 and +0.25; long problems 0.54), but below matched control and untargeted; GSM8K −0.22.",
        why: [
          "It did shrink the target weakness most: the many-steps effect fell by 0.98, against +0.05 for untargeted and +0.23 for matched control.",
          "But it taught far less about multiplication and division (effect change −0.01 and −0.14, against −0.9 to −1.8 for the other arms). Long problems also contain those, so the other arms still scored higher on them: 0.54 vs 0.65 and 0.71.",
          "On held-out probe families it is 0.16 below both of the other arms (CI below 0).",
          "GSM8K is no different from the matched control: the style cost is shared.",
        ],
      },
      "targeted:9": {
        summary: "Better than targeted 3:1 on every probe measure (+0.51 and +0.36; long problems 0.66); GSM8K −0.24.",
        why: [
          "More generated data helps the targeted arm: it improved on every probe measure over the 3:1 version.",
          "It costs a little more on GSM8K (−0.036 against real-only, p 0.054). The docs record this but do not give a cause.",
        ],
      },
    },
  },

  // paper-qwen3-1.7b
  "409305f3e2f2": {
    source: "docs/RUNNING.md §15 and docs/weakness.md (Qwen3-1.7B)",
    target:
      "The diagnosis found the same main weakness as for 0.6B, but weaker: accuracy falls from 89% at 2 steps to 37% at 7 " +
      "steps, and each extra step lowers the odds by about 30% (effect 1.87 vs 2.99). Target: problems with more than 4 steps.",
    realProblems:
      "All trained arms lose about 0.14–0.19 on real problems, a bit less than for 0.6B. " + STYLE_COST,
    headline:
      "Targeted vs matched control on real problems: no difference (GSM8K +0.011, 95% CI −0.017 to +0.039, p 0.42; " +
      "GSM-Symbolic +0.015, p 0.41). Same headline as 0.6B.",
    arms: {
      real_only: {
        summary: "Worse on everything: GSM8K −0.15, probes −0.13 and −0.07; long problems 0.41 → 0.34.",
        why: [
          "It contains no generated problems, so nothing teaches the long, many-operation probe problems.",
          "The GSM8K fall is the solution-style cost: " + STYLE_COST,
        ],
      },
      untargeted: {
        summary: "Big gain on probes (+0.33 and +0.36; long problems 0.41 → 0.89), GSM8K −0.15.",
        why: [
          "Generated problems taught the model the probe-style problems; it is already close to the ceiling (87–97% right), so the arms can hardly be told apart.",
          "GSM8K falls for the shared style reason above.",
        ],
      },
      matched_control: {
        summary: "Big gain on probes (+0.30 and +0.35; long problems 0.87), GSM8K −0.16.",
        why: [
          "Same as untargeted: the generated data taught the probe-style problems and the probes are near the ceiling.",
          "GSM8K falls for the shared style reason above.",
        ],
      },
      "targeted:3": {
        summary: "Gain on probes (+0.32 and +0.30; long problems 0.86), slightly below the others on held-out families; GSM8K −0.15.",
        why: [
          "On the long-problem slice every generated arm lands at 0.86–0.89, so targeting adds nothing measurable there.",
          "It is slightly below matched control and untargeted on held-out families (−0.05, CI just below 0).",
          "With 87–97% of probes right, the statistics that measure each weakness are poorly identified, so the effect-size changes for this model are unreliable (RUNNING.md §15).",
        ],
      },
      "targeted:9": {
        summary: "Similar to targeted 3:1 (+0.32 and +0.32; long problems 0.87); GSM8K −0.16.",
        why: [
          "Probes are near the ceiling for this model (0.87–0.97 for every generated arm).",
          "GSM8K falls for the shared style reason above.",
        ],
      },
    },
  },
};
