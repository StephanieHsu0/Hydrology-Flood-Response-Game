import sys
from pathlib import Path


def find_code_dir(start: Path) -> Path:
    """
    Find the repository's `code/` directory by walking upwards from `start`.
    We detect it by the presence of:
      - backend/app/main.py
      - data/scenarios/
    """
    for p in [start] + list(start.parents):
        # Case A: we're already inside the `code/` directory
        if (p / "backend" / "app" / "main.py").exists() and (p / "data" / "scenarios").exists():
            return p
        # Case B: we're at repo root and `code/` is a subdirectory
        if (p / "code" / "backend" / "app" / "main.py").exists() and (p / "code" / "data" / "scenarios").exists():
            return p / "code"
    raise RuntimeError(f"Could not locate code/ directory starting from {start}")


CURRENT_FILE = Path(__file__).resolve()
CODE_DIR = find_code_dir(CURRENT_FILE.parent)
BACKEND_PATH = CODE_DIR / "backend"

sys.path.insert(0, str(BACKEND_PATH))

from app.main import app  # noqa: E402

# Vercel Python runtime expects an ASGI app exposed as `app`
app = app
