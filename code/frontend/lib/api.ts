export type ActionName = "none" | "alert" | "pump" | "diversion" | "evac" | "funding";

export interface ZoneState {
  id: string;
  name: string;
  storage: number;
  risk: number;
  flooded: boolean;
}

export interface State {
  zones: Record<string, ZoneState>;
  budget: number;
  trust: number;
  cooldowns: Record<string, number>;
  done: boolean;
  game_over: boolean;
  failure_reason?: string;
}

export interface Observation {
  rain: number;
  rain_6h: number;
  accum: number;
}

export interface Forecast {
  risk_mean: number[];
  risk_std: number[];
  prob_critical: number[];
}

export interface Reward {
  delta: number;
  total: number;
}

export interface ScenarioSummary {
  id: string;
  name: string | Record<string, string>;
  description: string | Record<string, string>;
  time_step_hr: number;
  duration_steps: number;
  params: {
    initial_budget: number;
    zones: Record<string, { threshold: number }>;
  };
  actions: Record<string, { cost: number; effect: number }>;
}

export interface Recommendation {
  action: ActionName | string;
  zone_id: string | null;
  reason: string;
  expected_loss: number;
  confidence: number;
  top_reasons: string[];
}

export interface StepResponse {
  action: ActionName | string;
  zone_id: string | null;
  t: number;
  obs: Observation;
  state: State;
  forecast: Forecast;
  recommendation: Recommendation;
  reward: Reward;
  events: string[];
}

export interface StartResponse {
  game_id: string;
  scenario: ScenarioSummary;
  initial: StepResponse;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function handle<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const detail = await res.text();
    throw new Error(detail || "Request failed");
  }
  return res.json();
}

export async function fetchScenarios(): Promise<ScenarioSummary[]> {
  const res = await fetch(`${API_BASE}/scenarios?t=${Date.now()}`);
  return handle<ScenarioSummary[]>(res);
}

export async function startGame(scenario_id: string, difficulty = "standard"): Promise<StartResponse> {
  const res = await fetch(`${API_BASE}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scenario_id, difficulty }),
  });
  return handle<StartResponse>(res);
}

export async function sendAction(game_id: string, action: ActionName, zone_id?: string): Promise<StepResponse> {
  const res = await fetch(`${API_BASE}/step`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ game_id, action, zone_id }),
  });
  return handle<StepResponse>(res);
}

export async function fetchReplay(game_id: string): Promise<{ scenario_id: string; history: StepResponse[] }> {
  const res = await fetch(`${API_BASE}/replay/${game_id}`);
  return handle(res);
}
