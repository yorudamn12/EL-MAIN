import { useCallback, useEffect, useState } from "react";
import "./App.css";
import {
  api, USE_MOCK,
  type Arm, type Baseline, type Diagnosis, type Feature, type Health, type Meta, type Model,
  type Pipeline, type PipelineSummary, type Presets, type Results, type System,
} from "./api";

type Tab = "Overview" | "Experiments" | "Diagnosis" | "Results";

const tabs: Tab[] = [
  "Overview",
  "Experiments",
  "Diagnosis",
  "Results",
];

const ARM_LABEL: Record<string, string> = {
  real_only: "Real only", untargeted: "Untargeted", matched_control: "Matched control", targeted: "Targeted",
};
const ARM_ICON: Record<string, string> = { targeted: "✦", matched_control: "◉", untargeted: "✳", real_only: "○" };
const ARM_PILL: Record<string, string> = {
  targeted: "targeted", matched_control: "control", untargeted: "untargeted", real_only: "untargeted",
};
const BENCH_LABEL: Record<string, string> = {
  gsm8k: "GSM8K", "gsm_symbolic:main": "GSM-Symbolic",
  probes_train_families: "Probes · train", probes_heldout_families: "Probes · held-out",
};
const benchLabel = (b: string) => BENCH_LABEL[b] ?? b.replace(/_/g, " ");
const RESEARCH_MODELS = ["Qwen/Qwen3-0.6B", "Qwen/Qwen3-1.7B"];
const pct = (x: number | null | undefined, d = 1) => (x == null ? "—" : `${(x * 100).toFixed(d)}%`);
const signed = (x: number) => `${x >= 0 ? "+" : ""}${(x * 100).toFixed(1)} pts`;
const errText = (e: unknown) => (e instanceof Error ? e.message : String(e));

function useAsync<T>(fn: (() => Promise<T>) | null, deps: unknown[]) {
  const [state, set] = useState<{ data: T | null; error: string }>({ data: null, error: "" });
  useEffect(() => {
    let live = true;
    if (!fn) { set({ data: null, error: "" }); return; }
    fn().then((data) => live && set({ data, error: "" }), (e) => live && set({ data: null, error: errText(e) }));
    return () => { live = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return state;
}

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [showNotes, setShowNotes] = useState(false);
  const [notice, setNotice] = useState("");
  const [health, setHealth] = useState<Health | null>(null);
  const [system, setSystem] = useState<System | null>(null);
  const [offline, setOffline] = useState("");
  const [list, setList] = useState<PipelineSummary[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [targetFeature, setTargetFeature] = useState<Feature | "">("");

  const models = useAsync<Model[]>(() => api.models(), []);
  const presets = useAsync<Presets>(() => api.presets(), []);
  const meta = useAsync<Meta>(() => api.meta(), []);

  const refresh = useCallback(async () => {
    try {
      const [h, s, l] = await Promise.all([api.health(), api.system(), api.pipelines()]);
      setHealth(h); setSystem(s); setList(l.items); setOffline("");
    } catch (e) { setOffline(errText(e)); }
  }, []);
  useEffect(() => {
    void refresh();
    const t = window.setInterval(() => void refresh(), 3000);
    return () => window.clearInterval(t);
  }, [refresh]);

  // default selection: newest finished pipeline, else newest
  useEffect(() => {
    if (!selectedId && list.length) setSelectedId((list.find((p) => p.status === "done") ?? list[0]).id);
  }, [list, selectedId]);

  // poll the selected pipeline every 2 s while it is active
  const active = pipeline?.status === "queued" || pipeline?.status === "running";
  useEffect(() => {
    if (!selectedId) { setPipeline(null); return; }
    let live = true;
    const load = () => api.pipeline(selectedId).then((p) => live && setPipeline(p), () => undefined);
    void load();
    const t = active ? window.setInterval(load, 2000) : undefined;
    return () => { live = false; if (t) window.clearInterval(t); };
  }, [selectedId, active]);

  function select(id: string, tab?: Tab) {
    setSelectedId(id);
    if (tab) setActiveTab(tab);
  }

  function openExperiment() {
    setActiveTab("Experiments");
    setNotice("Configure your next experiment below.");
  }

  const doneCount = list.filter((p) => p.status === "done").length;
  const workerLabel = offline ? "Backend offline" : system?.worker.alive ? "Worker running" : "Worker not running";

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark">
            <span />
            <span />
            <span />
          </div>
          <div>
            <div className="brand-name">DreamMachine</div>
            <div className="brand-caption">RESEARCH LAB</div>
          </div>
        </div>

        <div className="workspace-label">WORKSPACE</div>

        <nav className="navigation">
          {tabs.map((tab, index) => (
            <button
              key={tab}
              className={`nav-item ${activeTab === tab ? "active" : ""}`}
              onClick={() => {
                setActiveTab(tab);
                setNotice("");
              }}
            >
              <span className="nav-icon">
                {["◉", "✦", "⌘", "↗"][index]}
              </span>
              <span>{tab}</span>
              {activeTab === tab && <span className="nav-indicator" />}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <div className="status-card">
            <span className="status-dot" />
            <div>
              <div className="status-title">Research environment</div>
              <div className="status-subtitle">{USE_MOCK ? "Mock data mode" : workerLabel}</div>
            </div>
          </div>

          <div className="profile">
            <div className="avatar">DM</div>
            <div>
              <div className="profile-name">Researcher</div>
              <div className="profile-role">Personal workspace</div>
            </div>
            <span className="profile-menu">···</span>
          </div>
        </div>
      </aside>

      <main className="main-area">
        <header className="topbar">
          <div className="breadcrumb">
            <span>Workspace</span>
            <span className="breadcrumb-divider">/</span>
            <strong>{activeTab}</strong>
          </div>
          <div className="topbar-right">
            <span className="live-indicator">
              <span className="status-dot" />{" "}
              {USE_MOCK ? "MOCK DATA" : offline ? "BACKEND OFFLINE" : `LIVE · API ${health?.api_version ?? ""}`}
            </span>
            <button
              className="icon-button"
              title="Show research notes"
              onClick={() => setShowNotes((value) => !value)}
            >
              ?
            </button>
          </div>
        </header>

        <div className="page-content">
          {offline && !USE_MOCK && (
            <div className="notice"><span>✳</span> {offline}</div>
          )}
          {notice && (
            <div className="notice">
              <span>✳</span> {notice}
              <button onClick={() => setNotice("")}>×</button>
            </div>
          )}

          {activeTab === "Overview" && (
            <>
              <section className="welcome-section">
                <div>
                  <div className="eyebrow">
                    <span className="eyebrow-line" />
                    YOUR RESEARCH, IN MOTION
                  </div>
                  <h1>Ideas into <em>intelligence.</em></h1>
                  <p className="welcome-description">
                    Observe model behaviour, investigate weaknesses, and
                    design experiments that move your research forward.
                  </p>
                </div>
                <div className="welcome-date">
                  <span className="date-dot" />
                  RESEARCH OVERVIEW
                </div>
              </section>

              <section className="hero-card">
                <div className="hero-copy">
                  <div className="hero-kicker">THE LEARNING ENGINE</div>
                  <h2>Every model has<br />a story to <em>tell.</em></h2>
                  <p>
                    Follow the signals beneath the surface. Find what works,
                    understand what fails, and turn your next hypothesis
                    into a measurable experiment.
                  </p>
                  <button className="primary-button" onClick={openExperiment}>
                    Design an experiment <span>↗</span>
                  </button>
                  <div className="hero-footnote">
                    <span className="status-dot" /> READY FOR EXPLORATION
                  </div>
                </div>

                <div className="orbit-scene" aria-label="Animated model visualization">
                  <div className="orbit orbit-one" />
                  <div className="orbit orbit-two" />
                  <div className="orbit orbit-three" />
                  <div className="orbit-core">
                    <div className="core-inner">D</div>
                  </div>
                  <span className="orbit-particle particle-one" />
                  <span className="orbit-particle particle-two" />
                  <span className="orbit-particle particle-three" />
                  <span className="orbit-particle particle-four" />
                  <div className="orbit-label label-top">LEARNING</div>
                  <div className="orbit-label label-bottom">NEURAL SYSTEMS · 01</div>
                </div>
              </section>

              <section className="section-heading">
                <div>
                  <div className="eyebrow">AT A GLANCE</div>
                  <h2>Research pulse</h2>
                </div>
                <span className="section-meta">{USE_MOCK ? "MOCK DATA" : "LIVE FROM BACKEND"}</span>
              </section>

              <section className="metrics-grid">
                <MetricCard
                  label="Experiments"
                  value={String(list.length).padStart(2, "0")}
                  detail={`${doneCount} finished`}
                  icon="✦"
                  color="orange"
                />
                <MetricCard
                  label="GPU"
                  value={system?.gpu.available ? "Ready" : "None"}
                  detail={system?.gpu.name ?? "No CUDA device reported"}
                  icon="↗"
                  color="green"
                />
                <MetricCard
                  label="Worker"
                  value={offline ? "Offline" : system?.worker.alive ? "Alive" : "Stopped"}
                  detail={system?.worker.current_step ?? workerLabel}
                  icon="◉"
                  color="red"
                />
              </section>

              <section className="bottom-grid">
                <div className="panel activity-panel">
                  <div className="panel-heading">
                    <div>
                      <div className="eyebrow">LATEST ACTIVITY</div>
                      <h3>Recent experiments</h3>
                    </div>
                    <button className="text-button" onClick={() => setActiveTab("Experiments")}>
                      View all ↗
                    </button>
                  </div>
                  <ExperimentTable rows={list.slice(0, 3)} onSelect={(id) => select(id, "Results")} />
                </div>

                <div className="panel insight-panel">
                  <div className="insight-icon">✳</div>
                  <div className="eyebrow">RESEARCH NOTE · 001</div>
                  <h3>Curiosity is a method.</h3>
                  <p>
                    A useful experiment doesn't just improve a score.
                    It tells you why a model behaves the way it does.
                  </p>
                  <button className="text-button" onClick={() => setActiveTab("Diagnosis")}>
                    Investigate weaknesses ↗
                  </button>
                </div>
              </section>
            </>
          )}

          {activeTab === "Experiments" && (
            <>
              <PageIntro
                eyebrow="LABORATORY / 01"
                title={<>Design the <em>unknown.</em></>}
                description="Start a real explore pipeline: baseline, diagnosis, targeted data, QLoRA training and re-test. Explore runs are not paper evidence."
              />

              <section className="experiment-layout">
                <NewExperiment
                  models={models.data ?? []} presets={presets.data} meta={meta.data}
                  presetFeature={targetFeature} disabled={!!offline}
                  onCreated={(p) => { setNotice(`Queued ${p.name}.`); select(p.id); void refresh(); }}
                  onError={setNotice}
                />

                <div className="experiment-side">
                  <PipelinePanel pipeline={pipeline} onChanged={(p) => { setPipeline(p); void refresh(); }} onError={setNotice} />

                  <div className="panel principle-panel">
                    <span className="principle-star">✳</span>
                    <div className="eyebrow">EXPERIMENTAL PRINCIPLE</div>
                    <h3>Change one variable at a time.</h3>
                    <p>Clear comparisons make results easier to interpret.</p>
                  </div>
                </div>
              </section>

              <section className="panel table-panel">
                <div className="panel-heading">
                  <div><div className="eyebrow">HISTORY</div><h3>Experiment log</h3></div>
                  <span className="section-meta">{list.length} RUNS</span>
                </div>
                <ExperimentTable rows={list} onSelect={(id) => select(id)} selectedId={selectedId} />
              </section>
            </>
          )}

          {activeTab === "Diagnosis" && (
            <DiagnosisTab pipeline={pipeline} onBuild={(f) => { setTargetFeature(f); openExperiment(); }} />
          )}

          {activeTab === "Results" && (
            <ResultsTab
              pipeline={pipeline} list={list} onSelect={select}
              showNotes={showNotes} toggleNotes={() => setShowNotes((v) => !v)}
              onNew={() => setActiveTab("Experiments")}
            />
          )}
        </div>

        <footer className="footer">
          <span>DreamMachine <span className="footer-separator">/</span> Research Lab</span>
          <span>CONTRACT V{health?.api_version ?? "0.2.2"} <span className="footer-separator">·</span> {USE_MOCK ? "MOCK ENVIRONMENT" : "LIVE BACKEND"}</span>
        </footer>
      </main>
    </div>
  );
}

function NewExperiment({ models, presets, meta, presetFeature, disabled, onCreated, onError }: {
  models: Model[]; presets: Presets | null; meta: Meta | null; presetFeature: Feature | ""; disabled: boolean;
  onCreated: (p: Pipeline) => void; onError: (m: string) => void;
}) {
  const d = presets?.explore.defaults;
  const allowed = presets?.explore.allowed;
  const [model, setModel] = useState("");
  const [name, setName] = useState("");
  const [strategy, setStrategy] = useState<"auto" | "feature" | "untargeted">("auto");
  const [feature, setFeature] = useState<Feature | "">("");
  const [arms, setArms] = useState<Arm[] | null>(null);
  const [ratio, setRatio] = useState<number | null>(null);
  const [seeds, setSeeds] = useState<number[] | null>(null);
  const [limit, setLimit] = useState<number | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (presetFeature) { setStrategy("feature"); setFeature(presetFeature); }
  }, [presetFeature]);

  const curModel = model || (models.find((m) => m.cached) ?? models[0])?.id || "";
  const curInfo = models.find((m) => m.id === curModel);
  const curArms = arms ?? d?.arms ?? [];
  const curRatio = ratio ?? d?.ratio ?? 3;
  const curSeeds = seeds ?? d?.seeds ?? [0];
  const curLimit = limit === undefined ? d?.benchmark_limit ?? null : limit;
  const toggle = <T,>(xs: T[], x: T) => (xs.includes(x) ? xs.filter((y) => y !== x) : [...xs, x]);
  const armChoices: Arm[] = strategy === "untargeted" ? ["untargeted", "real_only"] : ["targeted", "matched_control", "untargeted", "real_only"];
  const shownArms = curArms.filter((a) => armChoices.includes(a));
  const targetText = strategy === "feature"
    ? meta?.features.find((f) => f.name === feature)?.label ?? "choose a feature"
    : strategy === "auto" ? "Auto (worst weakness)" : "Untargeted";

  async function launch() {
    setBusy(true);
    try {
      const target = strategy === "feature"
        ? (feature ? { strategy: "feature" as const, feature } : null)
        : { strategy };
      if (!target) throw new Error("Choose which feature to target.");
      const p = await api.create({
        mode: "explore", model: curModel, name: name || undefined, benchmarks: d?.benchmarks,
        benchmark_limit: curLimit, target, arms: shownArms, ratio: curRatio, seeds: curSeeds,
      });
      onCreated(p);
    } catch (e) { onError(errText(e)); } finally { setBusy(false); }
  }

  return (
    <div className="panel experiment-config">
      <div className="panel-heading">
        <div>
          <div className="eyebrow">CONFIGURATION</div>
          <h3>New experiment</h3>
        </div>
        <span className="config-number">01</span>
      </div>

      <label className="field-label" htmlFor="model">MODEL</label>
      <select id="model" className="select-input" value={curModel} onChange={(e) => setModel(e.target.value)}>
        <optgroup label="In your local cache">
          {models.filter((m) => m.cached).map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
        </optgroup>
        <optgroup label="Needs download">
          {models.filter((m) => !m.cached).map((m) => (
            <option key={m.id} value={m.id}>{m.display_name}{m.gated ? " (gated)" : ""}</option>
          ))}
        </optgroup>
      </select>
      {curInfo && (
        <p className={`model-status ${curInfo.cached ? "ready" : "download"}`}>
          {curInfo.cached
            ? "✓ Available locally — runs offline."
            : curInfo.gated
              ? "⬇ Not downloaded. Gated: accept the licence on Hugging Face and run huggingface-cli login first, or the job fails."
              : `⬇ Not downloaded. The worker will fetch it from Hugging Face on first use${curInfo.params_b ? ` (~${(curInfo.params_b * 2).toFixed(1)} GB)` : ""}.`}
        </p>
      )}

      <label className="field-label" htmlFor="exp-name">NAME (OPTIONAL)</label>
      <input id="exp-name" className="select-input" value={name} maxLength={80} onChange={(e) => setName(e.target.value)} />

      <label className="field-label" htmlFor="strategy">TARGET</label>
      <select id="strategy" className="select-input" value={strategy}
        onChange={(e) => setStrategy(e.target.value as typeof strategy)}>
        <option value="auto">Auto — worst significant weakness</option>
        <option value="feature">Pick a feature</option>
        <option value="untargeted">Untargeted</option>
      </select>
      {strategy === "feature" && (
        <select className="select-input" value={feature} onChange={(e) => setFeature(e.target.value as Feature)}>
          <option value="">Select a feature…</option>
          {meta?.features.map((f) => <option key={f.name} value={f.name}>{f.label}</option>)}
        </select>
      )}

      <label className="field-label">TRAINING ARMS</label>
      <div className="arm-options">
        {armChoices.map((a) => (
          <button
            key={a}
            className={`arm-option ${shownArms.includes(a) ? "selected" : ""}`}
            onClick={() => setArms(toggle(shownArms, a))}
          >
            <span className="arm-icon">{ARM_ICON[a]}</span>
            <span className="arm-text">
              <strong>{ARM_LABEL[a]}</strong>
              <small>{meta?.arms.find((x) => x.name === a)?.description ?? ""}</small>
            </span>
            <span className="arm-check">{shownArms.includes(a) ? "✓" : "○"}</span>
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="ratio">SYNTHETIC : REAL RATIO</label>
      <select id="ratio" className="select-input" value={curRatio} onChange={(e) => setRatio(Number(e.target.value))}>
        {(allowed?.ratio ?? [1, 3, 9]).map((r) => <option key={r} value={r}>{r}:1</option>)}
      </select>

      <label className="field-label">SEEDS</label>
      <div className="arm-options">
        {(allowed?.seeds ?? [0, 1, 2]).map((s) => (
          <button
            key={s}
            className={`arm-option ${curSeeds.includes(s) ? "selected" : ""}`}
            onClick={() => { const n = toggle(curSeeds, s); if (n.length) setSeeds(n); }}
          >
            <span className="arm-text"><strong>Seed {s}</strong></span>
            <span className="arm-check">{curSeeds.includes(s) ? "✓" : "○"}</span>
          </button>
        ))}
      </div>

      <label className="field-label" htmlFor="limit">BENCHMARK ITEMS (EMPTY = FULL SETS)</label>
      <input
        id="limit" className="select-input" type="number" min={allowed?.min_benchmark_limit ?? 10}
        value={curLimit ?? ""} onChange={(e) => setLimit(e.target.value === "" ? null : Number(e.target.value))}
      />

      <div className="config-summary">
        <span>Configuration summary</span>
        <div><span>Target</span><strong>{targetText}</strong></div>
        <div><span>Arms</span><strong>{shownArms.length}</strong></div>
        <div><span>Ratio</span><strong>{curRatio}:1</strong></div>
        <div><span>Seeds</span><strong>{curSeeds.join(", ")}</strong></div>
      </div>

      <button
        className="primary-button launch-button" onClick={() => void launch()}
        disabled={busy || disabled || !curModel || !shownArms.length}
      >
        {busy ? "Submitting..." : "Launch experiment"}
        <span>{busy ? "↻" : "↗"}</span>
      </button>
      <p className="disclaimer">Real run on the local GPU worker. Takes from minutes to hours.</p>
    </div>
  );
}

function PipelinePanel({ pipeline, onChanged, onError }: {
  pipeline: Pipeline | null; onChanged: (p: Pipeline) => void; onError: (m: string) => void;
}) {
  const visual = (
    <div className="preview-visual">
      <div className="preview-ring ring-a" />
      <div className="preview-ring ring-b" />
      <div className="preview-center">D</div>
      <span className="preview-node node-a" />
      <span className="preview-node node-b" />
      <span className="preview-node node-c" />
    </div>
  );
  if (!pipeline) {
    return (
      <div className="panel preview-panel">
        <div className="eyebrow">EXPERIMENT PROGRESS</div>
        {visual}
        <h3>No experiment selected</h3>
        <p>Launch an experiment, or pick one from the log below.</p>
      </div>
    );
  }
  const act = (fn: (id: string) => Promise<Pipeline>) => fn(pipeline.id).then(onChanged, (e) => onError(errText(e)));
  const running = pipeline.status === "queued" || pipeline.status === "running";
  return (
    <div className="panel preview-panel">
      <div className="eyebrow">PROGRESS · {pipeline.mode.toUpperCase()}</div>
      {visual}
      <h3>{pipeline.name}</h3>
      <p>
        {pipeline.status.toUpperCase()} · {pipeline.progress.done_steps}/{pipeline.progress.total_steps} steps
        {pipeline.eta_s ? ` · ~${Math.round(pipeline.eta_s / 60)} min left` : ""}
        {pipeline.target?.feature ? ` · target ${pipeline.target.feature}` : ""}
      </p>
      {pipeline.error && <p className="disclaimer">{pipeline.error.code}: {pipeline.error.message}</p>}
      {pipeline.warnings.map((w) => <p key={w} className="disclaimer">{w}</p>)}
      <div className="table-scroll">
        <table className="experiment-table">
          <tbody>
            {pipeline.steps.map((s) => (
              <tr key={s.key}>
                <td><strong>{s.label}</strong><small>{s.key}</small></td>
                <td><span className="table-status"><span />{s.status}</span></td>
                <td className="score-cell">{s.status === "running" ? pct(s.progress.fraction, 0) : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {running && <button className="secondary-button" onClick={() => void act(api.cancel)}>Cancel <span>×</span></button>}
      {(pipeline.status === "failed" || pipeline.status === "cancelled") && (
        <button className="secondary-button" onClick={() => void act(api.resume)}>Resume <span>↗</span></button>
      )}
    </div>
  );
}

function DiagnosisTab({ pipeline, onBuild }: { pipeline: Pipeline | null; onBuild: (f: Feature) => void }) {
  const ready = !!pipeline?.steps.some((s) => s.stage === "diagnose" && (s.status === "done" || s.status === "skipped"));
  const id = pipeline?.id;
  const diag = useAsync<Diagnosis>(ready && id ? () => api.diagnosis(id) : null, [id, ready]);
  const base = useAsync<Baseline>(ready && id ? () => api.baseline(id) : null, [id, ready]);
  const [sel, setSel] = useState<Feature | null>(null);
  const ws = diag.data?.weaknesses ?? [];
  const cur = ws.find((w) => w.feature === sel) ?? ws[0];
  const maxEffect = Math.max(0.001, ...ws.map((w) => Math.abs(w.effect)));

  return (
    <>
      <PageIntro
        eyebrow="ANALYSIS / 02"
        title={<>Find the <em>signal.</em></>}
        description={pipeline ? `Measured weaknesses of ${pipeline.model} from "${pipeline.name}".` : "Select or start an experiment first."}
      />
      {!ready && <div className="note-strip"><span>✳</span><p>Diagnosis is not finished for this experiment yet.</p></div>}
      {ready && diag.error && <div className="note-strip"><span>✳</span><p>{diag.error}</p></div>}

      {diag.data && (
        <section className="diagnosis-layout">
          <div className="panel weakness-panel">
            <div className="eyebrow">WEAKNESS RANKING</div>
            <h3>What needs attention?</h3>
            <p className="panel-description">
              Probe accuracy {pct(diag.data.probe_accuracy)}.
              {base.data && " Baseline: " + base.data.benchmarks.map((b) => `${b.name} ${pct(b.accuracy)}`).join(", ") + "."}
            </p>

            {ws.map((w) => {
              const isTarget = diag.data?.target?.feature === w.feature;
              return (
                <button
                  key={w.feature}
                  className={`weakness-item ${cur?.feature === w.feature ? "selected" : ""} ${w.significant ? "is-significant" : ""}`}
                  onClick={() => setSel(w.feature)}
                >
                  <span className="weakness-number">{String(w.rank).padStart(2, "0")}</span>
                  <span className="weakness-copy">
                    <span className="weakness-head">
                      <strong>{w.label}</strong>
                      {isTarget && <span className="weakness-chip target">TARGET</span>}
                      <span className={`weakness-chip ${w.significant ? "sig" : "nosig"}`}>
                        {w.significant ? "SIGNIFICANT" : "NOT SIGNIFICANT"}
                      </span>
                    </span>
                    <span className="effect-track">
                      <span className="effect-fill" style={{ width: `${Math.max(3, (Math.abs(w.effect) / maxEffect) * 100)}%` }} />
                    </span>
                    <small>Effect {w.effect.toFixed(2)} · η {w.eta.toFixed(2)}</small>
                  </span>
                  <span className="weakness-arrow">↗</span>
                </button>
              );
            })}
          </div>

          {cur && (
            <div className="panel diagnosis-detail">
              <div className="detail-topline">
                <span className="eyebrow">DIAGNOSTIC BRIEF</span>
                <span className="detail-index">
                  {diag.data.target?.feature === cur.feature ? "CHOSEN TARGET" : `RANK ${cur.rank}`}
                </span>
              </div>
              <div className="diagnosis-symbol">⌘</div>
              <h2>{cur.label}</h2>
              <p className="diagnosis-description">
                η = {cur.eta.toFixed(2)}
                {cur.ci_low != null && cur.ci_high != null ? ` (95% CI ${cur.ci_low.toFixed(2)} to ${cur.ci_high.toFixed(2)})` : ""}.
                Each extra unit lowers the log-odds of a correct answer by that much; effect = η × the feature's range.
              </p>

              <div className="detail-divider" />
              <div className="eyebrow">POSSIBLE RESEARCH DIRECTION</div>
              <h3>Compare targeted and matched-control training</h3>
              <p className="panel-description">
                Treat this as a hypothesis to investigate: a real effect must beat the matched control, not just the baseline.
              </p>

              <button className="primary-button" onClick={() => onBuild(cur.feature)}>
                Build an experiment targeting this <span>↗</span>
              </button>
            </div>
          )}
        </section>
      )}

      <div className="note-strip">
        <span>✳</span>
        <p><strong>Research reminder</strong> — a suspected weakness needs evidence. Compare outcomes before drawing conclusions.</p>
      </div>
    </>
  );
}

function ResultsTab({ pipeline, list, onSelect, showNotes, toggleNotes, onNew }: {
  pipeline: Pipeline | null; list: PipelineSummary[]; onSelect: (id: string) => void;
  showNotes: boolean; toggleNotes: () => void; onNew: () => void;
}) {
  // Results lists only the finished paper runs of the two research models (Qwen3 0.6B and 1.7B)
  const finished = list.filter((p) => p.status === "done" && p.mode === "paper" && RESEARCH_MODELS.includes(p.model));
  const evaluated = !!pipeline?.steps.some((s) => s.stage === "evaluate" && s.status === "done");
  const id = pipeline?.id;
  const res = useAsync<Results>(evaluated && id ? () => api.results(id) : null, [id, evaluated, pipeline?.status]);
  const r = res.data;
  const benchNames = r ? Object.keys(r.baseline) : [];
  const armOf = (a: Arm) => r?.arms.find((x) => x.arm === a);
  const targeted = armOf("targeted");
  const control = armOf("matched_control");
  const first = benchNames[0];
  const tgtGain = targeted && first ? targeted.benchmarks[first]?.vs_base.mean_diff : undefined;
  const ctlGain = control && first ? control.benchmarks[first]?.vs_base.mean_diff : undefined;

  return (
    <>
      <PageIntro
        eyebrow="OBSERVATIONS / 03"
        title={<>Measure what <em>matters.</em></>}
        description="Accuracy per arm versus the untrained model, and targeted versus matched control."
      />

      <div className="panel">
        <label className="field-label" htmlFor="res-pick">EXPERIMENT</label>
        <select id="res-pick" className="select-input" value={finished.some((p) => p.id === id) ? id : ""} onChange={(e) => onSelect(e.target.value)}>
          {!finished.some((p) => p.id === id) && <option value="" disabled>Select a finished experiment…</option>}
          {finished.map((p) => <option key={p.id} value={p.id}>{p.name} · {p.model.split("/").pop()}</option>)}
        </select>
      </div>

      {!evaluated && <div className="note-strip"><span>✳</span><p>No evaluation has finished for this experiment yet.</p></div>}
      {res.error && <div className="note-strip"><span>✳</span><p>{res.error}</p></div>}

      {r && first && (
        <>
          <section className="metrics-grid results-metrics">
            <MetricCard label={`Baseline · ${first}`} value={pct(r.baseline[first].accuracy)} detail={`n = ${r.baseline[first].n}`} icon="◉" color="red" />
            <MetricCard
              label="Targeted" value={pct(targeted?.benchmarks[first]?.accuracy_mean)}
              detail={tgtGain == null ? "not trained" : `${signed(tgtGain)} vs base`} icon="↗" color="green"
            />
            <MetricCard
              label="Matched control" value={pct(control?.benchmarks[first]?.accuracy_mean)}
              detail={ctlGain == null ? "not trained" : `${signed(ctlGain)} vs base`} icon="✦" color="orange"
            />
          </section>

          <section className="results-layout">
            <div className="panel chart-panel">
              <div className="panel-heading">
                <div><div className="eyebrow">MODEL EVALUATION</div><h3>Accuracy per benchmark</h3></div>
                <span className="chart-badge">{r.mode.toUpperCase()}{r.complete ? "" : " · PARTIAL"}</span>
              </div>

              <div className="chart-legend">
                <span><i className="legend-dot targeted" /> Targeted</span>
                <span><i className="legend-dot control" /> Matched control</span>
              </div>

              <div className="bar-chart">
                {benchNames.map((b) => {
                  const t = targeted?.benchmarks[b]?.accuracy_mean;
                  const c = control?.benchmarks[b]?.accuracy_mean;
                  return (
                    <div className="bar-group" key={b} title={b}>
                      <div className="bar-values">
                        <span className="targeted-value">{pct(t, 0)}</span>
                        <span className="control-value">{pct(c, 0)}</span>
                      </div>
                      <div className="bar-pair">
                        <div className="bar targeted-bar" style={{ ["--bar-height" as string]: `${(t ?? 0) * 100}%` }} />
                        <div className="bar control-bar" style={{ ["--bar-height" as string]: `${(c ?? 0) * 100}%` }} />
                      </div>
                      <span className="bar-label">{benchLabel(b)}</span>
                    </div>
                  );
                })}
              </div>
              <div className="chart-axis-label">ACCURACY BY BENCHMARK</div>
            </div>

            <div className="panel findings-panel">
              <div className="eyebrow">PRIMARY QUESTION · {r.primary?.status?.toUpperCase() ?? "N/A"}</div>
              <h3>{r.primary?.question ?? "No targeted + matched-control pair"}</h3>
              {r.primary?.results.map((x) => (
                <div className="finding" key={x.benchmark}>
                  <span className="finding-number">{x.significant ? "✓" : "–"}</span>
                  <div>
                    <strong>{x.benchmark}: {signed(x.mean_diff)}</strong>
                    <p>95% CI {signed(x.ci_low)} to {signed(x.ci_high)} · {x.significant ? "significant" : "not significant"}</p>
                  </div>
                </div>
              ))}
              {r.mode !== "paper" && <p className="disclaimer">Explore run — not paper evidence.</p>}
              {r.warnings.map((w) => <p key={w} className="disclaimer">{w}</p>)}
              <button className="secondary-button" onClick={toggleNotes}>
                {showNotes ? "Hide research notes" : "Read research notes"} <span>↗</span>
              </button>
            </div>
          </section>

          {showNotes && (
            <section className="panel research-notes">
              <div className="eyebrow">RESEARCH NOTES</div>
              <h3>Interpret with care.</h3>
              <p>
                These are measured accuracies from the selected pipeline. Explore runs are never paper evidence,
                and a gain only counts if it beats the matched control, which is just as hard but hard for a different reason.
              </p>
            </section>
          )}

          <section className="panel table-panel">
            <div className="panel-heading">
              <div><div className="eyebrow">VS UNTRAINED MODEL</div><h3>Arms</h3></div>
              <button className="text-button" onClick={onNew}>New experiment ↗</button>
            </div>
            <div className="table-scroll">
              <table className="experiment-table">
                <thead><tr><th>ARM</th><th>BENCHMARK</th><th>ACCURACY</th><th>CHANGE (95% CI)</th></tr></thead>
                <tbody>
                  {r.arms.flatMap((a) => Object.entries(a.benchmarks).map(([b, v]) => (
                    <tr key={`${a.arm}${a.ratio}${b}`}>
                      <td>
                        <span className={`arm-pill ${ARM_PILL[a.arm]}`}>{ARM_LABEL[a.arm]}</span>
                        <small>ratio {a.ratio} · {a.seeds.length} seed(s)</small>
                      </td>
                      <td>{b}</td>
                      <td className="score-cell">{pct(v.accuracy_mean)}</td>
                      <td style={v.regression ? { color: "#d33" } : undefined}>
                        {signed(v.vs_base.mean_diff)} ({signed(v.vs_base.ci_low)} to {signed(v.vs_base.ci_high)}){v.regression ? " ▼ regression" : ""}
                      </td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </>
  );
}

function ExperimentTable({ rows, onSelect, selectedId }: {
  rows: PipelineSummary[]; onSelect: (id: string) => void; selectedId?: string | null;
}) {
  if (!rows.length) return <p className="panel-description">No experiments yet.</p>;
  return (
    <div className="table-scroll">
      <table className="experiment-table">
        <thead>
          <tr>
            <th>EXPERIMENT</th>
            <th>MODE</th>
            <th>STATUS</th>
            <th>PROGRESS</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((p) => (
            <tr key={p.id} onClick={() => onSelect(p.id)} style={{ cursor: "pointer", opacity: selectedId && selectedId !== p.id ? 0.7 : 1 }}>
              <td>
                <strong>{p.name}</strong>
                <small>{p.id} · {p.model}</small>
              </td>
              <td><span className={`arm-pill ${p.mode === "paper" ? "targeted" : "control"}`}>{p.mode}</span></td>
              <td><span className="table-status"><span />{p.status}</span></td>
              <td className="score-cell">{pct(p.progress.fraction, 0)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function PageIntro({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: React.ReactNode;
  description: string;
}) {
  return (
    <section className="page-intro">
      <div className="eyebrow"><span className="eyebrow-line" />{eyebrow}</div>
      <h1>{title}</h1>
      <p>{description}</p>
    </section>
  );
}

function MetricCard({
  label,
  value,
  detail,
  icon,
  color,
}: {
  label: string;
  value: string;
  detail: string;
  icon: string;
  color: string;
}) {
  return (
    <div className="metric-card">
      <div className="metric-top">
        <span className="metric-label">{label}</span>
        <span className={`metric-icon ${color}`}>{icon}</span>
      </div>
      <div className="metric-value">{value}</div>
      <div className="metric-detail"><span />{detail}</div>
    </div>
  );
}

export default App;
