import os
from pathlib import Path
from dotenv import load_dotenv

# Resolution of base paths
# config.py is located at backend/app/config.py
APP_DIR = Path(__file__).resolve().parent
BACKEND_DIR = APP_DIR.parent
PROJECT_ROOT = BACKEND_DIR.parent

# Load environment variables once
DOTENV_PATH = PROJECT_ROOT / ".env"
load_dotenv(dotenv_path=DOTENV_PATH)

# Common directories and files
DB_PATH = APP_DIR / "database.db"
VECTOR_DB_DIR = APP_DIR / "vector_store"
CREDENTIALS_FILE = APP_DIR / "credentials.json"
TOKENS_DIR = APP_DIR  # Directory where OAuth PKCE verifiers and token.pickles are saved

# Video Generation Sub-Module Paths
VIDEO_GEN_DIR = APP_DIR / "videoGen"
VIDEO_OUTPUT_DIR = VIDEO_GEN_DIR / "output"
VIDEO_SKILLS_DIR = VIDEO_GEN_DIR / ".agents" / "skills"
REMOTION_PROJECT_DIR = VIDEO_GEN_DIR / "my-video"

# Ensure common directories exist
VIDEO_OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
