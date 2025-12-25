import pandas as pd
import numpy as np
from sklearn.neural_network import MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
import joblib
from pathlib import Path

def train_model():
    data_path = Path("code/model/training_data.csv")
    if not data_path.exists():
        print("Data not found. Run data_gen.py first.")
        return

    df = pd.read_csv(data_path)
    
    # Features: current_storage, rain_now, action_effect, zone_a, zone_b, zone_c
    X = df[["current_storage", "rain_now", "action_effect", "zone_a", "zone_b", "zone_c"]]
    y = df["next_storage"]
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_test_scaled = scaler.transform(X_test)
    
    print("Training MLP Surrogate Model...")
    model = MLPRegressor(
        hidden_layer_sizes=(64, 32),
        activation='relu',
        solver='adam',
        max_iter=500,
        random_state=42
    )
    
    model.fit(X_train_scaled, y_train)
    
    score = model.score(X_test_scaled, y_test)
    print(f"Model R^2 Score: {score:.4f}")
    
    # Save model and scaler
    model_dir = Path("code/model")
    joblib.dump(model, model_dir / "surrogate_model.pkl")
    joblib.dump(scaler, model_dir / "scaler.pkl")
    print(f"Model and scaler saved to {model_dir}")

if __name__ == "__main__":
    train_model()

