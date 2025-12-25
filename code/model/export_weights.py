import joblib
import numpy as np
from pathlib import Path

def export():
    model_dir = Path("code/model")
    model = joblib.load(model_dir / "surrogate_model.pkl")
    scaler = joblib.load(model_dir / "scaler.pkl")
    
    # MLP weights and biases
    # model.coefs_ is a list of weight matrices
    # model.intercepts_ is a list of bias vectors
    weights = {f"w_{i}": w for i, w in enumerate(model.coefs_)}
    biases = {f"b_{i}": b for i, b in enumerate(model.intercepts_)}
    
    # Scaler params
    scaler_params = {
        "scaler_mean": scaler.mean_,
        "scaler_scale": scaler.scale_
    }
    
    # Save everything into one npz file
    np.savez(model_dir / "model_weights.npz", **weights, **biases, **scaler_params)
    print(f"Exported weights to {model_dir / 'model_weights.npz'}")

if __name__ == "__main__":
    export()

