"""
Output Manager — handles saving generated video code files to disk,
rendering individual scene clips, and merging them into a final video.
"""

import sys
import os
import re
import shutil
import subprocess
from pathlib import Path
from datetime import datetime

# Explicit sys.path injection for standalone execution resilience
APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))


import config

# ── MiKTeX path (Windows) ──────────────────────────────────────────────
MIKTEX_BIN = Path.home() / "AppData" / "Local" / "Programs" / "MiKTeX" / "miktex" / "bin" / "x64"

# ── Remotion project path ──────────────────────────────────────────────
REMOTION_PROJECT = config.REMOTION_PROJECT_DIR


def slugify(text: str, max_length: int = 40) -> str:
    """Convert text to a filesystem-safe slug."""
    slug = re.sub(r"[^\w\s-]", "", text.lower())
    slug = re.sub(r"[\s_]+", "-", slug).strip("-")
    return slug[:max_length]


def create_output_dir(topic: str, base_dir: str | Path | None = None) -> Path:
    """Create a timestamped output directory."""
    if base_dir is None:
        base_dir = config.VIDEO_OUTPUT_DIR
    timestamp = datetime.now().strftime("%Y-%m-%d_%H%M")
    dir_name = f"{timestamp}_{slugify(topic)}"
    output_dir = Path(base_dir) / dir_name
    output_dir.mkdir(parents=True, exist_ok=True)
    (output_dir / "clips").mkdir(exist_ok=True)
    return output_dir


def save_scene_plan(output_dir: Path, content: str) -> Path:
    """Save the scene plan to scenes.md."""
    path = output_dir / "scenes.md"
    path.write_text(content, encoding="utf-8")
    return path


def save_manim_code(output_dir: Path, content: str) -> Path:
    """Save the Manim Python code to scene.py."""
    path = output_dir / "scene.py"
    path.write_text(content, encoding="utf-8")
    return path


def save_remotion_files(output_dir: Path, root_tsx: str, comp_tsx: str) -> list[Path]:
    """Save the Remotion TypeScript files."""
    remotion_dir = output_dir / "remotion"
    remotion_dir.mkdir(parents=True, exist_ok=True)

    paths = []
    root_path = remotion_dir / "Root.tsx"
    root_path.write_text(root_tsx, encoding="utf-8")
    paths.append(root_path)

    comp_path = remotion_dir / "MyComp.tsx"
    comp_path.write_text(comp_tsx, encoding="utf-8")
    paths.append(comp_path)

    return paths


def _detect_scene_classes(scene_py: Path) -> list[str]:
    """Extract ALL Scene class names from a Manim .py file."""
    content = scene_py.read_text(encoding="utf-8")
    matches = re.findall(r"class\s+(\w+)\s*\(.*Scene.*\)", content)
    return matches


def _detect_composition_ids(root_tsx: Path) -> list[str]:
    """Extract all Remotion Composition ids from Root.tsx."""
    content = root_tsx.read_text(encoding="utf-8")
    matches = re.findall(r'id=["\'](\w+)["\']', content)
    return matches


def _get_env_with_miktex() -> dict:
    """Return a copy of os.environ with MiKTeX bin added to PATH."""
    env = os.environ.copy()
    if MIKTEX_BIN.exists():
        env["PATH"] = str(MIKTEX_BIN) + os.pathsep + env.get("PATH", "")
    return env


def render_manim_scenes(
    output_dir: Path,
    manim_scenes: list[dict],
) -> tuple[dict[int, Path], list[dict]]:
    """
    Render each Manim Scene class as an individual clip (single attempt).

    Args:
        output_dir: Directory containing scene.py
        manim_scenes: List of scene dicts with 'index' and 'class_name'

    Returns:
        Tuple of (rendered clips dict, failed scenes list).
        - rendered: Dict mapping scene index to rendered clip path
        - failed: List of (scene_dict, error_text) for scenes that failed
    """
    scene_py = output_dir / "scene.py"
    if not scene_py.exists():
        print("   scene.py not found, skipping Manim render")
        return {}, list(manim_scenes)

    env = _get_env_with_miktex()
    clips_dir = output_dir / "clips"
    rendered = {}
    failed = []

    for scene in manim_scenes:
        class_name = scene["class_name"]
        scene_idx = scene["index"]
        clip_path = clips_dir / f"clip_{scene_idx:02d}.mp4"

        print(f"\n   Rendering Manim Scene {scene_idx}: {class_name}...")

        try:
            result = subprocess.run(
                [sys.executable, "-m", "manim", "-qh", "scene.py", class_name],
                cwd=str(output_dir),
                env=env,
                capture_output=True,
                text=True,
                timeout=300,
            )

            if result.returncode == 0:
                # Find rendered MP4
                media_dir = output_dir / "media" / "videos" / "scene" / "1080p60"
                mp4_files = list(media_dir.glob(f"{class_name}.mp4")) if media_dir.exists() else []
                if mp4_files:
                    shutil.copy2(mp4_files[0], clip_path)
                    print(f"   Rendered: clip_{scene_idx:02d}.mp4")
                    rendered[scene_idx] = clip_path
                else:
                    print(f"   Scene {scene_idx} rendered but MP4 not found — will fall back to Remotion")
                    failed.append((scene, "MP4 file not found after successful render"))
            else:
                error_text = result.stderr.strip() or result.stdout.strip()
                error_lines = error_text.split("\n")[-30:]
                error_summary = "\n".join(error_lines)

                print(f"   Scene {scene_idx} FAILED — will fall back to Remotion")
                for line in error_lines[-2:]:
                    print(f"      {line.strip()}")

                failed.append((scene, error_summary))

        except subprocess.TimeoutExpired:
            print(f"   Scene {scene_idx} timed out — will fall back to Remotion")
            failed.append((scene, "Manim render timed out (>300s)"))
        except FileNotFoundError:
            print("   Manim not installed or not on PATH — all remaining scenes will fall back")
            # Mark this and all remaining scenes as failed
            failed.append((scene, "Manim not installed or not on PATH"))
            remaining = [s for s in manim_scenes if s["index"] > scene_idx]
            for s in remaining:
                failed.append((s, "Manim not installed or not on PATH"))
            break

    return rendered, failed


def render_remotion_scenes(
    output_dir: Path,
    remotion_scenes: list[dict],
) -> dict[int, Path]:
    """
    Render each Remotion composition as an individual clip.

    Returns:
        Dict mapping scene index to rendered clip path
    """
    remotion_src = output_dir / "remotion"
    if not remotion_src.exists():
        print("   Remotion files not found, skipping")
        return {}

    if not REMOTION_PROJECT.exists():
        print("   Remotion project (my-video/) not found, skipping")
        return {}

    # Copy generated files into the Remotion project
    project_src = REMOTION_PROJECT / "src"
    for tsx_file in remotion_src.glob("*.tsx"):
        dest = project_src / tsx_file.name
        shutil.copy2(tsx_file, dest)
        print(f"   Copied {tsx_file.name} -> my-video/src/")

    # Patch Root.tsx: ensure export matches what index.ts expects (RemotionRoot)
    root_tsx = project_src / "Root.tsx"
    if root_tsx.exists():
        content = root_tsx.read_text(encoding="utf-8")
        # Fix common export name mismatches
        if "export const Root:" in content or "export const Root " in content:
            content = content.replace("export const Root:", "export const RemotionRoot:")
            content = content.replace("export const Root ", "export const RemotionRoot ")
            root_tsx.write_text(content, encoding="utf-8")
            print("   Patched Root.tsx: export name -> RemotionRoot")

    clips_dir = output_dir / "clips"
    rendered = {}

    for scene in remotion_scenes:
        comp_id = scene["comp_id"]
        scene_idx = scene["index"]
        clip_path = clips_dir / f"clip_{scene_idx:02d}.mp4"

        print(f"\n   Rendering Remotion Scene {scene_idx}: {comp_id}...")

        # Sanity check: is this ID in Root.tsx?
        if root_tsx.exists():
            root_content = root_tsx.read_text(encoding="utf-8")
            if f'id="{comp_id}"' not in root_content and f"id='{comp_id}'" not in root_content:
                print(f"      WARNING: Composition ID '{comp_id}' not found in Root.tsx! Rendering will likely fail.")

        try:
            result = subprocess.run(
                ["npx", "remotion", "render", comp_id, str(clip_path.resolve())],
                cwd=str(REMOTION_PROJECT),
                capture_output=True,
                text=True,
                timeout=600,
                shell=True,
            )

            if result.returncode == 0 and clip_path.exists():
                print(f"   Rendered: clip_{scene_idx:02d}.mp4")
                rendered[scene_idx] = clip_path
            else:
                # Check default output location
                default_out = REMOTION_PROJECT / "out" / f"{comp_id}.mp4"
                if default_out.exists():
                    shutil.copy2(default_out, clip_path)
                    print(f"   Rendered: clip_{scene_idx:02d}.mp4")
                    rendered[scene_idx] = clip_path
                else:
                    print(f"   Scene {scene_idx} render failed")
                    stderr = result.stderr.strip().split("\n")[-3:]
                    for line in stderr:
                        print(f"      {line.strip()}")

        except subprocess.TimeoutExpired:
            print(f"   Scene {scene_idx} timed out")
        except FileNotFoundError:
            print("   npx/Node.js not installed")
            return rendered

    return rendered


def merge_clips(
    output_dir: Path,
    all_scenes: list[dict],
    rendered_clips: dict[int, Path],
    narration_audio: dict[int, Path] | None = None,
) -> Path | None:
    """
    Merge all rendered clips in scene order into one final video.
    If narration audio is provided, overlay it onto each clip.

    Returns:
        Path to the final merged video, or None if merging failed.
    """
    if not rendered_clips:
        print("   No clips to merge")
        return None

    narration_audio = narration_audio or {}
    clips_dir = output_dir / "clips"
    final_path = output_dir / "final_video.mp4"

    # Build ordered list of clips with their scene indices
    ordered_clips = []
    ordered_indices = []
    for scene in sorted(all_scenes, key=lambda s: s["index"]):
        idx = scene["index"]
        if idx in rendered_clips:
            ordered_clips.append(rendered_clips[idx])
            ordered_indices.append(idx)

    if len(ordered_clips) == 0:
        return None

    if len(ordered_clips) == 1 and ordered_indices[0] not in narration_audio:
        # Only one clip, no audio — just copy it
        shutil.copy2(ordered_clips[0], final_path)
        print(f"\n   Final video (1 clip): {final_path.name}")
        return final_path

    # Step 1: Normalize all clips to the same format + add audio
    norm_dir = clips_dir / "normalized"
    norm_dir.mkdir(exist_ok=True)
    normalized_clips = []

    print(f"\n   Normalizing {len(ordered_clips)} clips...")

    for i, (clip_path, scene_idx) in enumerate(zip(ordered_clips, ordered_indices)):
        norm_path = norm_dir / f"norm_{i:02d}.mp4"
        audio_path = narration_audio.get(scene_idx)

        try:
            if audio_path and audio_path.exists():
                # Normalize video AND merge audio
                # tpad clones the last frame so video extends to match audio length
                result = subprocess.run(
                    ["ffmpeg", "-y", "-i", str(clip_path), "-i", str(audio_path),
                     "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1,tpad=stop_mode=clone:stop=-1",
                     "-r", "30", "-c:v", "libx264", "-preset", "fast",
                     "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "192k",
                     "-map", "0:v:0", "-map", "1:a:0",
                     "-shortest",
                     str(norm_path)],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                suffix = " + audio"
            else:
                # Normalize video only (silent)
                result = subprocess.run(
                    ["ffmpeg", "-y", "-i", str(clip_path),
                     "-f", "lavfi", "-i", "anullsrc=channel_layout=stereo:sample_rate=44100",
                     "-vf", "scale=1920:1080:force_original_aspect_ratio=decrease,pad=1920:1080:(ow-iw)/2:(oh-ih)/2,setsar=1",
                     "-r", "30", "-c:v", "libx264", "-preset", "fast",
                     "-pix_fmt", "yuv420p",
                     "-c:a", "aac", "-b:a", "192k",
                     "-map", "0:v:0", "-map", "1:a:0",
                     "-shortest",
                     str(norm_path)],
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
                suffix = " (silent)"

            if result.returncode == 0 and norm_path.exists():
                normalized_clips.append(norm_path)
                print(f"   Clip {i+1}: normalized{suffix}")
            else:
                print(f"   Clip {i+1}: normalization failed")
                stderr = result.stderr.strip().split("\n")[-2:]
                for line in stderr:
                    print(f"      {line.strip()}")
        except (FileNotFoundError, subprocess.TimeoutExpired) as e:
            print(f"   Clip {i+1}: ffmpeg error ({e})")

    if not normalized_clips:
        print("   No clips could be normalized")
        return None

    # Step 2: Concat normalized clips (all same format now, so -c copy works)
    concat_file = clips_dir / "concat.txt"
    with open(concat_file, "w") as f:
        for clip_path in normalized_clips:
            f.write(f"file '{clip_path.resolve().as_posix()}'\n")

    print(f"   Merging {len(normalized_clips)} clips...")

    try:
        result = subprocess.run(
            ["ffmpeg", "-y", "-f", "concat", "-safe", "0",
             "-i", str(concat_file), "-c", "copy", str(final_path)],
            capture_output=True,
            text=True,
            timeout=120,
        )

        if result.returncode == 0 and final_path.exists():
            size_mb = final_path.stat().st_size / (1024 * 1024)
            print(f"   Final video: {final_path.name} ({size_mb:.1f} MB)")
            # Clean up normalized clips
            shutil.rmtree(norm_dir, ignore_errors=True)
            return final_path
        else:
            print("   ffmpeg concat failed")
            stderr = result.stderr.strip().split("\n")[-3:]
            for line in stderr:
                print(f"      {line.strip()}")
            return None

    except FileNotFoundError:
        print("   ffmpeg not found")
        return None
    except subprocess.TimeoutExpired:
        print("   Merge timed out")
        return None


def _binary_concat_fallback(clips: list[Path], output: Path) -> Path | None:
    """
    Simple binary concatenation of MP4 clips.
    Not ideal (may have playback issues) but works as a fallback.
    """
    try:
        with open(output, "wb") as outf:
            for clip in clips:
                outf.write(clip.read_bytes())
        print(f"   Merged (basic concat): {output.name}")
        print("   Note: Install ffmpeg for proper merging")
        return output
    except Exception as e:
        print(f"   Merge fallback failed: {e}")
        return None


def print_summary(
    output_dir: Path,
    saved_files: list[Path],
    all_scenes: list[dict],
    rendered_clips: dict[int, Path],
    final_video: Path | None = None,
) -> None:
    """Print a summary of all generated files and rendered videos."""
    print("\n" + "=" * 60)
    print(" VIDEO GENERATION COMPLETE!")
    print("=" * 60)
    print(f"\n   Output: {output_dir.resolve()}\n")

    # Scene breakdown
    print("   Scene Breakdown:")
    for s in sorted(all_scenes, key=lambda x: x["index"]):
        idx = s["index"]
        engine = s["engine"]
        rendered = "rendered" if idx in rendered_clips else "FAILED"
        print(f"     Scene {idx}: {s['title']} [{engine}] — {rendered}")

    # Generated code
    print(f"\n   Generated {len(saved_files)} code files")

    # Clips
    print(f"   Rendered {len(rendered_clips)}/{len(all_scenes)} scene clips")

    # Final video
    if final_video and final_video.exists():
        size_mb = final_video.stat().st_size / (1024 * 1024)
        print(f"\n   FINAL VIDEO: {final_video.name} ({size_mb:.1f} MB)")
    else:
        print(f"\n   Individual clips available in: clips/")

    print("=" * 60)
