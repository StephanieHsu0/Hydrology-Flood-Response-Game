import sys
from pathlib import Path

# Add the project root and backend path to sys.path so we can import the app
ROOT_DIR = Path(__file__).resolve().parents[1]
sys.path.append(str(ROOT_DIR / "code" / "backend"))

from app.main import app

# Vercel needs a 'handler' or the app instance itself
handler = app

