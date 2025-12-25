import React from "react";
import { GameSummary } from "../lib/gameSummary";
import { useLanguage } from "../lib/LanguageContext";

interface EndScreenProps {
  summary: GameSummary;
  onRetry: () => void;
  onTimeline: () => void;
  onHome: () => void;
}

export const EndScreen: React.FC<EndScreenProps> = ({ summary, onRetry, onTimeline, onHome }) => {
  const { lang, t } = useLanguage();
  const [commanderName, setCommanderName] = React.useState("");

  React.useEffect(() => {
    const name = localStorage.getItem("commander_name");
    if (name) setCommanderName(name);
  }, []);

  const getScoreColor = (score: number) => {
    if (score >= 80) return "#22c55e";
    if (score >= 60) return "#a3e635";
    if (score >= 40) return "#f59e0b";
    return "#ef4444";
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(15, 23, 42, 0.85)", zIndex: 9999,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      backdropFilter: "blur(12px)", color: "#f8fafc", padding: "20px", overflowY: "auto"
    }}>
      <div style={{
        background: "#1e293b", padding: "40px", borderRadius: "24px",
        border: `2px solid ${getScoreColor(summary.finalScore)}`, textAlign: "center",
        boxShadow: `0 0 40px ${getScoreColor(summary.finalScore)}33`, maxWidth: "800px", width: "100%"
      }}>
        <div style={{ fontSize: "60px", marginBottom: "20px" }}>
          {summary.endReason === "TIME_UP" ? "🏆" : "🚨"}
        </div>

        {commanderName && (
          <div style={{ 
            fontSize: "14px", 
            color: "#94a3b8", 
            textTransform: "uppercase", 
            letterSpacing: "2px",
            marginBottom: "8px"
          }}>
            Commander {commanderName}
          </div>
        )}

        <h1 style={{ fontSize: "36px", color: getScoreColor(summary.finalScore), margin: "0 0 10px 0" }}>
          {summary.endingTitle}
        </h1>
        <p style={{ color: "#94a3b8", fontSize: "18px", marginBottom: "30px" }}>
          {summary.endingDescription}
        </p>

        <div style={{ 
          display: "grid", 
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", 
          gap: "20px", 
          marginBottom: "40px",
          background: "#0f172a",
          padding: "20px",
          borderRadius: "16px"
        }}>
          <StatBox label={t.finalScore} value={summary.finalScore.toString()} color={getScoreColor(summary.finalScore)} large />
          <StatBox label={lang === 'zh' ? "總計損害" : "Total Damage"} value={summary.totalDamage.toFixed(0)} />
          <StatBox label={lang === 'zh' ? "決策成本" : "Decision Cost"} value={`$${summary.totalCost.toFixed(1)}`} />
          <StatBox label={lang === 'zh' ? "最終信任度" : "Final Trust"} value={`${summary.finalTrust}%`} />
          <StatBox label={lang === 'zh' ? "AI 採納率" : "AI Adoption"} value={`${(summary.aiAdoptionRate * 100).toFixed(0)}%`} />
        </div>

        <div style={{ marginBottom: "30px", textAlign: "left" }}>
          <h3 style={{ fontSize: "18px", marginBottom: "12px", borderBottom: "1px solid #334155", paddingBottom: "8px" }}>
            {lang === 'zh' ? "各區域淹水時數" : "Flooded Hours by Zone"}
          </h3>
          <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
            {Object.entries(summary.floodedHoursByZone).map(([zone, hours]) => (
              <div key={zone} style={{ background: "#334155", padding: "8px 16px", borderRadius: "8px" }}>
                <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{zone}: </span>
                <span style={{ fontWeight: "bold" }}>{hours} hr</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", justifyContent: "center" }}>
          <button onClick={onTimeline} style={buttonStyle("#3b82f6")}>
            📊 {t.replayBtn}
          </button>
          <button onClick={onRetry} style={buttonStyle("#22c55e")}>
            🔄 {t.retrySame}
          </button>
          <button onClick={onHome} style={buttonStyle("transparent", "1px solid #334155")}>
            🎮 {t.changeMode}
          </button>
        </div>
      </div>
    </div>
  );
};

const StatBox: React.FC<{ label: string; value: string; color?: string; large?: boolean }> = ({ label, value, color, large }) => (
  <div style={{ textAlign: "center" }}>
    <div style={{ fontSize: "12px", color: "#94a3b8", textTransform: "uppercase", marginBottom: "4px" }}>{label}</div>
    <div style={{ fontSize: large ? "42px" : "24px", fontWeight: "bold", color: color || "#f8fafc" }}>{value}</div>
  </div>
);

const buttonStyle = (bg: string, border?: string) => ({
  padding: "12px 24px",
  borderRadius: "12px",
  background: bg,
  color: bg === "transparent" ? "#94a3b8" : "#0f172a",
  border: border || "none",
  fontWeight: "bold" as const,
  cursor: "pointer",
  fontSize: "14px",
  minWidth: "160px"
});

