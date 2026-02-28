"""
TTS Generator — uses pyttsx3 for offline text-to-speech narration.

Each scene gets a narration WAV file that is later merged with the video clip.
Uses the Windows SAPI5 voices (or espeak on Linux/Mac).
"""

import pyttsx3
import sys
from pathlib import Path

# Explicit sys.path injection for standalone execution resilience
APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))

import config

def _get_engine() -> pyttsx3.Engine:
    """Create and configure a pyttsx3 engine."""
    # On Windows, background threads need COM initialization for SAPI5
    if sys.platform == "win32":
        try:
            import pythoncom
            pythoncom.CoInitialize()
        except ImportError:
            pass

    engine = pyttsx3.init()
    # Set properties for clear narration
    engine.setProperty("rate", 160)      # Words per minute (default ~200, slower = clearer)
    engine.setProperty("volume", 1.0)    # Max volume

    # Try to use a good voice
    voices = engine.getProperty("voices")
    # Prefer a female English voice if available (usually clearer)
    for voice in voices:
        if "zira" in voice.name.lower() or "female" in voice.name.lower():
            engine.setProperty("voice", voice.id)
            break
    else:
        # Fall back to first available voice
        if voices:
            engine.setProperty("voice", voices[0].id)

    return engine


def generate_narration(text: str, output_path: Path) -> Path | None:
    """
    Generate speech audio from text using pyttsx3 (offline).

    Args:
        text: The narration script text.
        output_path: Where to save the WAV/MP3 file.

    Returns:
        Path to the generated audio file, or None on failure.
    """
    try:
        output_path.parent.mkdir(parents=True, exist_ok=True)

        # pyttsx3 saves to file
        engine = _get_engine()
        wav_path = output_path.with_suffix(".wav")
        engine.save_to_file(text, str(wav_path))
        engine.runAndWait()
        engine.stop()

        if wav_path.exists() and wav_path.stat().st_size > 0:
            return wav_path
        else:
            msg = "TTS: file not created or is 0 bytes"
            print(f"      {msg}")
            with open(config.VIDEO_OUTPUT_DIR / "tts_error.log", "a") as f:
                f.write(msg + "\n")
            return None

    except Exception as e:
        print(f"      TTS error: {e}")
        import traceback
        with open(config.VIDEO_OUTPUT_DIR / "tts_error.log", "a") as f:
            f.write(f"TTS error: {e}\n")
            traceback.print_exc(file=f)
        return None


def generate_scene_narrations(
    scenes: list[dict],
    narration_scripts: dict[int, str],
    output_dir: Path,
) -> dict[int, Path]:
    """
    Generate narration audio for each scene.

    Args:
        scenes: List of scene dicts from the planner.
        narration_scripts: Dict mapping scene index to narration text.
        output_dir: Base output directory.

    Returns:
        Dict mapping scene index to WAV file path.
    """
    audio_dir = output_dir / "audio"
    audio_dir.mkdir(exist_ok=True)
    generated = {}

    for scene in scenes:
        idx = scene["index"]
        script = narration_scripts.get(idx, "")
        if not script:
            continue

        wav_path = audio_dir / f"narration_{idx:02d}.wav"
        print(f"   Scene {idx}: Generating narration ({len(script)} chars)...")

        result = generate_narration(script, wav_path)
        if result:
            size_kb = result.stat().st_size / 1024
            print(f"   Scene {idx}: Audio saved ({size_kb:.0f} KB)")
            generated[idx] = result
        else:
            print(f"   Scene {idx}: TTS failed")

    return generated
