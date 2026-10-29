// Typed client for the DreamMachine backend (docs/API_CONTRACT.md, contract 0.2.2).
import { mockRequest } from "./mocks/mock";

export const API_BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? "http://127.0.0.1:8000/api/v1";
export const USE_MOCK: boolean = import.meta.env.VITE_USE_MOCK === "true";

export type JobStatus = "queued" | "running" | "done" | "failed" | "cancelled";
export type StepStatus = "pending" | "running" | "done" | "failed" | "skipped" | "cancelled";
export type Arm = "real_only" | "untargeted" | "matched_control" | "targeted";
export type Feature = "steps" | "log10_max" | "n_mul" | "n_div" | "n_carry" | "n_distractors" | "has_merge";

export interface Page<T> { items: T[]; total: number; limit: number; offset: number }
export interface Step {
  index: number; key: string; stage: string; label: string; status: StepStatus;
  progress: { done: number; total: number; unit: string; fraction: number };
  duration_s: number | null; error: { code: string; message: string } | null;
}
export interface PipelineSummary {
  id: string; name: string; mode: "explore" | "paper"; status: JobStatus; model: string;
  created_at: string; finished_at: string | null;
  progress: { done_steps: number; total_steps: number; fraction: number };
  target: { strategy: string; feature: Feature | null; threshold: number | null } | null;
  paper_eligible: boolean;
}
export interface Pipeline extends PipelineSummary {
  cancel_requested: boolean; eta_s: number | null; current_step: string | null; steps: Step[];
  warnings: string[]; error: { code: string; message: string; step_key: string } | null;
  resolved: { arms: Arm[]; ratios: number[]; seeds: number[]; benchmarks: string[]; prompt_version: string };
}
export interface Model { id: string; display_name: string; params_b: number | null; gated: boolean; notes: string | null; cached: boolean }
export interface FeatureInfo { name: Feature; label: string; description: string }
export interface Meta { features: FeatureInfo[]; arms: { name: string; label: string; description: string }[] }
export interface Health { status: string; version: string; api_version: string }
export interface System {
  gpu: { available: boolean; name: string | null };
  worker: { alive: boolean; current_job_id: string | null; current_step: string | null };
}
export interface Presets {
  explore: { defaults: { benchmarks: string[]; benchmark_limit: number | null; arms: Arm[]; ratio: number; seeds: number[] };
             allowed: { ratio: number[]; seeds: number[]; min_benchmark_limit: number } };
}
export interface Weakness {
  rank: number; feature: Feature; label: string; eta: number; effect: number; significant: boolean;
  ci_low: number | null; ci_high: number | null;
}
export interface Diagnosis {
  probe_accuracy: number; weaknesses: Weakness[];
  target: { feature: Feature | null; significant: boolean } | null;
}
export interface Baseline { model: string; benchmarks: { name: string; n: number; accuracy: number }[] }
export interface Bootstrap { mean_diff: number; ci_low: number; ci_high: number; p_value: number; n: number }
export interface Results {
  complete: boolean; mode: string; paper_eligible: boolean; model: string;
  baseline: Record<string, { accuracy: number; n: number }>;
  arms: { arm: Arm; ratio: number; seeds: number[];
          benchmarks: Record<string, { accuracy_mean: number; n_seeds: number; vs_base: Bootstrap; regression: boolean }> }[];
  comparisons: (Bootstrap & { a: Arm; b: Arm; ratio: number; benchmark: string; significant: boolean })[];
  primary: { status: string; question: string; results: (Bootstrap & { benchmark: string; significant: boolean })[] } | null;
  warnings: string[];
}
export interface CreateExplore {
  mode: "explore"; model: string; name?: string; benchmarks?: string[]; benchmark_limit?: number | null;
  target?: { strategy: "auto" } | { strategy: "feature"; feature: Feature } | { strategy: "untargeted" };
  arms?: Arm[]; ratio?: number; seeds?: number[];
}

export class ApiError extends Error {
  code: string;
  status: number;
  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

async function request<T>(method: string, path: string, body?: unknown): Promise<T> {
  if (USE_MOCK) return mockRequest(method, path, body) as T;
  let res: Response;
  try {
    res = await fetch(API_BASE + path, {
      method,
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("offline", "Cannot reach the backend. Start it with: python -m dreammachine.serve", 0);
  }
  if (!res.ok) {
    const e = await res.json().catch(() => null);
    throw new ApiError(e?.error?.code ?? "http_error", e?.error?.message ?? res.statusText, res.status);
  }
  return res.json() as Promise<T>;
}

export const api = {
  health: () => request<Health>("GET", "/health"),
  system: () => request<System>("GET", "/system"),
  meta: () => request<Meta>("GET", "/meta"),
  models: () => request<Model[]>("GET", "/models"),
  presets: () => request<Presets>("GET", "/presets"),
  pipelines: () => request<Page<PipelineSummary>>("GET", "/pipelines?limit=100"),
  pipeline: (id: string) => request<Pipeline>("GET", `/pipelines/${id}`),
  create: (b: CreateExplore) => request<Pipeline>("POST", "/pipelines", b),
  cancel: (id: string) => request<Pipeline>("POST", `/pipelines/${id}/cancel`),
  resume: (id: string) => request<Pipeline>("POST", `/pipelines/${id}/resume`),
  baseline: (id: string) => request<Baseline>("GET", `/pipelines/${id}/baseline`),
  diagnosis: (id: string) => request<Diagnosis>("GET", `/pipelines/${id}/diagnosis`),
  results: (id: string) => request<Results>("GET", `/pipelines/${id}/results`),
};
