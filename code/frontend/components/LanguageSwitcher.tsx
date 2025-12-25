import React from "react";
import { useLanguage } from "../lib/LanguageContext";
import { useRouter } from "next/router";

interface LanguageSwitcherProps {
  fixed?: boolean;
}

export function LanguageSwitcher({ fixed = true }: LanguageSwitcherProps) {
  const { lang, setLang, t } = useLanguage();
  const router = useRouter();

  const containerStyle: React.CSSProperties = fixed ? {
    position: "fixed",
    top: 20,
    right: 20,
    zIndex: 1000,
    display: "flex",
    gap: 12,
    alignItems: "center",
    pointerEvents: "none"
  } : {
    display: "flex",
    gap: 12,
    alignItems: "center",
  };

  return (
    <div style={containerStyle}>
      {router.pathname !== "/" && (
        <button
          onClick={() => router.push("/")}
          style={{
            padding: "6px 16px",
            borderRadius: "20px",
            border: "1px solid #334155",
            background: "rgba(30, 41, 59, 0.9)",
            color: "#f1f5f9",
            fontSize: "12px",
            fontWeight: "bold",
            cursor: "pointer",
            backdropFilter: "blur(8px)",
            transition: "all 0.2s",
            pointerEvents: "auto",
            whiteSpace: "nowrap",
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
          }}
        >
          🏠 {t.backToHome}
        </button>
      )}
      
      <div style={{
        display: "flex",
        gap: 2,
        background: "rgba(30, 41, 59, 0.9)",
        padding: "3px",
        borderRadius: "20px",
        border: "1px solid #334155",
        backdropFilter: "blur(8px)",
        pointerEvents: "auto",
        boxShadow: "0 4px 12px rgba(0,0,0,0.3)"
      }}>
        <button
          onClick={() => setLang("zh")}
          style={{
            padding: "6px 12px",
            borderRadius: "16px",
            border: "none",
            background: lang === "zh" ? "#22c55e" : "transparent",
            color: lang === "zh" ? "#0f172a" : "#f1f5f9",
            fontSize: "12px",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
        >
          中
        </button>
        <button
          onClick={() => setLang("en")}
          style={{
            padding: "6px 12px",
            borderRadius: "16px",
            border: "none",
            background: lang === "en" ? "#22c55e" : "transparent",
            color: lang === "en" ? "#0f172a" : "#f1f5f9",
            fontSize: "12px",
            fontWeight: "bold",
            transition: "all 0.2s"
          }}
        >
          EN
        </button>
      </div>
    </div>
  );
}
