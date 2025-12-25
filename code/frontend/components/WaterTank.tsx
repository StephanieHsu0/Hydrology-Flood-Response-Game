import React from "react";

interface Props {
  storage: number;
  maxStorage: number;
  risk: number;
  rain: number;
}

export function WaterTank({ storage, maxStorage, risk, rain }: Props) {
  // Normalize fill percentage (0 to 100)
  const fillPercent = Math.min((storage / maxStorage) * 100, 100);
  
  // Color based on risk with gradient
  const waterColor = risk > 0.75 
    ? "linear-gradient(180deg, #f87171 0%, #ef4444 100%)" 
    : risk > 0.5 
      ? "linear-gradient(180deg, #fbbf24 0%, #f59e0b 100%)" 
      : "linear-gradient(180deg, #60a5fa 0%, #2563eb 100%)";
  
  // Dynamic rain drops based on rain intensity
  const drops = Array.from({ length: Math.min(Math.floor(rain * 5), 100) });

  return (
    <div style={{ 
      position: "relative", 
      width: "100%", 
      height: "350px", 
      background: "linear-gradient(180deg, #0f172a 0%, #1e293b 100%)", 
      borderRadius: "16px", 
      overflow: "hidden",
      border: "3px solid #334155",
      marginTop: "16px",
      boxShadow: "inset 0 0 20px rgba(0,0,0,0.5)"
    }}>
      {/* City Background Silhouette (Simplified SVG) */}
      <div style={{
        position: "absolute",
        bottom: "0",
        left: 0,
        width: "100%",
        height: "60px",
        background: "rgba(15, 23, 42, 0.6)",
        maskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 20\" preserveAspectRatio=\"none\"><path d=\"M0 20 V15 H5 V10 H10 V15 H15 V5 H20 V15 H25 V8 H30 V15 H35 V12 H40 V15 H45 V5 H55 V15 H60 V10 H65 V15 H70 V5 H75 V15 H80 V8 H85 V15 H90 V12 H95 V15 H100 V20 Z\"/></svg>')",
        WebkitMaskImage: "url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" viewBox=\"0 0 100 20\" preserveAspectRatio=\"none\"><path d=\"M0 20 V15 H5 V10 H10 V15 H15 V5 H20 V15 H25 V8 H30 V15 H35 V12 H40 V15 H45 V5 H55 V15 H60 V10 H65 V15 H70 V5 H75 V15 H80 V8 H85 V15 H90 V12 H95 V15 H100 V20 Z\"/></svg>')",
        maskSize: "100% 100%",
        zIndex: 1
      }} />

      {/* Cloud / Mist Overlay for heavy rain */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        background: `rgba(255, 255, 255, ${Math.min(rain / 100, 0.1)})`,
        pointerEvents: "none",
        zIndex: 4
      }} />

      {/* Rain Effect */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 5 }}>
        {drops.map((_, i) => (
          <div
            key={i}
            className="rain-drop"
            style={{
              position: "absolute",
              left: `${Math.random() * 100}%`,
              top: `-50px`,
              width: rain > 40 ? "3px" : "1px",
              height: rain > 40 ? "30px" : "20px",
              background: "rgba(255, 255, 255, 0.6)",
              animation: `fall ${0.3 + Math.random() * 0.4}s linear infinite`,
              animationDelay: `${Math.random() * 1}s`,
              opacity: 0.5 + Math.random() * 0.5
            }}
          />
        ))}
      </div>

      {/* Water Level with Wave Animation */}
      <div style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "200%", // Double width for horizontal slide
        height: `${fillPercent}%`,
        background: waterColor,
        transition: "height 1.5s cubic-bezier(0.4, 0, 0.2, 1), background-color 0.5s",
        opacity: 0.85,
        zIndex: 3,
        animation: "wave 3s infinite alternate ease-in-out"
      }}>
        {/* Surface Sparkle */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "4px",
          background: "rgba(255, 255, 255, 0.4)",
          boxShadow: "0 0 10px rgba(255, 255, 255, 0.5)"
        }} />

        {fillPercent > 15 && (
          <div style={{ 
            position: "absolute",
            top: "20px",
            left: "25%", // Adjust for 200% width
            width: "50%",
            textAlign: "center",
            color: "white", 
            fontWeight: "bold", 
            textShadow: "0 2px 8px rgba(0,0,0,0.7)",
            fontSize: "18px",
            letterSpacing: "1px"
          }}>
            CURRENT STORAGE: {fillPercent.toFixed(1)}%
          </div>
        )}
      </div>

      {/* Warning Overlay */}
      {risk > 0.5 && (
        <div style={{
          position: "absolute",
          top: "20px",
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 20px",
          background: risk > 0.75 ? "rgba(239, 68, 68, 0.9)" : "rgba(245, 158, 11, 0.9)",
          color: "white",
          borderRadius: "30px",
          fontSize: "14px",
          fontWeight: "900",
          zIndex: 10,
          boxShadow: "0 4px 15px rgba(0,0,0,0.4)",
          border: "2px solid rgba(255,255,255,0.3)",
          animation: "blink 0.8s infinite"
        }}>
          {risk > 0.75 ? "CRITICAL FLOOD RISK" : "HIGH WATER LEVEL WARNING"}
        </div>
      )}

      <style jsx>{`
        @keyframes fall {
          to { transform: translateY(400px); }
        }
        @keyframes blink {
          0% { opacity: 1; transform: translateX(-50%) scale(1); }
          50% { opacity: 0.7; transform: translateX(-50%) scale(1.05); }
          100% { opacity: 1; transform: translateX(-50%) scale(1); }
        }
        @keyframes wave {
          from { transform: translateX(0); }
          to { transform: translateX(-25%); }
        }
      `}</style>
    </div>
  );
}

