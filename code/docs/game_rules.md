# Game Rules & Scoring

## Game loop
- Horizon: one rainfall event (24 steps @ 1 hour).
- Player picks an action each step (or stays idle).
- Backend updates storage, risk, reward, and returns AI forecast/recommendation.

## Hydrologic surrogate
- State: storage `S`.
- Update: `S(t+1) = a * S(t) + b * Rain(t) - c * Effect(action)`
- Risk: `risk(t) = sigmoid(S(t) - threshold)`
- Damage proxy: `damage = risk * damage_scale`

## Actions
- `none`: cost 0, effect 0.
- `alert`: low cost, small reduction.
- `pump`: medium cost, drains storage.
- `diversion`: higher cost, stronger effect.
- `evac`: highest cost, strongest effect (use for high risk).

Action costs/effects are scenario-specific (see `scenario_params.json`).

## Reward
- Reward delta each step: `-(damage + action_cost)` (higher is better).
- Total score is cumulative reward; aim to minimize damage while spending wisely.

## Uncertainty & AI
- Monte Carlo forecast (rain ±10%) for next 3 hours yields `risk_mean` and `risk_std`.
- Recommendation selects action with minimum expected loss (`damage + cost`).
- Explanations are rule-based per chosen action.

## Win/loss intuition
- Keep risk below ~0.7 to avoid WARNING events.
- Use cheap alerts early, pumps/diversion near peaks, evac only at high risk.
- Watch uncertainty: high std suggests earlier action to hedge.

