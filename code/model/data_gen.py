import json
import random
import pandas as pd
from pathlib import Path

# Constants from scenario_params.json logic
# Adjusting path to be relative to workspace root if needed, 
# but usually run from root.
SCENARIO_PARAMS_PATH = Path("code/data/scenarios/scenario_params.json")

def load_params():
    with open(SCENARIO_PARAMS_PATH, "r", encoding="utf-8") as f:
        return json.load(f)

def generate_data(num_samples=10000):
    scenarios = load_params()
    data = []
    
    for _ in range(num_samples):
        # Pick a random scenario
        scenario = random.choice(scenarios)
        zones = scenario["params"]["zones"]
        actions = scenario["actions"]
        
        # Pick a random zone
        zone_id = random.choice(list(zones.keys()))
        z_params = zones[zone_id]
        
        # Current state (randomized)
        current_storage = random.uniform(0, 5.0)
        # Randomize rain more realistically but include extremes
        if random.random() < 0.1:
            rain_now = random.uniform(40, 100.0) # Extremes
        else:
            rain_now = random.uniform(0, 40.0)
        
        # Pick a random action
        action_name = random.choice(list(actions.keys()))
        action_cfg = actions[action_name]
        
        # Randomly decide if this action applies to this zone
        is_target_zone = random.choice([True, False])
        effect = action_cfg["effect"] if is_target_zone else 0.0
        
        # Transition logic from main.py:
        # new_storage = z_params.a * storage + z_params.b * rain_now - z_params.c * effect
        new_storage = z_params["a"] * current_storage + z_params["b"] * rain_now - z_params["c"] * effect
        new_storage = max(new_storage, 0.0)
        
        data.append({
            "current_storage": current_storage,
            "rain_now": rain_now,
            "action_effect": effect,
            "zone_a": z_params["a"],
            "zone_b": z_params["b"],
            "zone_c": z_params["c"],
            "next_storage": new_storage
        })
        
    return pd.DataFrame(data)

if __name__ == "__main__":
    df = generate_data(20000)
    output_dir = Path("code/model")
    output_dir.mkdir(exist_ok=True)
    output_path = output_dir / "training_data.csv"
    df.to_csv(output_path, index=False)
    print(f"Generated {len(df)} samples and saved to {output_path}")

