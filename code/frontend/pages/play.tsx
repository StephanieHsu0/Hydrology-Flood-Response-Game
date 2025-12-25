import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { 
  ActionName, 
  sendAction, 
  StepResponse, 
  ScenarioSummary, 
  fetchScenarios,
  startGame
} from "../lib/api";
import { WaterTank } from "../components/WaterTank";
import { NewsTicker } from "../components/NewsTicker";
import { CommanderMap } from "../components/CommanderMap";
import { useLanguage } from "../lib/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";
import { RiskBadge } from "../components/RiskBadge";
import { ForecastChart } from "../components/ForecastChart";
import { EndScreen } from "../components/EndScreen";
import { TimelineReview } from "../components/TimelineReview";
import { computeSummary, GameSummary, EndReason } from "../lib/gameSummary";

const ACTIONS: ActionName[] = ["none", "alert", "pump", "diversion", "evac", "funding"];

type GamePhase = "PLAYING" | "ENDED";

export default function Play() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [gameId, setGameId] = useState<string | null>(null);
  const [scenario, setScenario] = useState<ScenarioSummary | null>(null);
  const [current, setCurrent] = useState<StepResponse | null>(null);
  const [history, setHistory] = useState<StepResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedZone, setSelectedZone] = useState<string>("any");

  // Endgame states
  const [phase, setPhase] = useState<GamePhase>("PLAYING");
  const [summary, setSummary] = useState<GameSummary | null>(null);
  const [showTimeline, setShowTimeline] = useState(false);
  const [commanderName, setCommanderName] = useState("");
  const [difficulty, setDifficulty] = useState("standard");

  useEffect(() => {
    const gid = localStorage.getItem("game_id");
    const sid = localStorage.getItem("scenario_id");
    const diff = localStorage.getItem("difficulty") || "standard";
    const init = localStorage.getItem("initial_state");
    const name = localStorage.getItem("commander_name");
    
    if (name) setCommanderName(name);
    setDifficulty(diff);

    if (!gid || !init || !sid) {
      router.push("/");
      return;
    }
    setGameId(gid);
    const parsed: StepResponse = JSON.parse(init);
    setCurrent(parsed);
    setHistory([parsed]);
    localStorage.setItem("history", JSON.stringify([parsed]));

    fetchScenarios().then((list) => {
      const found = list.find((s) => s.id === sid);
      if (found) setScenario(found);
    });
  }, [router]);

  const endGame = (currentRes: StepResponse, reason: EndReason) => {
    setPhase("ENDED");
    const nextHistory = [...history, currentRes];
    const computed = computeSummary(nextHistory, reason, lang);
    setSummary(computed);
  };

  const takeAction = async (action: ActionName) => {
    if (!gameId || loading || phase === "ENDED") return;
    
    // Dynamic cost logic
    let cost = scenario?.actions[action]?.cost || 0;
    if (action !== 'none' && action !== 'funding' && selectedZone === 'any') {
      cost = cost * 2.5;
    }

    const isFunding = action === 'funding';
    if (!isFunding && action !== 'none' && current && current.state.budget < cost) {
      alert(lang === 'zh' ? "預算不足！" : "Insufficient budget!");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const zid = selectedZone === "any" ? undefined : selectedZone;
      const res = await sendAction(gameId, action, zid);
      const nextHistory = [...history, res];
      setCurrent(res);
      setHistory(nextHistory);
      localStorage.setItem("history", JSON.stringify(nextHistory));
      
      // Check for end conditions
      if (res.state.trust <= 0) {
        endGame(res, "TRUST_ZERO");
      } else if (res.state.budget <= -50) { // Allow some debt before total collapse
        endGame(res, "BUDGET_ZERO");
      } else if (res.state.done || res.t >= 24) {
        endGame(res, "TIME_UP");
      }
    } catch (err: any) {
      setError(err.message || "Action failed");
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = async () => {
    const sid = localStorage.getItem("scenario_id");
    if (!sid) {
      router.push("/");
      return;
    }
    setLoading(true);
    setPhase("PLAYING");
    setSummary(null);
    setShowTimeline(false);
    
    try {
      const res = await startGame(sid, difficulty);
      setGameId(res.game_id);
      setCurrent(res.initial);
      setHistory([res.initial]);
      localStorage.setItem("game_id", res.game_id);
      localStorage.setItem("initial_state", JSON.stringify(res.initial));
      localStorage.setItem("history", JSON.stringify([res.initial]));
    } catch (err: any) {
      setError(err.message || "Restart failed");
      router.push("/");
    } finally {
      setLoading(false);
    }
  };

  const handleExit = () => {
    localStorage.removeItem("game_id");
    localStorage.removeItem("initial_state");
    localStorage.removeItem("history");
    router.push("/");
  };

  if (!current) {
    return (
      <main style={{ padding: 32 }}>
        <div style={{ color: "#f8fafc", textAlign: "center" }}>Loading session...</div>
      </main>
    );
  }

  const zones = Object.values(current.state.zones);
  const isBudgetCritical = current.state.budget < 10;

  const getReason = (reasonStr: string) => {
    if (!reasonStr) return "";
    try {
      if (reasonStr.startsWith("{")) {
        const parsed = JSON.parse(reasonStr);
        const langKey = lang as string;
        const langData = parsed[langKey] || parsed["en"];
        
        // Return a combined string of the XAI details
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ fontWeight: 600, color: "#f8fafc" }}>{langData.summary}</div>
            <div style={{ fontSize: "12px" }}>{langData.risk_focus}</div>
            <div style={{ fontSize: "12px", fontStyle: "italic", color: "#94a3b8" }}>{langData.budget_note}</div>
          </div>
        );
      }
      return reasonStr;
    } catch (e) {
      return reasonStr;
    }
  };

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top right, #1e293b, #0f172a)", padding: "24px" }}>
      <div style={{ maxWidth: 1300, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <h1 style={{ 
              fontSize: "24px", 
              fontWeight: 800, 
              margin: 0,
              background: "linear-gradient(to right, #f8fafc, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              {t.commandCenter}
            </h1>
            {commanderName && (
              <div style={{ 
                background: "#f59e0b22", 
                color: "#f59e0b", 
                padding: "4px 12px", 
                borderRadius: "20px", 
                fontSize: "12px", 
                fontWeight: "bold",
                border: "1px solid #f59e0b44"
              }}>
                👨‍✈️ {commanderName}
              </div>
            )}
            <LanguageSwitcher fixed={false} />
          </div>
          
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <div style={{ background: "rgba(30, 41, 59, 0.7)", padding: "8px 16px", borderRadius: 12, fontSize: 14, border: "1px solid #334155", backdropFilter: "blur(10px)" }}>
              <span style={{ color: "#94a3b8", marginRight: 8 }}>{t.step}</span>
              <strong style={{ fontSize: "16px" }}>{current.t}</strong> <span style={{ color: "#64748b" }}>/ {scenario?.duration_steps || 24}</span>
            </div>
            <div style={{ 
              background: isBudgetCritical ? "rgba(239, 68, 68, 0.2)" : "rgba(30, 41, 59, 0.7)", 
              padding: "8px 16px", 
              borderRadius: 12, 
              fontSize: 14, 
              border: `1px solid ${isBudgetCritical ? "#ef4444" : "#334155"}`,
              backdropFilter: "blur(10px)"
            }}>
              <span style={{ color: "#94a3b8", marginRight: 8 }}>{t.budget}</span>
              <strong style={{ color: isBudgetCritical ? "#ef4444" : "#22c55e", fontSize: "16px" }}>${current.state.budget.toFixed(1)}</strong>
            </div>
          </div>
        </div>

        {/* New Endgame Screens */}
        {phase === "ENDED" && summary && !showTimeline && (
          <EndScreen 
            summary={summary} 
            onRetry={handleRetry} 
            onTimeline={() => setShowTimeline(true)} 
            onHome={handleExit}
          />
        )}

        {showTimeline && (
          <TimelineReview 
            history={history} 
            onClose={() => setShowTimeline(false)} 
          />
        )}

        {error && <div style={{ color: "#f87171", marginBottom: 8 }}>{error}</div>}

        {/* Main Simulation Section */}
        <div className="card" style={{ marginBottom: 16, padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 12 }}>
            <div>
              <h3 style={{ margin: "0 0 4px 0" }}>{t.liveSim}</h3>
              <p style={{ margin: 0, fontSize: 13, color: "#94a3b8" }}>{t.simDesc}</p>
            </div>
            <div style={{ display: "flex", gap: 20 }}>
              <StatSmall label={t.rain} value={`${current.obs.rain.toFixed(1)} mm`} />
              <StatSmall label={t.accum} value={`${current.obs.accum.toFixed(1)} mm`} />
            </div>
          </div>
          
          <CommanderMap zones={current.state.zones} rain={current.obs.rain} />
          
          {current.events.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", gap: 8, flexWrap: "wrap" }}>
              {current.events.map((e) => {
                const isPositive = e.includes("Grant") || e.includes("補助") || e.includes("預算");
                return (
                  <span key={e} style={{ 
                    background: isPositive ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)", 
                    color: isPositive ? "#22c55e" : "#ef4444", 
                    padding: "4px 10px", 
                    borderRadius: 6, 
                    fontSize: 11, 
                    fontWeight: "bold", 
                    border: `1px solid ${isPositive ? "rgba(34, 197, 94, 0.3)" : "rgba(239, 68, 68, 0.3)"}` 
                  }}>
                    {isPositive ? "💰" : "⚠"} {e}
                  </span>
                );
              })}
            </div>
          )}
        </div>

        {/* Control & Intelligence Grid */}
        <div className="grid" style={{ gridTemplateColumns: "1.2fr 1fr 0.8fr", gap: 16, alignItems: "stretch" }}>
          
          {/* Actions Card */}
          <div className="card" style={{ display: "flex", flexDirection: "column" }}>
            <h3 style={{ marginTop: 0 }}>{t.actions}</h3>
            
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: "#94a3b8", display: "block", marginBottom: 4 }}>{t.targetZone}:</label>
              <div style={{ display: "flex", gap: 4 }}>
                <button 
                  onClick={() => setSelectedZone("any")}
                  style={{ flex: 1, padding: "4px", fontSize: 11, borderRadius: 4, border: selectedZone === "any" ? "2px solid #22c55e" : "1px solid #334155", background: "#0f172a" }}
                >{t.anyZone}</button>
                {zones.map(z => (
                  <button 
                    key={z.id}
                    onClick={() => setSelectedZone(z.id)}
                    style={{ flex: 1, padding: "4px", fontSize: 11, borderRadius: 4, border: selectedZone === z.id ? "2px solid #22c55e" : "1px solid #334155", background: "#0f172a" }}
                  >{(t as any)[z.id] || z.name}</button>
                ))}
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, flexGrow: 1 }}>
              {ACTIONS.map((a) => {
                const actionCfg = scenario?.actions[a];
                let displayCost = actionCfg?.cost ?? 0;
                
                if (a !== 'none' && a !== 'funding' && selectedZone === 'any') {
                  displayCost = displayCost * 2.5;
                }
                const isAffordable = (a === 'none' || a === 'funding' || current.state.budget >= displayCost);

                return (
                  <button
                    key={a}
                    onClick={() => takeAction(a)}
                    disabled={loading || !isAffordable || (a === 'funding' && !actionCfg)}
                    style={{
                      padding: "12px 8px",
                      borderRadius: 10,
                      border: "1px solid #334155",
                      background: a === 'funding' ? "rgba(59, 130, 246, 0.2)" : "#1e293b",
                      color: (!isAffordable || (a === 'funding' && !actionCfg)) ? "#64748b" : "#f1f5f9",
                      textTransform: "capitalize",
                      fontWeight: 600,
                      fontSize: 13,
                      transition: "all 0.2s",
                      opacity: (!isAffordable || (a === 'funding' && !actionCfg)) ? 0.5 : 1
                    }}
                  >
                    {(t as any)[a] || a.replace("_", " ")}
                    <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.8 }}>
                      {a === 'funding' 
                        ? (actionCfg ? `-${displayCost} Trust` : "Unavailable") 
                        : `$${displayCost.toFixed(1)}`}
                    </div>
                  </button>
                );
              })}
            </div>
            <div style={{ marginTop: 16, paddingTop: 12, borderTop: "1px solid #334155", fontSize: 12, color: "#94a3b8" }}>
               {t.scoreUpdate}: <span style={{ color: current.reward.delta >= 0 ? "#22c55e" : "#f87171" }}>{current.reward.delta.toFixed(2)}</span>
               <br/>
               {t.totalScore}: <strong>{current.reward.total.toFixed(2)}</strong>
            </div>
          </div>

          {/* AI Intelligence Card */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t.aiAdvisor}</h3>
            <div style={{ background: "#0f172a", padding: 12, borderRadius: 10, border: "1px solid #334155" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 4 }}>
                <div style={{ fontSize: 12, color: "#94a3b8" }}>{t.recommended}</div>
                <div style={{ 
                  fontSize: 10, 
                  padding: "2px 6px", 
                  borderRadius: 4, 
                  background: (current.recommendation.confidence || 0) > 0.9 ? "#065f46" : "#1e293b",
                  color: (current.recommendation.confidence || 0) > 0.9 ? "#34d399" : "#94a3b8",
                  border: "1px solid #334155"
                }}>
                  {Math.round((current.recommendation.confidence || 0.95) * 100)}% Conf.
                </div>
              </div>
              <div style={{ fontSize: 20, fontWeight: 800, color: "#22c55e", textTransform: "uppercase" }}>
                {(t as any)[current.recommendation.action] || current.recommendation.action} 
                {current.recommendation.zone_id && ` @ ${(t as any)[current.recommendation.zone_id] || current.recommendation.zone_id}`}
              </div>
              <div style={{ color: "#cbd5e1", fontSize: 13, marginTop: 4, lineHeight: 1.4 }}>{getReason(current.recommendation.reason)}</div>
              
              {/* New XAI Reasons */}
              {current.recommendation.top_reasons && current.recommendation.top_reasons.length > 0 && (
                <div style={{ marginTop: 10, borderTop: "1px solid #334155", paddingTop: 8 }}>
                  {current.recommendation.top_reasons.map((reason, i) => (
                    <div key={i} style={{ fontSize: 11, color: "#94a3b8", display: "flex", gap: 6, marginBottom: 2 }}>
                      <span style={{ color: "#22c55e" }}>•</span> {reason}
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div style={{ marginTop: 16 }}>
              <div style={{ fontSize: 12, color: "#94a3b8", marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
                🛡️ {t.confidence} / Risk Forecast
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 12 }}>
                {[0, 1, 2].map((idx) => {
                  const prob = (current.forecast.prob_critical && current.forecast.prob_critical.length > idx) 
                    ? current.forecast.prob_critical[idx] 
                    : 0;
                  const label = `+${idx + 1}h`;
                  // Use a more sensitive color scale for "Risk Level"
                  const color = prob > 0.6 ? "#ef4444" : (prob > 0.2 ? "#f59e0b" : "#22c55e");
                  
                  return (
                    <div key={idx} style={{ 
                      background: "#0f172a", 
                      padding: "12px 8px", 
                      borderRadius: "12px", 
                      border: "1px solid #1e293b", 
                      textAlign: "center",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      transition: "all 0.3s ease"
                    }}>
                      <div style={{ fontSize: "10px", color: "#64748b", marginBottom: "8px", fontWeight: "bold" }}>{label}</div>
                      <div style={{ 
                        height: "60px", 
                        width: "12px", 
                        background: "#1e293b", 
                        borderRadius: "6px", 
                        position: "relative",
                        overflow: "hidden",
                        boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)"
                      }}>
                        <div style={{
                          position: "absolute",
                          bottom: 0,
                          left: 0,
                          width: "100%",
                          height: `${Math.max(prob * 100, 5)}%`,
                          background: color,
                          transition: "height 0.8s cubic-bezier(0.4, 0, 0.2, 1), background 0.3s ease",
                          boxShadow: prob > 0.4 ? `0 0 12px ${color}88` : "none",
                          borderRadius: "6px"
                        }} />
                      </div>
                      <div style={{ 
                        fontSize: "12px", 
                        fontWeight: 800, 
                        marginTop: "10px", 
                        color: prob > 0.4 ? color : "#f8fafc" 
                      }}>
                        {Math.round(prob * 100)}%
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Forecast Card (Compact) */}
          <div className="card">
            <h3 style={{ marginTop: 0 }}>{t.forecastTitle}</h3>
            <div style={{ height: "160px" }}>
              <ForecastChart forecast={current.forecast} />
            </div>
            <p style={{ fontSize: 11, color: "#64748b", marginTop: 8, lineHeight: 1.2 }}>
              {t.trend} {current.forecast.risk_mean[2] > current.forecast.risk_mean[0] ? t.rising : t.declining}
            </p>
          </div>

        </div>

        <NewsTicker current={current} />
        
        <style jsx>{`
          @keyframes pulse-red {
            0% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4); }
            70% { box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}</style>
      </div>
    </main>
  );
}

function StatSmall({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ textAlign: "right" }}>
      <div style={{ fontSize: 11, color: "#94a3b8", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontWeight: 800, fontSize: 16 }}>{value}</div>
    </div>
  );
}
