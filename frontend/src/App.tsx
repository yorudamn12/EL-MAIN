
import { useState } from "react";
import "./App.css";

type Tab = "Overview" | "Experiments" | "Diagnosis" | "Results";

const tabs: Tab[] = [
  "Overview",
  "Experiments",
  "Diagnosis",
  "Results",
];

const initialExperiments = [
  { id: "EXP-024", name: "Baseline neural model", arm: "Control", status: "Complete", score: "84.2%" },
  { id: "EXP-023", name: "Targeted learning pass", arm: "Targeted", status: "Complete", score: "89.6%" },
  { id: "EXP-022", name: "Untargeted training", arm: "Untargeted", status: "Complete", score: "82.8%" },
];

function App() {
  const [activeTab, setActiveTab] = useState<Tab>("Overview");
  const [activeArm, setActiveArm] = useState("Targeted");
  const [trainingSteps, setTrainingSteps] = useState(5);
  const [learningRate, setLearningRate] = useState("0.001");
  const [running, setRunning] = useState(false);
  const [selectedWeakness, setSelectedWeakness] = useState("Pattern recognition");
  const [showNotes, setShowNotes] = useState(false);
  const [experiments, setExperiments] = useState(initialExperiments);
  const [notice, setNotice] = useState("");

  function launchExperiment() {
    if (running) return;

    setRunning(true);
    setNotice("Experiment queued in the local demo environment.");

    window.setTimeout(() => {
      const score = (85 + Math.random() * 10).toFixed(1);

      setExperiments((previous) => [
        {
          id: `EXP-${String(25 + previous.length - initialExperiments.length).padStart(3, "0")}`,
          name: `${activeArm} training run`,
          arm: activeArm,
          status: "Complete",
          score: `${score}%`,
        },
        ...previous,
      ]);

      setRunning(false);
      setNotice("Demo run completed. Results are simulated, not from a live model.");
    }, 1400);
  }

  function openExperiment() {
    setActiveTab("Experiments");
    setNotice("Configure your next experiment below.");
  }

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
                {["◈", "◎", "⌘", "↗"][index]}
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
              <div className="status-subtitle">Local demo mode</div>
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
              <span className="status-dot" /> DEMO ENVIRONMENT
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
                <span className="section-meta">DEMO DATA · 01</span>
              </section>

              <section className="metrics-grid">
                <MetricCard
                  label="Experiments"
                  value={String(experiments.length).padStart(2, "0")}
                  detail="Recorded in this session"
                  icon="◎"
                  color="orange"
                />
                <MetricCard
                  label="Best accuracy"
                  value="89.6%"
                  detail="Highest recorded demo score"
                  icon="↗"
                  color="green"
                />
                <MetricCard
                  label="Model status"
                  value="Ready"
                  detail="Local simulation available"
                  icon="◈"
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
                  <ExperimentTable experiments={experiments.slice(0, 3)} />
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
                description="Configure training conditions, choose an experimental arm, and explore simulated outcomes."
              />

              <section className="experiment-layout">
                <div className="panel experiment-config">
                  <div className="panel-heading">
                    <div>
                      <div className="eyebrow">CONFIGURATION</div>
                      <h3>New experiment</h3>
                    </div>
                    <span className="config-number">01</span>
                  </div>

                  <label className="field-label">TRAINING ARM</label>
                  <div className="arm-options">
                    {[
                      { name: "Targeted", description: "Focus on a selected weakness", icon: "◎" },
                      { name: "Control", description: "Maintain baseline conditions", icon: "◈" },
                      { name: "Untargeted", description: "Train without a specific target", icon: "✳" },
                    ].map((arm) => (
                      <button
                        key={arm.name}
                        className={`arm-option ${activeArm === arm.name ? "selected" : ""}`}
                        onClick={() => setActiveArm(arm.name)}
                      >
                        <span className="arm-icon">{arm.icon}</span>
                        <span className="arm-text">
                          <strong>{arm.name}</strong>
                          <small>{arm.description}</small>
                        </span>
                        <span className="arm-check">
                          {activeArm === arm.name ? "●" : "○"}
                        </span>
                      </button>
                    ))}
                  </div>

                  <div className="field-row">
                    <div>
                      <label className="field-label" htmlFor="training-steps">
                        TRAINING STEPS
                      </label>
                      <p className="field-help">Number of simulated iterations</p>
                    </div>
                    <strong className="range-value">{trainingSteps}</strong>
                  </div>
                  <input
                    id="training-steps"
                    className="range-input"
                    type="range"
                    min="2"
                    max="7"
                    value={trainingSteps}
                    onChange={(event) => setTrainingSteps(Number(event.target.value))}
                  />
                  <div className="range-labels">
                    <span>2 steps</span><span>7 steps</span>
                  </div>

                  <label className="field-label" htmlFor="learning-rate">
                    LEARNING RATE
                  </label>
                  <select
                    id="learning-rate"
                    className="select-input"
                    value={learningRate}
                    onChange={(event) => setLearningRate(event.target.value)}
                  >
                    <option value="0.0001">0.0001 — Conservative</option>
                    <option value="0.001">0.001 — Balanced</option>
                    <option value="0.01">0.01 — Aggressive</option>
                  </select>

                  <div className="config-summary">
                    <span>Configuration summary</span>
                    <div><span>Arm</span><strong>{activeArm}</strong></div>
                    <div><span>Steps</span><strong>{trainingSteps}</strong></div>
                    <div><span>Learning rate</span><strong>{learningRate}</strong></div>
                  </div>

                  <button className="primary-button launch-button" onClick={launchExperiment} disabled={running}>
                    {running ? "Running simulation..." : "Launch demo experiment"}
                    <span>{running ? "◌" : "↗"}</span>
                  </button>
                  <p className="disclaimer">
                    Local simulation only. This does not train a real model.
                  </p>
                </div>

                <div className="experiment-side">
                  <div className="panel preview-panel">
                    <div className="eyebrow">EXPERIMENT PREVIEW</div>
                    <div className="preview-visual">
                      <div className="preview-ring ring-a" />
                      <div className="preview-ring ring-b" />
                      <div className="preview-center">D</div>
                      <span className="preview-node node-a" />
                      <span className="preview-node node-b" />
                      <span className="preview-node node-c" />
                    </div>
                    <h3>{activeArm} training</h3>
                    <p>
                      {activeArm === "Targeted"
                        ? "Direct attention towards a defined model weakness."
                        : activeArm === "Control"
                        ? "Maintain a baseline for comparing experimental changes."
                        : "Explore general training without a specific weakness target."}
                    </p>
                    <div className="preview-meta">
                      <span>ESTIMATED STEPS</span><strong>{trainingSteps}</strong>
                    </div>
                  </div>

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
                  <span className="section-meta">{experiments.length} RUNS</span>
                </div>
                <ExperimentTable experiments={experiments} />
              </section>
            </>
          )}

          {activeTab === "Diagnosis" && (
            <>
              <PageIntro
                eyebrow="ANALYSIS / 02"
                title={<>Find the <em>signal.</em></>}
                description="Explore example model weaknesses and identify a direction for your next investigation."
              />

              <section className="diagnosis-layout">
                <div className="panel weakness-panel">
                  <div className="eyebrow">WEAKNESS CATALOGUE</div>
                  <h3>What needs attention?</h3>
                  <p className="panel-description">
                    Select a category to explore its possible symptoms and research direction.
                  </p>

                  {[
                    { name: "Pattern recognition", tag: "PERCEPTION", number: "01", color: "orange" },
                    { name: "Generalization", tag: "ROBUSTNESS", number: "02", color: "green" },
                    { name: "Training stability", tag: "OPTIMIZATION", number: "03", color: "red" },
                    { name: "Data sensitivity", tag: "INPUT QUALITY", number: "04", color: "purple" },
                  ].map((item) => (
                    <button
                      key={item.name}
                      className={`weakness-item ${selectedWeakness === item.name ? "selected" : ""}`}
                      onClick={() => setSelectedWeakness(item.name)}
                    >
                      <span className={`weakness-number ${item.color}`}>{item.number}</span>
                      <span className="weakness-copy">
                        <strong>{item.name}</strong>
                        <small>{item.tag}</small>
                      </span>
                      <span className="weakness-arrow">↗</span>
                    </button>
                  ))}
                </div>

                <div className="panel diagnosis-detail">
                  <div className="detail-topline">
                    <span className="eyebrow">DIAGNOSTIC BRIEF</span>
                    <span className="detail-index">DM / {["01", "02", "03", "04"][[
                      "Pattern recognition", "Generalization", "Training stability", "Data sensitivity"
                    ].indexOf(selectedWeakness)]}</span>
                  </div>
                  <div className="diagnosis-symbol">⌘</div>
                  <h2>{selectedWeakness}</h2>
                  <p className="diagnosis-description">
                    {selectedWeakness === "Pattern recognition"
                      ? "The model may struggle to identify meaningful structures when examples vary in presentation or complexity."
                      : selectedWeakness === "Generalization"
                      ? "Performance may decline when the model encounters examples that differ from its training distribution."
                      : selectedWeakness === "Training stability"
                      ? "Training behaviour may fluctuate across iterations, making learning outcomes difficult to reproduce."
                      : "Small changes in input quality or representation may lead to disproportionate changes in model output."}
                  </p>

                  <div className="detail-divider" />
                  <div className="eyebrow">POSSIBLE RESEARCH DIRECTION</div>
                  <h3>
                    {selectedWeakness === "Pattern recognition"
                      ? "Compare targeted and baseline training"
                      : selectedWeakness === "Generalization"
                      ? "Evaluate performance on held-out examples"
                      : selectedWeakness === "Training stability"
                      ? "Compare outcomes across learning rates"
                      : "Investigate sensitivity to input variation"}
                  </h3>
                  <p className="panel-description">
                    Treat this as a hypothesis to investigate, not a confirmed diagnosis.
                  </p>

                  <button className="primary-button" onClick={openExperiment}>
                    Build an experiment <span>↗</span>
                  </button>
                </div>
              </section>

              <div className="note-strip">
                <span>✳</span>
                <p><strong>Research reminder</strong> — a suspected weakness needs evidence. Compare outcomes before drawing conclusions.</p>
              </div>
            </>
          )}

          {activeTab === "Results" && (
            <>
              <PageIntro
                eyebrow="OBSERVATIONS / 03"
                title={<>Measure what <em>matters.</em></>}
                description="Review illustrative evaluation metrics and compare the example training arms."
              />

              <section className="metrics-grid results-metrics">
                <MetricCard label="Baseline accuracy" value="84.2%" detail="Illustrative reference score" icon="◈" color="red" />
                <MetricCard label="Targeted accuracy" value="89.6%" detail="+5.4 percentage points" icon="↗" color="green" />
                <MetricCard label="Control accuracy" value="84.2%" detail="Reference condition" icon="◎" color="orange" />
              </section>

              <section className="results-layout">
                <div className="panel chart-panel">
                  <div className="panel-heading">
                    <div><div className="eyebrow">MODEL EVALUATION</div><h3>Illustrative accuracy trend</h3></div>
                    <span className="chart-badge">DEMO</span>
                  </div>

                  <div className="chart-legend">
                    <span><i className="legend-dot targeted" /> Targeted</span>
                    <span><i className="legend-dot control" /> Control</span>
                  </div>

                  <div className="bar-chart">
                    {[
                      { label: "Pass 1", targeted: 56, control: 48 },
                      { label: "Pass 2", targeted: 65, control: 54 },
                      { label: "Pass 3", targeted: 72, control: 61 },
                      { label: "Pass 4", targeted: 80, control: 68 },
                      { label: "Pass 5", targeted: 90, control: 73 },
                    ].map((item) => (
                      <div className="bar-group" key={item.label}>
                        <div className="bar-pair">
                          <div className="bar targeted-bar" style={{ height: `${item.targeted}%` }} />
                          <div className="bar control-bar" style={{ height: `${item.control}%` }} />
                        </div>
                        <span>{item.label}</span>
                      </div>
                    ))}
                  </div>
                  <div className="chart-axis-label">SIMULATED TRAINING PASSES</div>
                </div>

                <div className="panel findings-panel">
                  <div className="eyebrow">OBSERVATIONS</div>
                  <h3>What stands out?</h3>
                  <div className="finding">
                    <span className="finding-number">01</span>
                    <div><strong>Higher example score</strong><p>The targeted arm has the highest illustrative final score.</p></div>
                  </div>
                  <div className="finding">
                    <span className="finding-number">02</span>
                    <div><strong>Consistent comparison</strong><p>A control condition helps contextualize changes.</p></div>
                  </div>
                  <div className="finding">
                    <span className="finding-number">03</span>
                    <div><strong>Evidence still matters</strong><p>Real conclusions require actual evaluation data.</p></div>
                  </div>
                  <button className="secondary-button" onClick={() => setShowNotes((value) => !value)}>
                    {showNotes ? "Hide research notes" : "Read research notes"} <span>↗</span>
                  </button>
                </div>
              </section>

              {showNotes && (
                <section className="panel research-notes">
                  <div className="eyebrow">RESEARCH NOTES</div>
                  <h3>Interpret with care.</h3>
                  <p>
                    All displayed metrics and chart values are illustrative placeholders.
                    They are not measurements from a trained model. Replace them with
                    actual evaluation outputs before making scientific claims.
                  </p>
                </section>
              )}

              <section className="panel table-panel">
                <div className="panel-heading">
                  <div><div className="eyebrow">RECORDED RUNS</div><h3>Evaluation history</h3></div>
                  <button className="text-button" onClick={() => setActiveTab("Experiments")}>New experiment ↗</button>
                </div>
                <ExperimentTable experiments={experiments} />
              </section>
            </>
          )}
        </div>

        <footer className="footer">
          <span>DreamMachine <span className="footer-separator">/</span> Research Lab</span>
          <span>CONTRACT V0.2.1 <span className="footer-separator">·</span> MOCK ENVIRONMENT</span>
        </footer>
      </main>
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

type Experiment = {
  id: string;
  name: string;
  arm: string;
  status: string;
  score: string;
};

function ExperimentTable({ experiments }: { experiments: Experiment[] }) {
  return (
    <div className="table-scroll">
      <table className="experiment-table">
        <thead>
          <tr>
            <th>EXPERIMENT</th>
            <th>TRAINING ARM</th>
            <th>STATUS</th>
            <th>SCORE</th>
          </tr>
        </thead>
        <tbody>
          {experiments.map((experiment) => (
            <tr key={experiment.id}>
              <td>
                <strong>{experiment.name}</strong>
                <small>{experiment.id}</small>
              </td>
              <td><span className={`arm-pill ${experiment.arm.toLowerCase()}`}>{experiment.arm}</span></td>
              <td><span className="table-status"><span />{experiment.status}</span></td>
              <td className="score-cell">{experiment.score}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default App;
