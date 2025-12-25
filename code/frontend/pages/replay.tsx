import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchReplay, StepResponse } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function ReplayPage() {
  const router = useRouter();
  const { t } = useLanguage();
  const [history, setHistory] = useState<StepResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const gid = localStorage.getItem("game_id");
    if (!gid) {
      router.push("/");
      return;
    }
    setLoading(true);
    fetchReplay(gid)
      .then((res) => setHistory(res.history))
      .catch((err) => setError(err.message || "Failed to load replay"))
      .finally(() => setLoading(false));
  }, [router]);

  return (
    <main style={{ padding: "24px", maxWidth: 1100, margin: "0 auto" }}>
      <LanguageSwitcher />
      <h2>{t.replayTitle}</h2>
      {error && <div style={{ color: "#f87171" }}>{error}</div>}
      {loading && <div>Loading...</div>}

      <div className="card" style={{ marginTop: 12, overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "#94a3b8", fontSize: 13 }}>
              <th style={{ padding: 12 }}>{t.step}</th>
              <th>{t.actions}</th>
              <th>{t.targetZone}</th>
              <th>{t.rain}</th>
              <th>Avg Risk</th>
              <th>Δ Score</th>
              <th>AI Reason</th>
            </tr>
          </thead>
          <tbody>
            {history.map((h) => {
              const avgRisk = Object.values(h.state.zones).reduce((a, b) => a + b.risk, 0) / Object.keys(h.state.zones).length;
              return (
                <tr key={h.t} style={{ borderTop: "1px solid #334155", fontSize: 13 }}>
                  <td style={{ padding: 12 }}>{h.t}</td>
                  <td style={{ fontWeight: "bold" }}>{(t as any)[h.action] || h.action}</td>
                  <td style={{ color: "#94a3b8" }}>{h.zone_id ? ((t as any)[h.zone_id] || h.zone_id) : "-"}</td>
                  <td>{h.obs.rain.toFixed(1)}</td>
                  <td style={{ color: avgRisk > 0.5 ? "#ef4444" : "#22c55e" }}>{(avgRisk * 100).toFixed(0)}%</td>
                  <td style={{ color: h.reward.delta < 0 ? "#f87171" : "#22c55e" }}>{h.reward.delta.toFixed(2)}</td>
                  <td style={{ color: "#94a3b8", fontSize: 12 }}>{h.recommendation.reason}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => router.push("/")}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontWeight: "bold" }}
        >
          {t.newScenarioBtn}
        </button>
      </div>
    </main>
  );
}

