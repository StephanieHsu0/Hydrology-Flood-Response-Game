import React from "react";

interface Props {
  risk: number;
}

export function RiskBadge({ risk }: Props) {
  const level = risk > 0.75 ? "High" : risk > 0.5 ? "Elevated" : "Guarded";
  const color = risk > 0.75 ? "#ef4444" : risk > 0.5 ? "#f59e0b" : "#22c55e";
  return (
    <div
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 10px",
        borderRadius: 10,
        background: "#0b1220",
        border: `1px solid ${color}`,
      }}
    >
      <span style={{ width: 10, height: 10, borderRadius: "50%", background: color }} />
      <div>
        <div style={{ fontSize: 12, color: "#9ca3af" }}>Risk</div>
        <div style={{ fontWeight: 700 }}>
          {level} ({(risk * 100).toFixed(0)}%)
        </div>
      </div>
    </div>
  );
}

