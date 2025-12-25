import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/router";
import { StepResponse } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function Outcome() {
  const router = useRouter();
  const { t } = useLanguage();
  const [history, setHistory] = useState<StepResponse[]>([]);
  const [total, setTotal] = useState<number>(0);

  useEffect(() => {
    const stored = localStorage.getItem("history");
    const totalStr = localStorage.getItem("final_total");
    if (!stored || !totalStr) {
      router.push("/");
      return;
    }
    setHistory(JSON.parse(stored));
    setTotal(parseFloat(totalStr));
  }, [router]);

  const stats = useMemo(() => {
    if (history.length === 0) return null;
    
    // Average peak across zones
    const zonePeaks: Record<string, number> = {};
    history.forEach(h => {
      Object.values(h.state.zones).forEach(z => {
        zonePeaks[z.id] = Math.max(zonePeaks[z.id] || 0, z.risk);
      });
    });
    const peakRisk = Math.max(...Object.values(zonePeaks));
    
    const exceedHours = history.filter(h => 
      Object.values(h.state.zones).some(z => z.risk > 0.7)
    ).length;

    const actions = history.reduce<Record<string, number>>((acc, h) => {
      acc[h.action] = (acc[h.action] || 0) + 1;
      return acc;
    }, {});
    
    return { peakRisk, exceedHours, actions, zonePeaks };
  }, [history]);

  if (!stats) return <main style={{ padding: 32 }}><div>Loading...</div></main>;

  return (
    <main style={{ padding: "24px", maxWidth: 900, margin: "0 auto" }}>
      <LanguageSwitcher />
      <h2>{t.outcomeTitle}</h2>
      <p style={{ color: "#94a3b8" }}>{t.outcomeSubtitle}</p>

      <div className="grid" style={{ gridTemplateColumns: "repeat(auto-fit,minmax(200px,1fr))" }}>
        <Card title={t.peakRisk}>{(stats.peakRisk * 100).toFixed(0)}%</Card>
        <Card title={t.hoursOver}>{stats.exceedHours}</Card>
        <Card title={t.finalScore}>{total.toFixed(2)}</Card>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>{t.zonesTitle}</h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12 }}>
          {Object.entries(stats.zonePeaks).map(([id, peak]) => (
            <div key={id} style={{ background: "#0b1220", padding: 12, borderRadius: 10, textAlign: "center" }}>
              <div style={{ fontSize: 12, color: "#94a3b8" }}>{(t as any)[id] || id}</div>
              <div style={{ fontWeight: 700, color: peak > 0.7 ? "#ef4444" : "#22c55e" }}>
                Peak: {(peak * 100).toFixed(0)}%
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="card" style={{ marginTop: 12 }}>
        <h3>{t.actionMix}</h3>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {Object.entries(stats.actions).map(([name, count]) => (
            <div key={name} style={{ background: "#0b1220", padding: 10, borderRadius: 10 }}>
              {(t as any)[name] || name}: {count}
            </div>
          ))}
        </div>
      </div>

      <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
        <button
          onClick={() => router.push("/replay")}
          style={{ padding: "12px 16px", borderRadius: 10, border: "1px solid #334155", background: "#1e293b", color: "#f1f5f9", fontWeight: "bold" }}
        >
          {t.replayBtn}
        </button>
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: "#9ca3af" }}>{title}</div>
      <div style={{ fontWeight: 700, fontSize: 20 }}>{children}</div>
    </div>
  );
}

