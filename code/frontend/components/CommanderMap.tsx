import React from "react";
import { ZoneState } from "../lib/api";
import { useLanguage } from "../lib/LanguageContext";

interface Props {
  zones: Record<string, ZoneState>;
  rain: number;
}

export function CommanderMap({ zones, rain }: Props) {
  const { t } = useLanguage();
  const zoneIds = ["industrial", "residential", "lowland"];

  return (
    <div style={{
      width: "100%",
      height: "400px",
      background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)",
      borderRadius: "20px",
      border: "3px solid #334155",
      position: "relative",
      overflow: "hidden",
      display: "flex",
      boxShadow: "inset 0 0 40px rgba(0,0,0,0.6)"
    }}>
      {/* Universal Rain Layer */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", zIndex: 20, pointerEvents: "none" }}>
        <RainEffect intensity={rain} />
      </div>

      {/* Connective Terrain (Landscape) */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        height: "120px",
        background: "#0f172a",
        opacity: 0.4,
        zIndex: 1
      }} />

      {/* Zones Grid */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr",
        width: "100%",
        height: "100%",
        zIndex: 5
      }}>
        {zoneIds.map((zid) => {
          const zone = zones[zid];
          if (!zone) return null;
          return <Sector key={zid} zone={zone} rain={rain} label={(t as any)[zid] || zone.name} />;
        })}
      </div>
    </div>
  );
}

function Sector({ zone, rain, label }: { zone: ZoneState; rain: number; label: string }) {
  const fillPercent = Math.min((zone.storage / 5) * 100, 100);
  const waterColor = zone.risk > 0.75 
    ? "rgba(239, 68, 68, 0.7)" 
    : zone.risk > 0.5 
      ? "rgba(245, 158, 11, 0.7)" 
      : "rgba(59, 130, 246, 0.6)";

  const getIcon = (id: string) => {
    if (id === "industrial") return "🏭";
    if (id === "residential") return "🏘️";
    return "🌾";
  };

  return (
    <div style={{
      position: "relative",
      borderRight: zone.id !== "lowland" ? "1px dashed rgba(255,255,255,0.1)" : "none",
      display: "flex",
      flexDirection: "column",
      justifyContent: "flex-end"
    }}>
      {/* Sector Info Overlay */}
      <div style={{
        position: "absolute",
        top: "20px",
        left: "50%",
        transform: "translateX(-50%)",
        textAlign: "center",
        zIndex: 30,
        width: "100%"
      }}>
        <div style={{ fontSize: "24px", marginBottom: "4px" }}>{getIcon(zone.id)}</div>
        <div style={{ fontWeight: "900", color: "white", fontSize: "16px", textShadow: "0 2px 4px rgba(0,0,0,0.8)" }}>
          {label}
        </div>
        <div style={{ 
          display: "inline-block",
          marginTop: "6px",
          padding: "2px 10px",
          borderRadius: "12px",
          background: zone.risk > 0.5 ? "#ef4444" : "#22c55e",
          fontSize: "11px",
          fontWeight: "bold",
          color: "white"
        }}>
          Risk: {(zone.risk * 100).toFixed(0)}%
        </div>
      </div>

      {/* Dynamic Water Body */}
      <div style={{
        height: `${fillPercent}%`,
        background: waterColor,
        width: "100%",
        transition: "height 1.2s cubic-bezier(0.4, 0, 0.2, 1)",
        position: "relative",
        boxShadow: "inset 0 10px 20px rgba(255,255,255,0.2)"
      }}>
        {/* Surface Wave Animation */}
        <div style={{
          position: "absolute",
          top: "-5px",
          left: 0,
          width: "100%",
          height: "10px",
          background: "rgba(255,255,255,0.3)",
          filter: "blur(4px)",
          animation: "wave-move 2s infinite alternate ease-in-out"
        }} />
        
        {zone.flooded && (
          <div style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            color: "white",
            fontWeight: "900",
            fontSize: "20px",
            textShadow: "0 0 10px rgba(0,0,0,0.8)",
            animation: "blink 0.5s infinite"
          }}>
            FLOODED
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes wave-move {
          from { transform: scaleX(1); }
          to { transform: scaleX(1.1); }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
      `}</style>
    </div>
  );
}

function RainEffect({ intensity }: { intensity: number }) {
  const dropCount = Math.min(Math.floor(intensity * 6), 150);
  const drops = Array.from({ length: dropCount });

  return (
    <>
      {drops.map((_, i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            left: `${Math.random() * 100}%`,
            top: `-20px`,
            width: intensity > 30 ? "2px" : "1px",
            height: intensity > 30 ? "25px" : "15px",
            background: "rgba(255, 255, 255, 0.4)",
            animation: `fall ${0.3 + Math.random() * 0.3}s linear infinite`,
            animationDelay: `${Math.random() * 1}s`
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fall {
          to { transform: translateY(420px); }
        }
      `}</style>
    </>
  );
}
