# Scenarios

Data lives in `code/data/scenarios/`.

- `scenario_params.json`: metadata, hydrologic params, action cost/effect.
- `weak.csv`: light drizzle tutorial (24 hours).
- `medium.csv`: moderate multi-peak storm.
- `strong.csv`: flash peak with sharp burst and tail.

Key params:
- `a`: storage persistence
- `b`: rain-to-storage factor
- `c`: mitigation strength scaler
- `threshold`: storage at which risk accelerates
- `damage_scale`: maps risk to damage proxy

## Synthetic generation
- See `code/data/generate_scenarios.py`.
- Shapes defined by base rain, peak, rise window, fall window.
- Produces 24-hour series with smooth rise/fall and optional tail.

## Extending
- Add new CSVs, append entries to `scenario_params.json`.
- Keep action dictionaries aligned across scenarios for frontend simplicity.
- For real data, drop CSVs with `timestamp,rain_mm` and tune params to match basin behavior.

