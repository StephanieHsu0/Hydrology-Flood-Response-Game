# Flood Decision Game API

Base URL: `http://localhost:8000`

## Endpoints

### GET /scenarios
Returns available rainfall scenarios and action configs.

Response:
- `id`, `name`, `description`
- `time_step_hr`, `duration_steps`
- `params` (a, b, c, threshold, damage_scale)
- `actions` (cost, effect)

### POST /start
Begin a session.

Request body:
```json
{ "scenario_id": "weak_drizzle", "difficulty": "standard" }
```

Response:
- `game_id`: UUID for later calls
- `scenario`: scenario metadata
- `initial`: `StepResponse` at t=0 (no action yet)

### POST /step
Advance one timestep with an action.

Request body:
```json
{ "game_id": "uuid", "action": "pump" }
```

Response (`StepResponse`):
- `action`: action applied
- `t`: timestep index
- `obs`: `{rain, rain_6h, accum}`
- `state`: `{storage, risk, done}`
- `forecast`: `{risk_mean[], risk_std[]}` for next 3 hours
- `recommendation`: AI suggestion with expected_loss
- `reward`: `{delta, total}`
- `events`: textual flags (e.g., WARNING)

### GET /replay/{game_id}
Returns full `history` (list of `StepResponse`) for analysis/replay.

## Model notes
- Storage update: `S(t+1) = a*S(t) + b*Rain(t) - c*Effect(action)`
- Risk: `sigmoid(S - threshold)`
- Damage proxy: `risk * damage_scale`
- Reward delta: `-(damage + action_cost)` (higher is better)
- Uncertainty: Monte Carlo perturbation of rain (±10%) over 3-step horizon, returning mean/std.



