import { useState } from "react";
import { socraticTurn, type SocraticRes } from "./api";
import "./App.css";

export default function App() {
  const [text, setText] = useState("");
  const [step, setStep] = useState<number | "">("");
  const [resp, setResp] = useState<SocraticRes | null>(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;

    setLoading(true);
    setErr(null);
    setResp(null);

    try {
      const data = await socraticTurn({
        text: text.trim(),
        step: step === "" ? null : Number(step),
      });
      setResp(data);

      
      const currentStep = typeof step === "number" ? step : (data.step_id ?? 1);
      const nextStep = Math.min(6, (data.step_id ?? currentStep) + 1);
      setStep(nextStep);
    } catch (e: any) {
      setErr(e?.message ?? "Request failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="shell">
      <main className="app">
        <h1 className="title">Socratic Mentor (MVP)</h1>

        <form onSubmit={onSubmit} className="chatbox card">
          <label className="field">
            <div className="label">Your message</div>
            <textarea
              rows={4}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder='Type your problem or reply… e.g. "Create a function that takes two numbers and an operation…"'
              required
            />
          </label>

          <div className="actions">
            <label className="field inline">
              <div className="label">Step (1–6, optional)</div>
              <input
                type="number"
                min={1}
                max={6}
                value={step}
                onChange={(e) =>
                  setStep(e.target.value === "" ? "" : Number(e.target.value))
                }
                placeholder="Step"
              />
            </label>

            <button className="btn" disabled={loading || !text.trim()} type="submit">
              {loading ? "Thinking…" : "Ask"}
            </button>
          </div>
        </form>

        {err && <p className="panel error">Error: {err}</p>}

        {resp && (
          <section className="panel output card">
            <div className="meta">Step {resp.step_id ?? "n/a"}</div>
            <p className="mentor"><b>Mentor:</b> {resp.assistant_message}</p>
            <p className="question">{resp.question}</p>

            {resp.validation !== undefined && resp.validation !== null && (
              <div className="validation">Validation requested: <b>{String(resp.validation)}</b></div>
            )}

            {resp.notes && <p className="notes">Notes: {resp.notes}</p>}
          </section>
        )}
      </main>
    </div>
  );
}
