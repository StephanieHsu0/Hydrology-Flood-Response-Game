import React, { createContext, useContext, useState, ReactNode } from "react";

export type Language = "en" | "zh";

interface Translations {
  title: string;
  subtitle: string;
  scenarios: string;
  difficulty: string;
  startGame: string;
  standardDesc: string;
  commandCenter: string;
  step: string;
  liveSim: string;
  simDesc: string;
  rain: string;
  storage: string;
  accum: string;
  actions: string;
  aiAdvisor: string;
  recommended: string;
  confidence: string;
  forecastTitle: string;
  trend: string;
  rising: string;
  declining: string;
  scoreUpdate: string;
  totalScore: string;
  budget: string;
  zonesTitle: string;
  industrial: string;
  residential: string;
  lowland: string;
  targetZone: string;
  anyZone: string;
  floodRisk: string;
  outcomeTitle: string;
  outcomeSubtitle: string;
  peakRisk: string;
  hoursOver: string;
  finalScore: string;
  actionMix: string;
  replayBtn: string;
  newScenarioBtn: string;
  backToHome: string;
  replayTitle: string;
  standard: string;
  aiAssist: string;
  expert: string;
  none: string;
  alert: string;
  pump: string;
  diversion: string;
  evac: string;
  funding: string;
  commanderName: string;
  commanderPlaceholder: string;
  nameRequired: string;
  retrySame: string;
  changeMode: string;
  gameRules: string;
  rulesTitle: string;
  rulesIntro: string;
  rule1: string;
  rule2: string;
  rule3: string;
  rule4: string;
  rule5: string;
  gotIt: string;
}

const translations: Record<Language, Translations> = {
  en: {
    title: "Flood Commander",
    subtitle: "Manage resources across the Tri-Zone area to minimize flood damage.",
    scenarios: "Scenarios",
    difficulty: "Difficulty",
    startGame: "Deploy Commander",
    standardDesc: "Manage three zones (Industrial, Residential, Lowland) with a limited budget.",
    commandCenter: "City Command Center",
    step: "Hour",
    liveSim: "City Map Simulation",
    simDesc: "Real-time flood impact across city zones",
    rain: "Rainfall",
    storage: "Water Level",
    accum: "Total Accum",
    actions: "Commander Actions",
    aiAdvisor: "AI Tactical Advisor",
    recommended: "Recommended:",
    confidence: "Forecast Confidence:",
    forecastTitle: "Short-term Risk",
    trend: "Trend:",
    rising: "Rising",
    declining: "Safe",
    scoreUpdate: "Loss/Cost",
    totalScore: "City Score",
    budget: "Command Budget",
    zonesTitle: "City Zones",
    industrial: "Industrial",
    residential: "Residential",
    lowland: "Lowland",
    targetZone: "Target Zone",
    anyZone: "All/Any",
    floodRisk: "Flood Risk",
    outcomeTitle: "Mission Debrief",
    outcomeSubtitle: "City status after the rainfall event.",
    peakRisk: "Max Risk",
    hoursOver: "Flooded Hours",
    finalScore: "Final Rating",
    actionMix: "Tactical Mix",
    replayBtn: "After-Action Review",
    newScenarioBtn: "New Mission",
    backToHome: "Return to Menu",
    replayTitle: "Mission Timeline",
    standard: "Standard",
    aiAssist: "AI Assist",
    expert: "Expert",
    none: "Standby",
    alert: "Alert",
    pump: "Pump",
    diversion: "Diversion",
    evac: "Evacuate",
    funding: "Request Funding",
    commanderName: "Commander Name",
    commanderPlaceholder: "Enter your name...",
    nameRequired: "Please enter a commander name",
    retrySame: "Retry Mission",
    changeMode: "Change Mode",
    gameRules: "Game Rules",
    rulesTitle: "Mission Briefing: Rules of Engagement",
    rulesIntro: "Welcome, Commander. Your objective is to manage city resources during an extreme rainfall event to minimize damage.",
    rule1: "📊 Each mission lasts 24 hours. Your performance is rated based on damage control and budget efficiency.",
    rule2: "💰 Use your budget to deploy Pumping, Diversion, or Evacuation. Costs vary by zone coverage.",
    rule3: "🤝 Maintain Public Trust. If trust reaches zero, you will be removed from command immediately.",
    rule4: "💸 Request Emergency Funding if you run out of cash, but it will cost you 10% Trust.",
    rule5: "📈 Check the Forecast and AI Advisor to stay ahead of the flood peaks.",
    gotIt: "I Understand, Proceed"
  },
  zh: {
    title: "城市指揮官：洪水應變",
    subtitle: "管理三區資源分配，在有限預算下將城市洪水損失降至最低。",
    scenarios: "選擇任務",
    difficulty: "挑戰難度",
    startGame: "部署指揮官",
    standardDesc: "管理工業區、住宅區、低窪農地。注意預算消耗與各區耐淹力。",
    commandCenter: "城市應變指揮中心",
    step: "目前小時",
    liveSim: "城市動態地圖",
    simDesc: "三區水位與降雨衝擊即時監測",
    rain: "目前降雨",
    storage: "水位深度",
    accum: "累積雨量",
    actions: "指揮官決策",
    aiAdvisor: "AI 戰術顧問",
    recommended: "建議戰術：",
    confidence: "預測信心指數：",
    forecastTitle: "短程風險趨勢",
    trend: "走勢：",
    rising: "風險上升",
    declining: "趨勢穩定",
    scoreUpdate: "損失與成本",
    totalScore: "城市總評分",
    budget: "應變預算",
    zonesTitle: "轄區狀態",
    industrial: "工業區",
    residential: "住宅區",
    lowland: "低窪區",
    targetZone: "目標區域",
    anyZone: "全區/無",
    floodRisk: "淹水風險",
    outcomeTitle: "任務結算報告",
    outcomeSubtitle: "本次降雨事件後的城市災損總結。",
    peakRisk: "峰值風險",
    hoursOver: "淹水時數",
    finalScore: "最終評分",
    actionMix: "戰術分布",
    replayBtn: "深度分析回放",
    newScenarioBtn: "接受新任務",
    backToHome: "返回首頁",
    replayTitle: "任務行動時序表",
    standard: "標準",
    aiAssist: "AI 輔助",
    expert: "專家模式",
    none: "待命",
    alert: "發布警戒",
    pump: "啟動抽水",
    diversion: "開啟分流",
    evac: "緊急撤離",
    funding: "申請緊急預算",
    commanderName: "指揮官姓名",
    commanderPlaceholder: "請輸入您的稱呼...",
    nameRequired: "請先輸入指揮官姓名",
    retrySame: "再玩一次",
    changeMode: "選擇不同模式",
    gameRules: "遊戲規則",
    rulesTitle: "作戰簡報：指揮官手則",
    rulesIntro: "歡迎，指揮官。您的目標是在極端降雨事件中管理城市資源，將災損降至最低。",
    rule1: "📊 任務長度為 24 小時。最終評分取決於災損控制與預算使用效率。",
    rule2: "💰 您可以使用預算執行抽水、分流或撤離。全區執行的成本會高於單區。",
    rule3: "🤝 維持民眾信任度。若信任度歸零，您將被立即解除指揮權。",
    rule4: "💸 若預算不足，可申請緊急預算，但每次會扣除 10% 的信任度。",
    rule5: "📈 隨時關注風險趨勢圖與 AI 戰術顧問，提前佈防洪峰。",
    gotIt: "我瞭解了，開始任務"
  }
};

interface LanguageContextType {
  lang: Language;
  setLang: (lang: Language) => void;
  t: Translations;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Language>("zh");

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: translations[lang] }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
}

