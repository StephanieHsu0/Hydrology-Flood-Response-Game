import sys
import os
from pathlib import Path

# Flexible path finding to work regardless of Vercel Root Directory setting
current_file = Path(__file__).resolve()
# Try to find the 'code' directory starting from current location and moving up
repo_root = current_file.parents[1] # Default: api/../
if not (repo_root / "code").exists():
    repo_root = current_file.parents[2] # api/../../
if not (repo_root / "code").exists():
    repo_root = current_file.parents[3] # api/../../../

backend_path = repo_root / "code" / "backend"

if backend_path.exists():
    sys.path.append(str(backend_path))
    print(f"Added backend path: {backend_path}")
else:
    print(f"CRITICAL: Backend path not found at {backend_path}")

from app.main import app

handler = app
