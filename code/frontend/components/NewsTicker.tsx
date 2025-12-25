import React from "react";
import { StepResponse, ActionName } from "../lib/api";

interface Props {
  current: StepResponse;
}

export function NewsTicker({ current }: Props) {
  const getNewsMessage = () => {
    // 1. Check for specific actions
    if (current.action === "evac") return "BREAKING: Emergency evacuation ordered! Traffic gridlock reported in low-lying areas.";
    if (current.action === "diversion") return "UPDATE: Flood diversion channels opened. River levels stabilized near the industrial zone.";
    if (current.action === "pump") return "CITY BEAT: Municipal pumps at full capacity. Local residents report receding waters.";
    if (current.action === "alert") return "NEWS: Yellow alert issued. Citizens advised to prepare emergency kits.";

    // 2. Check for risk levels
    const maxRisk = Math.max(...Object.values(current.state.zones).map(z => z.risk));
    if (maxRisk > 0.8) return "CRITICAL: Multiple flash flood reports! Emergency services overwhelmed.";
    if (maxRisk > 0.5) return "CAUTION: Water logging detected on major highways. Commuters advised to take alternate routes.";
    if (current.obs.rain > 30) return "WEATHER: Extreme downpour recorded! Stay indoors if possible.";
    if (current.obs.rain > 10) return "WEATHER: Steady rainfall expected to continue for the next few hours.";
    
    if (current.state.done) return "EVENT END: Rainfall subsided. Damage assessment teams deploying shortly.";

    return "LATEST: Routine weather monitoring in progress. No major incidents reported.";
  };

  const message = getNewsMessage();

  return (
    <div style={{
      background: "#020617",
      border: "1px solid #1e293b",
      padding: "8px 16px",
      borderRadius: "8px",
      marginTop: "16px",
      display: "flex",
      alignItems: "center",
      overflow: "hidden",
      color: "#f1f5f9"
    }}>
      <div style={{
        background: "#ef4444",
        color: "white",
        padding: "2px 8px",
        borderRadius: "4px",
        fontSize: "12px",
        fontWeight: "bold",
        marginRight: "12px",
        flexShrink: 0
      }}>
        LIVE
      </div>
      <div style={{
        flexGrow: 1,
        overflow: "hidden",
        position: "relative"
      }}>
        <div style={{
          whiteSpace: "nowrap",
          fontSize: "14px",
          fontWeight: 500,
          animation: "marquee 15s linear infinite"
        }}>
          {message}
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
      `}</style>
    </div>
  );
}

