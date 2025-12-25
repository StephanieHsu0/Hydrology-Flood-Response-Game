import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import { fetchScenarios, ScenarioSummary, startGame } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";
import { LanguageSwitcher } from "../components/LanguageSwitcher";

export default function Home() {
  const router = useRouter();
  const { t, lang } = useLanguage();
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string>("");
  const [difficulty, setDifficulty] = useState("standard");
  const [commanderName, setCommanderName] = useState("");
  const [showRules, setShowRules] = useState(false);

  useEffect(() => {
    const hasSeenRules = localStorage.getItem("rules_seen");
    if (!hasSeenRules) {
      setShowRules(true);
    }
    const savedName = localStorage.getItem("commander_name");
    if (savedName) setCommanderName(savedName);
    fetchScenarios()
      .then(setScenarios)
      .catch((err) => setError(err.message || "Failed to load scenarios"));
  }, []);

  const handleStart = async () => {
    if (!commanderName.trim()) {
      setError(t.nameRequired);
      return;
    }
    if (!selected) {
      setError(lang === 'zh' ? "請選擇一個任務開始" : "Pick a scenario to start");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      localStorage.setItem("commander_name", commanderName);
      const res = await startGame(selected, difficulty);
      localStorage.setItem("game_id", res.game_id);
      localStorage.setItem("scenario_id", selected);
      localStorage.setItem("difficulty", difficulty);
      localStorage.setItem("initial_state", JSON.stringify(res.initial));
      router.push("/play");
    } catch (err: any) {
      setError(err.message || "Start failed");
    } finally {
      setLoading(false);
    }
  };

  const closeRules = () => {
    setShowRules(false);
    localStorage.setItem("rules_seen", "true");
  };

  const getName = (s: ScenarioSummary) => {
    if (typeof s.name === "string") return s.name;
    return s.name[lang] || s.name["en"];
  };

  const getDesc = (s: ScenarioSummary) => {
    if (typeof s.description === "string") return s.description;
    return s.description[lang] || s.description["en"];
  };

  const difficulties = [
    { id: "standard", label: t.standard, desc: lang === 'zh' ? "平衡的預算與適中的降雨挑戰。" : "Balanced budget and moderate rainfall challenges.", color: "#3b82f6" },
    { id: "ai_assist", label: t.aiAssist, desc: lang === 'zh' ? "進階 AI 顧問提供更高精度的風險預測。" : "Advanced AI advisor provides high-precision risk forecasts.", color: "#a855f7" },
    { id: "expert", label: t.expert, desc: lang === 'zh' ? "極端氣候條件與有限預算，考驗指揮官極限。" : "Extreme weather and tight budget to test commander limits.", color: "#ef4444" },
  ];

  return (
    <main style={{ minHeight: "100vh", background: "radial-gradient(circle at top right, #1e293b, #0f172a)" }}>
      <div style={{ padding: "40px 24px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 40 }}>
          <div>
            <h1 style={{ 
              fontSize: "42px", 
              fontWeight: 800, 
              margin: 0, 
              background: "linear-gradient(to right, #f8fafc, #94a3b8)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}>
              {t.title}
            </h1>
            <p style={{ color: "#94a3b8", fontSize: "18px", marginTop: 8, maxWidth: "600px" }}>{t.subtitle}</p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <button 
              onClick={() => setShowRules(true)}
              style={{
                background: "rgba(30, 41, 59, 0.7)",
                border: "1px solid #334155",
                color: "#f1f5f9",
                padding: "8px 16px",
                borderRadius: "12px",
                fontSize: "14px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              📖 {t.gameRules}
            </button>
            <LanguageSwitcher fixed={false} />
          </div>
        </div>

        {error && (
          <div style={{ 
            background: "rgba(239, 68, 68, 0.1)", 
            color: "#ef4444", 
            padding: "12px 16px", 
            borderRadius: "12px", 
            marginBottom: "24px",
            border: "1px solid rgba(239, 68, 68, 0.2)",
            display: "flex",
            alignItems: "center",
            gap: "8px"
          }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: "32px" }}>
          
          {/* Scenarios Section */}
          <section>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
              <span style={{ background: "#22c55e", width: "4px", height: "24px", borderRadius: "2px" }}></span>
              <h2 style={{ fontSize: "20px", margin: 0 }}>{t.scenarios}</h2>
            </div>
            
            <div style={{ display: "grid", gap: "16px" }}>
              {scenarios.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelected(s.id)}
                  style={{
                    textAlign: "left",
                    borderRadius: "16px",
                    padding: "24px",
                    border: selected === s.id ? "2px solid #22c55e" : "1px solid #334155",
                    background: selected === s.id ? "rgba(34, 197, 94, 0.05)" : "#1e293b",
                    color: "#f1f5f9",
                    transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
                    cursor: "pointer",
                    position: "relative",
                    overflow: "hidden"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", fontWeight: 700 }}>{getName(s)}</h3>
                      <p style={{ margin: 0, fontSize: "14px", color: "#94a3b8", lineHeight: "1.5" }}>{getDesc(s)}</p>
                    </div>
                    {selected === s.id && (
                      <span style={{ background: "#22c55e", color: "#0f172a", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "bold" }}>
                        {lang === 'zh' ? '已選取' : 'SELECTED'}
                      </span>
                    )}
                  </div>
                  <div style={{ marginTop: "16px", display: "flex", gap: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                      ⏱️ {s.duration_steps} {lang === 'zh' ? '小時' : 'Steps'}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: "#cbd5e1" }}>
                      📍 3 {lang === 'zh' ? '個關鍵區域' : 'Critical Zones'}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Difficulty & Start Section */}
          <aside>
            <div style={{ background: "#1e293b", padding: "32px", borderRadius: "24px", border: "1px solid #334155", position: "sticky", top: "40px" }}>
              
              {/* Commander Name Input */}
              <div style={{ marginBottom: "32px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <span style={{ background: "#f59e0b", width: "4px", height: "24px", borderRadius: "2px" }}></span>
                  <h2 style={{ fontSize: "20px", margin: 0 }}>{t.commanderName}</h2>
                </div>
                <input 
                  type="text"
                  value={commanderName}
                  onChange={(e) => setCommanderName(e.target.value)}
                  placeholder={t.commanderPlaceholder}
                  style={{
                    width: "100%",
                    padding: "16px",
                    borderRadius: "12px",
                    background: "#0f172a",
                    border: "1px solid #334155",
                    color: "#f8fafc",
                    fontSize: "16px",
                    outline: "none",
                    transition: "border-color 0.2s"
                  }}
                  onFocus={(e) => e.target.style.borderColor = "#f59e0b"}
                  onBlur={(e) => e.target.style.borderColor = "#334155"}
                />
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
                <span style={{ background: "#3b82f6", width: "4px", height: "24px", borderRadius: "2px" }}></span>
                <h2 style={{ fontSize: "20px", margin: 0 }}>{t.difficulty}</h2>
              </div>

              <div style={{ display: "grid", gap: "12px", marginBottom: "32px" }}>
                {difficulties.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setDifficulty(d.id)}
                    style={{
                      padding: "16px",
                      borderRadius: "16px",
                      textAlign: "left",
                      border: difficulty === d.id ? `2px solid ${d.color}` : "1px solid #334155",
                      background: difficulty === d.id ? `${d.color}11` : "transparent",
                      color: "#f1f5f9",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "4px", color: difficulty === d.id ? d.color : "#f8fafc" }}>{d.label}</div>
                    <div style={{ fontSize: "13px", color: "#94a3b8" }}>{d.desc}</div>
                  </button>
                ))}
              </div>

              <div style={{ marginTop: "32px", paddingTop: "24px", borderTop: "1px solid #334155" }}>
                <button
                  onClick={handleStart}
                  disabled={loading || !selected}
                  style={{
                    padding: "18px",
                    borderRadius: "16px",
                    border: "none",
                    background: selected ? "linear-gradient(135deg, #22c55e, #16a34a)" : "#334155",
                    color: selected ? "#0f172a" : "#94a3b8",
                    fontWeight: 800,
                    fontSize: "18px",
                    width: "100%",
                    cursor: selected ? "pointer" : "not-allowed",
                    boxShadow: selected ? "0 10px 20px rgba(34, 197, 94, 0.2)" : "none",
                    transition: "all 0.2s"
                  }}
                >
                  {loading ? (lang === 'zh' ? "初始化中..." : "Initializing...") : t.startGame}
                </button>
                {!selected && (
                  <p style={{ textAlign: "center", fontSize: "13px", color: "#ef4444", marginTop: "12px", fontWeight: 500 }}>
                    {lang === 'zh' ? "⚠️ 請先從左側選擇一個情境任務" : "⚠️ Please select a scenario mission first"}
                  </p>
                )}
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* Game Rules Modal */}
      {showRules && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
          background: "rgba(15, 23, 42, 0.9)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center",
          backdropFilter: "blur(8px)", padding: "20px"
        }}>
          <div style={{
            background: "#1e293b", padding: "40px", borderRadius: "24px",
            border: "1px solid #334155", maxWidth: "600px", width: "100%",
            boxShadow: "0 20px 50px rgba(0,0,0,0.5)"
          }}>
            <h2 style={{ fontSize: "28px", color: "#f8fafc", marginBottom: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
              🛡️ {t.rulesTitle}
            </h2>
            <p style={{ color: "#94a3b8", fontSize: "16px", lineHeight: "1.6", marginBottom: "24px" }}>
              {t.rulesIntro}
            </p>
            
            <div style={{ display: "grid", gap: "16px", marginBottom: "32px" }}>
              {[t.rule1, t.rule2, t.rule3, t.rule4, t.rule5].map((rule, i) => (
                <div key={i} style={{ 
                  background: "#0f172a", padding: "16px", borderRadius: "12px", 
                  border: "1px solid #334155", color: "#cbd5e1", fontSize: "14px",
                  lineHeight: "1.5"
                }}>
                  {rule}
                </div>
              ))}
            </div>

            <button
              onClick={closeRules}
              style={{
                width: "100%", padding: "16px", borderRadius: "12px", border: "none",
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                color: "white", fontWeight: "bold", fontSize: "16px", cursor: "pointer",
                boxShadow: "0 10px 20px rgba(59, 130, 246, 0.2)"
              }}
            >
              {t.gotIt}
            </button>
          </div>
        </div>
      )}

      <style jsx>{`
        button:hover {
          transform: translateY(-2px);
          filter: brightness(1.1);
        }
        button:active {
          transform: translateY(0);
        }
      `}</style>
    </main>
  );
}

