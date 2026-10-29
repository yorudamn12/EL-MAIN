// Fixtures for VITE_USE_MOCK=true. Shapes follow docs/API_CONTRACT.md §6; the numbers are MADE UP.
// One pipeline created in mock mode moves through its steps over ~1 minute.
import type { Pipeline, Step } from "../api";

const STEP_KEYS = [
  ["preflight", "preflight", "Check setup"], ["baseline", "baseline", "Benchmark the base model"],
  ["diagnose", "diagnose", "Find weaknesses"], ["choose_target", "choose_target", "Choose target"],
  ["build_data", "build_data", "Build training data"], ["train:targeted_r3_s0", "train", "Train: targeted"],
  ["evaluate:targeted_r3_s0", "evaluate", "Evaluate: targeted"], ["compare", "compare", "Compare arms"],
] as const;
const STEP_SECONDS = 8;

const created: { id: string; name: string; model: string; t0: number }[] = [];

function build(c: { id: string; name: string; model: string; t0: number }): Pipeline {
  const done = Math.min(STEP_KEYS.length, Math.floor((Date.now() - c.t0) / 1000 / STEP_SECONDS));
  const finished = done >= STEP_KEYS.length;
  const steps: Step[] = STEP_KEYS.map(([key, stage, label], index) => {
    const status = index < done ? "done" : index === done ? "running" : "pending";
    const frac = status === "done" ? 1 : status === "running" ? (((Date.now() - c.t0) / 1000) % STEP_SECONDS) / STEP_SECONDS : 0;
    return { index, key, stage, label, status, progress: { done: Math.round(frac * 100), total: 100, unit: "items", fraction: frac },
             duration_s: status === "done" ? STEP_SECONDS : null, error: null };
  });
  return {
    id: c.id, name: c.name, mode: "explore", status: finished ? "done" : "running", model: c.model,
    created_at: new Date(c.t0).toISOString(), finished_at: finished ? new Date().toISOString() : null,
    progress: { done_steps: done, total_steps: STEP_KEYS.length, fraction: done / STEP_KEYS.length },
    target: done > 3 ? { strategy: "auto", feature: "n_carry", threshold: 1 } : null, paper_eligible: false,
    cancel_requested: false, eta_s: finished ? null : (STEP_KEYS.length - done) * STEP_SECONDS,
    current_step: finished ? null : STEP_KEYS[done][0], steps, warnings: [], error: null,
    resolved: { arms: ["targeted"], ratios: [3], seeds: [0], benchmarks: ["gsm8k"], prompt_version: "qwen_boxed" },
  };
}

const SEED: Pipeline = {
  ...build({ id: "000000000001", name: "example-run", model: "Qwen/Qwen3-0.6B", t0: 0 }),
  status: "done", finished_at: "2026-10-05T12:00:00Z", created_at: "2026-10-05T10:00:00Z",
};

const diagnosis = {
  probe_accuracy: 0.52,
  weaknesses: [
    { rank: 1, feature: "n_carry", label: "Carries and borrows", eta: 0.42, effect: 1.26, significant: true, ci_low: 0.3, ci_high: 0.55 },
    { rank: 2, feature: "steps", label: "Number of steps", eta: 0.2, effect: 0.6, significant: true, ci_low: 0.1, ci_high: 0.3 },
    { rank: 3, feature: "n_distractors", label: "Distractor numbers", eta: 0.05, effect: 0.1, significant: false, ci_low: -0.05, ci_high: 0.15 },
  ],
  target: { feature: "n_carry", significant: true },
};
const ci = { mean_diff: 0.03, ci_low: 0.004, ci_high: 0.057, p_value: 0.02, n: 300 };
const results = {
  complete: true, mode: "explore", paper_eligible: false, model: "Qwen/Qwen3-0.6B",
  baseline: { gsm8k: { accuracy: 0.41, n: 300 } },
  arms: [
    { arm: "targeted", ratio: 3, seeds: [0], benchmarks: { gsm8k: { accuracy_mean: 0.44, n_seeds: 1, vs_base: ci, regression: false } } },
    { arm: "matched_control", ratio: 3, seeds: [0], benchmarks: { gsm8k: { accuracy_mean: 0.43, n_seeds: 1, vs_base: { ...ci, mean_diff: 0.02, ci_low: -0.01 }, regression: false } } },
  ],
  comparisons: [{ a: "targeted", b: "matched_control", ratio: 3, benchmark: "gsm8k", mean_diff: 0.01, ci_low: -0.02, ci_high: 0.04, p_value: 0.48, n: 300, significant: false }],
  primary: { status: "proposed", question: "Does aiming at the weakness help beyond difficulty?",
             results: [{ benchmark: "gsm8k", mean_diff: 0.01, ci_low: -0.02, ci_high: 0.04, p_value: 0.48, n: 300, significant: false }] },
  warnings: [],
};

export function mockRequest(method: string, path: string, body?: unknown): unknown {
  const p = path.split("?")[0];
  if (p === "/health") return { status: "ok", version: "mock", api_version: "0.2.2" };
  if (p === "/system") return { gpu: { available: false, name: null }, worker: { alive: true, current_job_id: null, current_step: null } };
  if (p === "/models") return [
    { id: "Qwen/Qwen3-0.6B", display_name: "Qwen3 0.6B", params_b: 0.6, gated: false, notes: null, cached: true },
    { id: "Qwen/Qwen3-1.7B", display_name: "Qwen3 1.7B", params_b: 1.7, gated: false, notes: null, cached: true },
    { id: "Qwen/Qwen2.5-1.5B-Instruct", display_name: "Qwen2.5 1.5B Instruct", params_b: 1.5, gated: false, notes: null, cached: false }];
  if (p === "/meta") return {
    features: diagnosis.weaknesses.map((w) => ({ name: w.feature, label: w.label, description: "" })),
    arms: [] };
  if (p === "/presets") return { explore: {
    defaults: { benchmarks: ["gsm8k"], benchmark_limit: 300, arms: ["targeted", "matched_control"], ratio: 3, seeds: [0] },
    allowed: { ratio: [1, 3, 9], seeds: [0, 1, 2], min_benchmark_limit: 10 } } };
  if (p === "/pipelines" && method === "POST") {
    const b = body as { name?: string; model: string };
    const c = { id: Math.random().toString(16).slice(2, 14).padEnd(12, "0"), name: b.name || "mock-run", model: b.model, t0: Date.now() };
    created.unshift(c);
    return build(c);
  }
  if (p === "/pipelines") {
    const items = [...created.map(build), SEED];
    return { items, total: items.length, limit: 100, offset: 0 };
  }
  const m = p.match(/^\/pipelines\/(\w+)(?:\/(\w+))?$/);
  if (m) {
    const c = created.find((x) => x.id === m[1]);
    const pipe = c ? build(c) : SEED;
    if (!m[2] || m[2] === "cancel" || m[2] === "resume") return pipe;
    if (m[2] === "baseline") return { model: pipe.model, benchmarks: [{ name: "gsm8k", n: 300, accuracy: 0.41 }] };
    if (m[2] === "diagnosis") return diagnosis;
    if (m[2] === "results") return results;
  }
  throw new Error(`mock: no fixture for ${method} ${path}`);
}
