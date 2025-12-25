from __future__ import annotations

import json
import math
import random
import uuid
import logging
import numpy as np
from dataclasses import dataclass, field
from pathlib import Path
from typing import Dict, List, Optional, Any, Tuple

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Absolute path handling for Vercel vs Local
# main.py is in code/backend/app/main.py
# We want the root of 'code/' where 'data/' and 'model/' are siblings of 'backend/'
CURRENT_DIR = Path(__file__).resolve().parent
BASE_DIR = CURRENT_DIR.parents[1] # This should be the 'code' directory

SCENARIO_DIR = BASE_DIR / "data" / "scenarios"
PARAM_FILE = SCENARIO_DIR / "scenario_params.json"
MODEL_DIR = BASE_DIR / "model"

logger.info(f"Paths initialized: BASE_DIR={BASE_DIR}, SCENARIO_DIR={SCENARIO_DIR}")

# Load ML Surrogate Model Parameters (Numpy-only inference to stay under Vercel 250MB limit)
ML_PARAMS = {}
try:
    possible_weights = [
        MODEL_DIR / "model_weights.npz",
        BASE_DIR.parent / "model" / "model_weights.npz",
        Path("/var/task/code/model/model_weights.npz")
    ]
    
    weights_path = None
    for p in possible_weights:
        if p.exists():
            weights_path = p
            logger.info(f"Found weights at {weights_path}")
            break
            
    if weights_path:
        with np.load(weights_path, allow_pickle=True) as data:
            ML_PARAMS = {k: data[k] for k in data.files}
        logger.info("ML weights loaded successfully.")
    else:
        logger.warning(f"No ML weights found at searched paths: {possible_weights}. Falling back to formula.")
except Exception as e:
    logger.error(f"Failed to load ML weights: {e}")

def relu(x):
    return np.maximum(0, x)

def predict_next_storage(current_storage: float, rain: float, effect: float, params: ZoneParams) -> float:
    """Predict next hour storage using Numpy-only inference or fallback to formula."""
    if ML_PARAMS:
        try:
            # 1. Feature preparation
            x = np.array([current_storage, rain, effect, params.a, params.b, params.c])
            
            # 2. Scale features
            x_scaled = (x - ML_PARAMS["scaler_mean"]) / ML_PARAMS["scaler_scale"]
            
            # 3. MLP Forward Pass (Manual inference to remove scikit-learn dependency)
            # Input -> Hidden 1 (64)
            h1 = relu(x_scaled @ ML_PARAMS["w_0"] + ML_PARAMS["b_0"])
            # Hidden 1 -> Hidden 2 (32)
            h2 = relu(h1 @ ML_PARAMS["w_1"] + ML_PARAMS["b_1"])
            # Hidden 2 -> Output (1)
            pred = h2 @ ML_PARAMS["w_2"] + ML_PARAMS["b_2"]
            
            return max(float(pred), 0.0)
        except Exception as e:
            # Silently fallback on inference error
            return max(params.a * current_storage + params.b * rain - params.c * effect, 0.0)
    else:
        # Fallback to deterministic formula
        return max(params.a * current_storage + params.b * rain - params.c * effect, 0.0)


# -----------------------------
# Data models
# -----------------------------

class ActionConfig(BaseModel):
    cost: float
    effect: float

class ZoneParams(BaseModel):
    a: float  # persistence
    b: float  # rain-to-storage
    c: float  # mitigation strength
    threshold: float
    damage_scale: float

class ScenarioParams(BaseModel):
    initial_budget: float
    zones: Dict[str, ZoneParams]

class ScenarioSpec(BaseModel):
    id: str
    name: Any
    csv: str
    description: Any
    time_step_hr: int
    params: ScenarioParams
    actions: Dict[str, ActionConfig]

class StartRequest(BaseModel):
    scenario_id: str
    difficulty: Optional[str] = "standard"

class ZoneState(BaseModel):
    id: str
    name: str
    storage: float
    risk: float
    flooded: bool

class State(BaseModel):
    zones: Dict[str, ZoneState]
    budget: float
    trust: float  # Commander trust level (0-100)
    cooldowns: Dict[str, int]
    done: bool
    game_over: bool
    failure_reason: Optional[str] = None

class StepRequest(BaseModel):
    game_id: str
    action: str
    zone_id: Optional[str] = None

class Observation(BaseModel):
    rain: float
    rain_6h: float
    accum: float

class Forecast(BaseModel):
    risk_mean: List[float]
    risk_std: List[float]
    prob_critical: List[float] # Prob risk > 0.85

class Recommendation(BaseModel):
    action: str
    zone_id: Optional[str] = None
    reason: str
    expected_loss: float
    confidence: float # New field for XAI
    top_reasons: List[str] # New field for XAI

class Reward(BaseModel):
    delta: float
    total: float

class StepResponse(BaseModel):
    action: str
    zone_id: Optional[str] = None
    t: int
    obs: Observation
    state: State
    forecast: Forecast
    recommendation: Recommendation
    reward: Reward
    events: List[str]

class ReplayResponse(BaseModel):
    scenario_id: str
    history: List[StepResponse]


# -----------------------------
# Core logic
# -----------------------------

def sigmoid(x: float) -> float:
    return 1 / (1 + math.exp(-x))

def load_scenarios() -> Dict[str, ScenarioSpec]:
    # Force re-read from disk
    with PARAM_FILE.open("r", encoding="utf-8") as f:
        data = json.load(f)
    scenarios = {}
    for entry in data:
        spec = ScenarioSpec(**entry)
        scenarios[spec.id] = spec
    logger.info(f"Loaded {len(scenarios)} scenarios: {list(scenarios.keys())}")
    for sid, s in scenarios.items():
        logger.info(f"Scenario {sid} actions: {list(s.actions.keys())}")
    return scenarios

def load_rain_series(filename: str) -> List[float]:
    path = SCENARIO_DIR / filename
    values: List[float] = []
    if not path.exists():
        logger.error(f"Rainfall file not found: {path}")
        return [0.0] * 24
    with path.open("r", encoding="utf-8") as f:
        next(f)  # skip header
        for line in f:
            parts = line.strip().split(",")
            if len(parts) != 2: continue
            try:
                values.append(float(parts[1]))
            except ValueError:
                values.append(0.0)
    return values

@dataclass
class GameSession:
    scenario: ScenarioSpec
    rain: List[float]
    zone_storage: Dict[str, float] = field(default_factory=dict)
    budget: float = 0.0
    trust: float = 100.0
    cooldowns: Dict[str, int] = field(default_factory=dict)
    t: int = 0
    total_reward: float = 0.0
    history: List[StepResponse] = field(default_factory=list)
    is_game_over: bool = False
    failure_reason: Optional[str] = None

    def __post_init__(self):
        if not self.zone_storage:
            self.zone_storage = {zid: 0.0 for zid in self.scenario.params.zones}
        if not self.cooldowns:
            self.cooldowns = {aid: 0 for aid in self.scenario.actions}
        if self.budget == 0.0:
            self.budget = self.scenario.params.initial_budget
        logger.info(f"Session initialized. Rain length: {len(self.rain)}")

    def current_obs(self) -> Observation:
        # Step index must be clamped to data length
        idx = max(0, min(self.t - 1, len(self.rain) - 1))
        rain_now = self.rain[idx]
        start = max(0, idx - 5)
        rain_6h = sum(self.rain[start : idx + 1])
        accum = sum(self.rain[: idx + 1])
        return Observation(rain=rain_now, rain_6h=rain_6h, accum=accum)

    def get_state(self) -> State:
        zones = {}
        for zid, storage in self.zone_storage.items():
            params = self.scenario.params.zones[zid]
            risk = sigmoid(storage - params.threshold)
            zones[zid] = ZoneState(
                id=zid,
                name=zid.capitalize(),
                storage=storage,
                risk=risk,
                flooded=risk > 0.8
            )
        # Done means all 24 hours (0-23) have been processed
        is_done = self.t >= len(self.rain)
        return State(
            zones=zones,
            budget=self.budget,
            trust=round(max(self.trust, 0), 1),
            cooldowns=self.cooldowns,
            done=is_done,
            game_over=self.is_game_over,
            failure_reason=self.failure_reason
        )

    def step(self, action_name: str, zone_id: Optional[str] = None) -> StepResponse:
        logger.info(f"--- STEP START: T={self.t} ---")
        
        if self.is_game_over or self.t >= len(self.rain):
            logger.info("Session already closed.")
            return self.history[-1]

        if action_name not in self.scenario.actions:
            raise HTTPException(status_code=400, detail=f"Unknown action: {action_name}")

        action_cfg = self.scenario.actions[action_name]
        
        # Calculate dynamic cost: All zones (zone_id is None) costs more than single zone
        # But 'none' and 'funding' actions don't scale with zones
        final_cost = action_cfg.cost
        if action_name not in ["none", "funding"] and zone_id is None:
            final_cost = action_cfg.cost * 2.5 # 2.5x cost for covering all 3 zones
            
        events = []
        
        # Special handling for "funding" action if it exists
        if action_name == "funding":
            # This is a special action: gain budget, lose trust
            self.budget += action_cfg.effect # Use effect as budget gain
            self.trust -= final_cost    # Use cost as trust penalty
            events.append(f"Emergency Funding: +${action_cfg.effect:.1f} (Penalty: -{final_cost} Trust)")
        else:
            # Normal action: apply cost to budget
            if self.budget < final_cost:
                self.trust -= 8.0 # Debt penalty
            self.budget -= final_cost
        
        # Current rain for this step
        rain_now = self.rain[self.t]
        
        step_damage = 0.0
        for zid, storage in self.zone_storage.items():
            z_params = self.scenario.params.zones[zid]
            effect = action_cfg.effect if (zone_id == zid or zone_id is None) else 0.0
            
            # Storage formula (using ML surrogate)
            new_storage = predict_next_storage(storage, rain_now, effect, z_params)
            self.zone_storage[zid] = new_storage
            
            risk = sigmoid(new_storage - z_params.threshold)
            step_damage += risk * z_params.damage_scale
            
            if risk > 0.85:
                self.trust -= 5.0 # Reduced per-step penalty to prevent instant kill
                events.append(f"CRITICAL FLOODING in {zid.capitalize()}!")
        
        # Reward
        reward_delta = -step_damage - final_cost
        self.total_reward += reward_delta
        
        # Move to next T
        self.t += 1

        # Periodic Funding Mechanism (Every 6 hours)
        if self.t > 0 and self.t % 6 == 0:
            # Base grant + bonus based on trust
            grant = 5.0 + (15.0 * (self.trust / 100.0))
            self.budget += grant
            events.append(f"City Council Grant: +${grant:.1f} (Trust: {self.trust}%)")
        
        # Check death
        if self.trust <= 0:
            self.is_game_over = True
            self.failure_reason = "PUBLIC_OUTRAGE"
            events.append("COMMANDER REMOVED!")

        forecast = self._make_forecast(horizon=3)
        recommendation = self._recommend_action()

        response = StepResponse(
            action=action_name,
            zone_id=zone_id,
            t=self.t, # This will be 1, 2, 3... 24
            obs=self.current_obs(),
            state=self.get_state(),
            forecast=forecast,
            recommendation=recommendation,
            reward=Reward(delta=reward_delta, total=self.total_reward),
            events=list(set(events))
        )
        
        self.history.append(response)
        logger.info(f"--- STEP END: New T={self.t}, Done={response.state.done} ---")
        return response

    def _initial_response(self) -> StepResponse:
        # For initial t=0, we don't have obs yet, or we show t=0 obs
        # Let's say t=0 is the state before any rain is processed
        return StepResponse(
            action="none",
            t=0,
            obs=Observation(rain=0, rain_6h=0, accum=0),
            state=self.get_state(),
            forecast=self._make_forecast(horizon=3),
            recommendation=self._recommend_action(),
            reward=Reward(delta=0.0, total=0.0),
            events=[]
        )

    def _make_forecast(self, horizon: int = 3) -> Forecast:
        samples = 15
        means: List[float] = []
        stds: List[float] = []
        probs: List[float] = []
        
        for h in range(1, horizon + 1):
            risks = []
            idx = min(self.t + h - 1, len(self.rain) - 1)
            base_rain = self.rain[idx]

            for _ in range(samples):
                # Wider perturbation for more dynamic movement
                perturbed_rain = base_rain * random.uniform(0.6, 1.4)
                step_total_risk = 0.0
                for zid, storage in self.zone_storage.items():
                    zp = self.scenario.params.zones[zid]
                    sim_s = predict_next_storage(storage, perturbed_rain, 0.0, zp)
                    risk = sigmoid(sim_s - zp.threshold)
                    step_total_risk += risk
                risks.append(step_total_risk / len(self.zone_storage))
            
            m = sum(risks) / len(risks)
            v = sum((r - m)**2 for r in risks) / len(risks)
            s = math.sqrt(max(v, 0))
            
            means.append(float(round(m, 4)))
            stds.append(float(round(s, 4)))
            # Significant risk probability: sensitive to even moderate increases
            p_sig = len([r for r in risks if r > 0.3]) / len(risks)
            probs.append(float(round(p_sig, 4)))
            
        return Forecast(risk_mean=means, risk_std=stds, prob_critical=probs)

    def _simulate_cvar_rollout(
        self,
        first_action: ActionConfig,
        first_zone: Optional[str],
        horizon: int = 3,
        n_samples: int = 60,
        alpha: float = 0.8,
    ) -> Tuple[float, float, List[float], Dict[str, float]]:
        """
        Risk-sensitive evaluation of an action using CVaR over stochastic rainfall.

        We evaluate applying `first_action` at the current step only, then assume no further
        mitigation actions for the remaining horizon. We perturb rainfall to represent
        forecast uncertainty and compute the distribution of cumulative losses.

        Returns: (cvar, mean_loss, losses, mean_zone_damage_contrib)
        """
        if horizon <= 0:
            return float(first_action.cost), float(first_action.cost), [float(first_action.cost)], {}

        # Clamp alpha for safety
        alpha = float(min(max(alpha, 0.0), 0.999))
        losses: List[float] = []
        zone_damage_sum: Dict[str, float] = {zid: 0.0 for zid in self.zone_storage}

        # Base index is "now" (same as recommendation logic previously)
        base_idx = min(self.t, len(self.rain) - 1)

        for _ in range(n_samples):
            # Copy current storages for simulation
            storages = dict(self.zone_storage)
            total_damage = 0.0
            per_zone_damage = {zid: 0.0 for zid in storages}

            for h in range(horizon):
                idx = min(base_idx + h, len(self.rain) - 1)
                base_rain = self.rain[idx]
                # Uncertainty: allow wider perturbation to model bursty storms
                rain_h = base_rain * random.uniform(0.6, 1.4)

                for zid, s in list(storages.items()):
                    zp = self.scenario.params.zones[zid]
                    # Apply mitigation only on the first simulated hour (the action we are choosing now)
                    effect = 0.0
                    if h == 0:
                        if first_zone is None or first_zone == zid:
                            effect = first_action.effect

                    s_next = predict_next_storage(s, rain_h, effect, zp)
                    storages[zid] = s_next
                    risk = sigmoid(s_next - zp.threshold)
                    dmg = risk * zp.damage_scale
                    total_damage += dmg
                    per_zone_damage[zid] += dmg

            # Include action cost with correct scaling for "all zones"
            action_cost = float(first_action.cost)
            if first_zone is None:
                # Only mitigation actions should be evaluated here; scaling is handled outside
                # but we keep a defensive rule in case the caller forgot.
                action_cost = float(first_action.cost)

            losses.append(action_cost + total_damage)
            for zid, dmg in per_zone_damage.items():
                zone_damage_sum[zid] += dmg

        losses.sort()
        mean_loss = float(sum(losses) / len(losses)) if losses else 0.0

        # CVaR = mean of worst (1-alpha) tail
        if not losses:
            cvar = 0.0
        else:
            tail_start = int(math.floor(alpha * len(losses)))
            tail = losses[tail_start:] if tail_start < len(losses) else [losses[-1]]
            cvar = float(sum(tail) / len(tail))

        # Average per-zone damage contribution (for XAI)
        mean_zone_damage = {zid: (zone_damage_sum[zid] / max(1, n_samples)) for zid in zone_damage_sum}
        return cvar, mean_loss, losses, mean_zone_damage

    def _recommend_action(self) -> Recommendation:
        """
        Recommend an action using a risk-sensitive CVaR objective over a short horizon.

        We optimize the *worst-case tail* (CVaR) of cumulative loss under rainfall uncertainty,
        which is more appropriate for disaster management than average-loss minimization.
        """
        horizon = 3
        n_samples = 60
        alpha = 0.8  # CVaR over worst 20%

        best_action = "none"
        best_zone: Optional[str] = None
        best_cvar = float("inf")
        best_mean = float("inf")
        best_losses: List[float] = []
        best_zone_damage: Dict[str, float] = {}

        # Always allow "none" and "funding" as special actions handled heuristically
        # ("funding" has complex trust tradeoff; we gate it via budget checks)
        candidates: List[Tuple[str, Optional[str], ActionConfig, float]] = []
        for aid, acfg in self.scenario.actions.items():
            if aid in ["none", "funding"]:
                candidates.append((aid, None, acfg, float(acfg.cost)))
            else:
                for zid in self.scenario.params.zones:
                    candidates.append((aid, zid, acfg, float(acfg.cost)))

        # Evaluate CVaR for mitigation actions; keep "none"/"funding" as baselines.
        for aid, zid, acfg, base_cost in candidates:
            if aid == "funding":
                # Funding is only recommended when budget is critically low
                # (uses cost as trust penalty in step(), effect as budget gain)
                if self.budget <= 5.0 and self.trust > 15.0:
                    # Use a synthetic loss metric: lower is better; treat trust penalty as cost
                    # This keeps funding from dominating purely via budget gain.
                    synthetic = base_cost + 10.0
                    if synthetic < best_cvar:
                        best_action, best_zone = aid, None
                        best_cvar, best_mean = synthetic, synthetic
                        best_losses = [synthetic]
                        best_zone_damage = {z: 0.0 for z in self.zone_storage}
                continue

            if aid == "none":
                # Evaluate "none" via CVaR with zero effect
                cvar, mean_loss, losses, zone_dmg = self._simulate_cvar_rollout(
                    first_action=acfg, first_zone=None, horizon=horizon, n_samples=n_samples, alpha=alpha
                )
                if cvar < best_cvar:
                    best_action, best_zone = aid, None
                    best_cvar, best_mean = cvar, mean_loss
                    best_losses, best_zone_damage = losses, zone_dmg
                continue

            # Normal mitigation action (single zone only in this candidate list)
            cvar, mean_loss, losses, zone_dmg = self._simulate_cvar_rollout(
                first_action=acfg, first_zone=zid, horizon=horizon, n_samples=n_samples, alpha=alpha
            )
                
            # Budget/trust-aware penalty: avoid actions you can't afford (debt hurts trust in step()).
            final_cost = float(acfg.cost)
            if self.budget < final_cost:
                cvar += 8.0  # approximate debt-trust penalty

            if cvar < best_cvar:
                best_action, best_zone = aid, zid
                best_cvar, best_mean = cvar, mean_loss
                best_losses, best_zone_damage = losses, zone_dmg

        # Confidence: higher when loss distribution is tight (lower relative dispersion)
        if best_losses:
            m = sum(best_losses) / len(best_losses)
            v = sum((x - m) ** 2 for x in best_losses) / len(best_losses)
            s = math.sqrt(max(v, 0.0))
            # scale into [0.6, 0.99]
            rel = (s / (abs(m) + 1e-6))
            conf_val = float(min(0.99, max(0.6, 1.0 - 2.0 * rel)))
        else:
            conf_val = 0.6

        # XAI: identify most damaging zone under the simulated rollouts
        worst_zone = None
        if best_zone_damage:
            worst_zone = max(best_zone_damage.items(), key=lambda kv: kv[1])[0]

        t_zh = {"industrial": "工業區", "residential": "住宅區", "lowland": "低窪區"}
        zone_label = t_zh.get(best_zone, "") if best_zone else ""
        worst_zone_label = t_zh.get(worst_zone, "") if worst_zone else ""
        
        reasons = {
            "zh": {
                "summary": f"以 CVaR(最差20%) 評估未來 {horizon} 小時最壞情境，選擇能降低尾端損失的行動。",
                "chosen_action": f"建議：{best_action} {zone_label}".strip(),
                "risk_focus": f"主要風險來源：{worst_zone_label}".strip(),
                "budget_note": "若預算不足，行動會引發債務懲罰（信任度下降）。" if self.budget < (self.scenario.actions.get(best_action, ActionConfig(cost=0, effect=0)).cost) else "預算可負擔此行動。",
            },
            "en": {
                "summary": f"Optimizes CVaR (worst 20%) over the next {horizon} hours under rainfall uncertainty.",
                "chosen_action": f"Chosen: {best_action} {best_zone or ''}".strip(),
                "risk_focus": f"Main risk driver: {worst_zone or ''}".strip(),
                "budget_note": "If budget is insufficient, debt penalty will reduce trust." if self.budget < (self.scenario.actions.get(best_action, ActionConfig(cost=0, effect=0)).cost) else "Action is affordable.",
            },
        }

        top_reasons = [
            f"CVaR (worst 20%) over {horizon}-hour horizon with Monte Carlo rainfall perturbations",
            f"Primary projected damage contribution: {worst_zone or 'N/A'}",
            "Includes budget/trust-aware penalty to avoid infeasible actions",
        ]

        return Recommendation(
            action=best_action, 
            zone_id=best_zone, 
            reason=json.dumps(reasons, ensure_ascii=False),
            expected_loss=float(round(best_cvar, 2)),
            confidence=float(round(conf_val, 2)),
            top_reasons=top_reasons,
        )


# -----------------------------
# FastAPI setup
# -----------------------------

app = FastAPI(title="Flood Commander API", version="0.2.3")
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_credentials=True, allow_methods=["*"], allow_headers=["*"])

@app.get("/")
def read_root():
    return {"status": "online", "message": "Flood Commander API is running. Visit port 3001 for the game UI."}

# Vercel specific: handle the /api prefix that comes from rewrites
@app.get("/api")
def read_api_root():
    return read_root()

@app.get("/api/scenarios")
def list_scenarios_api():
    return list_scenarios()

@app.post("/api/start")
def start_game_api(req: StartRequest):
    return start_game(req)

@app.post("/api/step")
def step_game_api(req: StepRequest):
    return step_game(req)

@app.get("/api/replay/{game_id}")
def replay_api(game_id: str):
    return replay(game_id)

@app.get("/api/debug")
def debug_info():
    return {
        "base_dir": str(BASE_DIR),
        "param_file": str(PARAM_FILE),
        "param_file_exists": PARAM_FILE.exists(),
        "model_dir": str(MODEL_DIR),
        "weights_loaded": len(ML_PARAMS) > 0,
        "python_version": sys.version,
        "cwd": os.getcwd()
    }

SCENARIOS = load_scenarios()
RAINFALL: Dict[str, List[float]] = {sid: load_rain_series(spec.csv) for sid, spec in SCENARIOS.items()}
SESSIONS: Dict[str, GameSession] = {}

@app.get("/scenarios")
def list_scenarios():
    global SCENARIOS, RAINFALL
    SCENARIOS = load_scenarios()
    RAINFALL = {sid: load_rain_series(spec.csv) for sid, spec in SCENARIOS.items()}
    return [{"id": spec.id, "name": spec.name, "description": spec.description, "time_step_hr": spec.time_step_hr, "duration_steps": len(RAINFALL.get(spec.id, [])), "params": spec.params.dict(), "actions": {k: v.dict() for k, v in spec.actions.items()}} for spec in SCENARIOS.values()]

@app.post("/start")
def start_game(req: StartRequest):
    global SCENARIOS, RAINFALL
    SCENARIOS = load_scenarios()
    RAINFALL = {sid: load_rain_series(spec.csv) for sid, spec in SCENARIOS.items()}
    if req.scenario_id not in SCENARIOS: raise HTTPException(status_code=404, detail="Scenario not found")
    game_id = str(uuid.uuid4())
    scenario = SCENARIOS[req.scenario_id]
    rain = RAINFALL[req.scenario_id]
    session = GameSession(scenario=scenario, rain=rain)
    SESSIONS[game_id] = session
    initial = session._initial_response()
    session.history.append(initial)
    return {"game_id": game_id, "scenario": scenario, "initial": initial}

@app.post("/step")
def step_game(req: StepRequest):
    if req.game_id not in SESSIONS: raise HTTPException(status_code=404, detail="Game session not found")
    return SESSIONS[req.game_id].step(req.action, req.zone_id)

@app.get("/replay/{game_id}")
def replay(game_id: str):
    if game_id not in SESSIONS: raise HTTPException(status_code=404, detail="Game session not found")
    session = SESSIONS[game_id]
    return ReplayResponse(scenario_id=session.scenario.id, history=session.history)
