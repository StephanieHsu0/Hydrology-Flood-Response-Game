import React from "react";
import { StepResponse } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";

interface TimelineReviewProps {
  history: StepResponse[];
  onClose: () => void;
}

export const TimelineReview: React.FC<TimelineReviewProps> = ({ history, onClose }) => {
  const { lang, t } = useLanguage();

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      background: "rgba(15, 23, 42, 0.95)", zIndex: 10000,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      padding: "40px", backdropFilter: "blur(10px)"
    }}>
      <div style={{
        background: "#1e293b", width: "100%", maxWidth: "1100px", height: "90%",
        borderRadius: "24px", display: "flex", flexDirection: "column",
        overflow: "hidden", border: "1px solid #334155"
      }}>
        <div style={{ padding: "24px", borderBottom: "1px solid #334155", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, color: "#f8fafc" }}>
            {lang === 'zh' ? "歷史決策與環境數據回顧" : "Decision & Environment History"}
          </h2>
          <button onClick={onClose} style={{ 
            background: "#ef4444", color: "white", border: "none", 
            padding: "8px 16px", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" 
          }}>
            {lang === 'zh' ? "關閉" : "Close"}
          </button>
        </div>

        <div style={{ flex: 1, overflowY: "auto", padding: "24px" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px", color: "#cbd5e1" }}>
            <thead>
              <tr style={{ borderBottom: "2px solid #334155", textAlign: "left" }}>
                <th style={thStyle}>{lang === 'zh' ? "小時" : "Hour"}</th>
                <th style={thStyle}>{lang === 'zh' ? "雨量" : "Rain"}</th>
                <th style={thStyle}>{lang === 'zh' ? "平均風險" : "Avg Risk"}</th>
                <th style={thStyle}>{lang === 'zh' ? "AI 建議" : "AI Recommend"}</th>
                <th style={thStyle}>{lang === 'zh' ? "您的決策" : "Your Action"}</th>
                <th style={thStyle}>{lang === 'zh' ? "結果" : "Result"}</th>
              </tr>
            </thead>
            <tbody>
              {history.map((step, idx) => {
                const avgRisk = step.forecast.risk_mean[0] || 0;
                const aiAction = step.recommendation.action;
                const aiZone = step.recommendation.zone_id;
                const playerAction = step.action;
                const playerZone = step.zone_id;
                
                // Compare action with AI rec from PREVIOUS step
                const prevAiRec = idx > 0 ? history[idx-1].recommendation : null;
                const matched = prevAiRec && playerAction === prevAiRec.action && playerZone === prevAiRec.zone_id;

                const isFlooded = Object.values(step.state.zones).some(z => z.flooded);

                return (
                  <tr key={idx} style={{ borderBottom: "1px solid #334155", opacity: idx === 0 ? 0.6 : 1 }}>
                    <td style={tdStyle}>{step.t}</td>
                    <td style={tdStyle}>{step.obs.rain.toFixed(1)}mm</td>
                    <td style={tdStyle}>
                      <span style={{ color: avgRisk > 0.7 ? "#ef4444" : (avgRisk > 0.4 ? "#f59e0b" : "#22c55e") }}>
                        {(avgRisk * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: "11px" }}>
                        {(t as any)[aiAction] || aiAction}
                        {aiZone && <span style={{ color: "#94a3b8" }}> @ {(t as any)[aiZone] || aiZone}</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      <div style={{ fontSize: "11px", color: matched ? "#22c55e" : "#f8fafc" }}>
                        {(t as any)[playerAction] || playerAction}
                        {playerZone && <span style={{ color: "#94a3b8" }}> @ {(t as any)[playerZone] || playerZone}</span>}
                        {matched && idx > 0 && <span title="AI Aligned" style={{ marginLeft: "4px" }}>✅</span>}
                      </div>
                    </td>
                    <td style={tdStyle}>
                      {isFlooded ? (
                        <span style={{ color: "#ef4444", fontSize: "10px", fontWeight: "bold" }}>⚠️ {lang === 'zh' ? "淹水" : "FLOOD"}</span>
                      ) : (
                        <span style={{ color: "#22c55e", fontSize: "10px" }}>OK</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const thStyle: React.CSSProperties = { padding: "12px 8px", color: "#94a3b8", fontWeight: "normal" };
const tdStyle: React.CSSProperties = { padding: "12px 8px" };

