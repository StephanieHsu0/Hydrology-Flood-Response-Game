import { StepResponse } from "./api";

export type EndReason = "TIME_UP" | "TRUST_ZERO" | "BUDGET_ZERO" | "TOTAL_COLLAPSE";

export interface GameSummary {
  finalScore: number;
  totalDamage: number;
  totalCost: number;
  finalTrust: number;
  endReason: EndReason;
  aiAdoptionRate: number;
  matchCount: number;
  decisionCount: number;
  floodedHoursByZone: Record<string, number>;
  worstHour: number;
  endingTitle: string;
  endingDescription: string;
}

const DAMAGE_CAP = 1000; // Adjusted based on expected cumulative damage
const COST_CAP = 150;    // Adjusted based on typical action costs

export function computeSummary(history: StepResponse[], endReason: EndReason, lang: string): GameSummary {
  let totalDamage = 0;
  let totalCost = 0;
  let matchCount = 0;
  let decisionCount = 0;
  let worstHour = 0;
  let maxDamageThisHour = -1;
  const floodedHoursByZone: Record<string, number> = {};

  // Initialize flooded hours for each zone found in history
  if (history.length > 0) {
    Object.keys(history[0].state.zones).forEach(zid => {
      floodedHoursByZone[zid] = 0;
    });
  }

  history.forEach((step, index) => {
    // Damage this hour: sum of risks (or use a scaled value)
    let damageThisHour = 0;
    Object.values(step.state.zones).forEach(zone => {
      damageThisHour += zone.risk * 10; // Simple scaling
      if (zone.flooded) {
        floodedHoursByZone[zone.id] = (floodedHoursByZone[zone.id] || 0) + 1;
      }
    });
    totalDamage += damageThisHour;

    if (damageThisHour > maxDamageThisHour) {
      maxDamageThisHour = damageThisHour;
      worstHour = step.t;
    }

    // Cost this hour: delta reward usually captures -damage - cost
    // Since reward.delta = -damage - cost, and we want cost:
    // But cost is explicitly available in scenario params which we might not have here.
    // Let's estimate cost from delta and damage if needed, or better, 
    // if we had a dedicated 'cost' field in StepResponse.
    // For now, let's assume we can track it by looking at the action taken.
    // However, we don't have the scenario costs here easily. 
    // Let's rely on a simplified 'totalCost' if possible, or just use the delta.
    // Actually, let's just use a fixed cost table for estimation or keep it simple.
    // In a real app, the backend should probably return the cost of the step.
    // Given the backend code, reward.delta = -step_damage - action_cfg.cost.
    // So action_cost = -reward.delta - step_damage.
    
    // We'll approximate cost since we don't have scenario_params here.
    // If action is "none", cost is usually 0.
    if (step.action !== "none") {
        // Approximate cost from reward delta and our calculated damage
        const approxCost = Math.max(0, -step.reward.delta - (damageThisHour / 10)); // reverse the 10x scaling
        totalCost += approxCost;
    }

    // AI Adoption: compare player's action at step N with AI recommendation from step N-1
    if (index > 0) {
      const prevStep = history[index - 1];
      const aiRec = prevStep.recommendation;
      const playerAction = step.action;
      const playerZone = step.zone_id;

      if (playerAction !== "none") {
        decisionCount++;
        if (playerAction === aiRec.action && playerZone === aiRec.zone_id) {
          matchCount++;
        }
      }
    }
  });

  const finalTrust = history.length > 0 ? history[history.length - 1].state.trust : 0;
  
  // Normalization for scoring
  const damageNorm = Math.min(1, totalDamage / DAMAGE_CAP);
  const costNorm = Math.min(1, totalCost / COST_CAP);
  const trustNorm = Math.min(1, finalTrust / 100);

  // Score formula: 50% damage mitigation, 20% cost efficiency, 30% trust
  const finalScore = Math.round(100 * (0.5 * (1 - damageNorm) + 0.2 * (1 - costNorm) + 0.3 * trustNorm));

  // Determine Ending
  let endingTitle = "";
  let endingDescription = "";

  if (endReason === "TRUST_ZERO") {
    endingTitle = lang === "zh" ? "失去民心" : "Lost Public Trust";
    endingDescription = lang === "zh" ? "民眾對您的應變能力完全失去信心，指揮權已被收回。" : "The public has lost all confidence in your response. Command has been revoked.";
  } else if (endReason === "BUDGET_ZERO") {
    endingTitle = lang === "zh" ? "財政崩潰" : "Financial Collapse";
    endingDescription = lang === "zh" ? "預算完全耗盡，救援物資與設備無法繼續運作。" : "Budget is completely depleted. Rescue supplies and equipment can no longer operate.";
  } else {
    if (finalScore >= 85) {
      endingTitle = lang === "zh" ? "模範指揮官" : "Model Commander";
      endingDescription = lang === "zh" ? "您卓越的決策成功將損害降至最低，並贏得了民眾的高度信任。" : "Your excellent decisions minimized damage and earned high public trust.";
    } else if (finalScore >= 60) {
      endingTitle = lang === "zh" ? "穩健決策者" : "Reliable Bureaucrat";
      endingDescription = lang === "zh" ? "雖然有一定的損害與支出，但您穩定地完成了救災任務。" : "Despite some damage and costs, you successfully completed the disaster relief mission.";
    } else {
      endingTitle = lang === "zh" ? "慘澹收場" : "Poor Response";
      endingDescription = lang === "zh" ? "損害超出了預期，災後的重建之路將異常漫長。" : "Damage exceeded expectations. The road to recovery will be exceptionally long.";
    }
  }

  return {
    finalScore,
    totalDamage,
    totalCost,
    finalTrust,
    endReason,
    aiAdoptionRate: decisionCount > 0 ? matchCount / decisionCount : 0,
    matchCount,
    decisionCount,
    floodedHoursByZone,
    worstHour,
    endingTitle,
    endingDescription
  };
}

