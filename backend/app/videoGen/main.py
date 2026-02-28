"""
Gemini Video Generator — AI agent that creates hybrid educational videos.

Uses the Google Gemini API to intelligently decide which animation engine
(Manim or Remotion) is best for each scene, generates code for both,
renders individual clips, and merges them into one final video.

Usage:
    python main.py                          # Interactive mode
    python main.py "Pythagorean theorem"    # Direct topic mode
"""

import sys
from pathlib import Path

# Explicit sys.path injection for standalone execution resilience
APP_DIR = Path(__file__).resolve().parent.parent
if str(APP_DIR) not in sys.path:
    sys.path.append(str(APP_DIR))

import config

# ── Paths ──────────────────────────────────────────────────────────────
PROJECT_DIR = config.VIDEO_GEN_DIR
SKILLS_DIR = config.VIDEO_SKILLS_DIR
REMOTION_PROMPT = PROJECT_DIR / "RemotionSystemPrompt.txt"


def print_banner():
    """Print the startup banner."""
    print("""
============================================================
       GEMINI HYBRID VIDEO GENERATOR
       
  Manim + Remotion | Per-Scene Engine Selection
  Powered by Google Gemini
============================================================
""")


def main():
    print_banner()

    # ── Imports ────────────────────────────────────────────────────────
    from knowledge_loader import (
        load_manim_knowledge,
        load_remotion_knowledge,
        build_system_prompt,
    )
    from grok_client import GeminiClient
    from video_agent import VideoAgent
    from output_manager import (
        create_output_dir,
        save_scene_plan,
        save_manim_code,
        save_remotion_files,
        render_manim_scenes,
        render_remotion_scenes,
        merge_clips,
        print_summary,
    )

    # ── Load knowledge ─────────────────────────────────────────────────
    print("Loading knowledge base...")
    try:
        manim_knowledge = load_manim_knowledge(SKILLS_DIR)
        print(f"   Manim knowledge loaded ({len(manim_knowledge):,} chars)")
    except FileNotFoundError as e:
        print(f"   {e}")
        sys.exit(1)

    try:
        remotion_knowledge = load_remotion_knowledge(REMOTION_PROMPT)
        print(f"   Remotion knowledge loaded ({len(remotion_knowledge):,} chars)")
    except FileNotFoundError as e:
        print(f"   {e}")
        sys.exit(1)

    system_prompt = build_system_prompt(manim_knowledge, remotion_knowledge)
    print(f"   System prompt ready ({len(system_prompt):,} chars)")

    # ── Initialize Gemini client ───────────────────────────────────────
    print("\nInitializing Gemini client...")
    try:
        client = GeminiClient()
        print(f"   Connected (model: {client.model})")
    except ValueError as e:
        print(f"   {e}")
        sys.exit(1)

    # ── Get topic ──────────────────────────────────────────────────────
    if len(sys.argv) > 1:
        full_topic = " ".join(sys.argv[1:])
    else:
        print("\n" + "-" * 60)
        full_topic = input("Enter the video topic: ").strip()
        if not full_topic:
            print("No topic provided. Exiting.")
            sys.exit(1)

    display_topic = full_topic
    if len(full_topic) > 50:
        display_topic = display_topic[:47] + "..."

    print(f"\nGenerating hybrid video for: \"{display_topic}\"")
    print("   This may take 2-5 minutes...\n")

    # ── Run the hybrid pipeline ────────────────────────────────────────
    agent = VideoAgent(system_prompt=system_prompt, client=client)

    # ── Summarize long text into a short title
    short_title = full_topic
    if len(full_topic) > 50:
        print("Summarizing input text into a title...")
        try:
            summary_prompt = "Generate a catchy, concise title (maximum 5 words) for a video about the following text. Respond ONLY with the title without any quotes or markdown.\n\nText:\n" + full_topic[:5000]
            short_title = client.generate(
                system_prompt="You are a helpful assistant that summarizes text into short titles.",
                user_prompt=summary_prompt,
                temperature=0.7,
                max_tokens=20,
            ).strip()
            short_title = short_title.strip('"\'')
            if not short_title:
                short_title = "Generated_Video"
            print(f"Title generated: {short_title}\n")
        except Exception as e:
            print(f"Failed to summarize topic: {e}")
            pass

    try:
        result = agent.generate_video(full_topic)
    except Exception as e:
        print(f"\nGeneration failed: {e}")
        sys.exit(1)

    # ── Save output ────────────────────────────────────────────────────
    output_dir = create_output_dir(short_title)
    saved_files = []

    # Scene plan
    path = save_scene_plan(output_dir, result["scene_plan"])
    saved_files.append(path)

    # Manim code
    if result["manim_code"]:
        path = save_manim_code(output_dir, result["manim_code"])
        saved_files.append(path)

    # Remotion files
    if result["root_tsx"] and result["comp_tsx"]:
        remotion_paths = save_remotion_files(
            output_dir, result["root_tsx"], result["comp_tsx"]
        )
        saved_files.extend(remotion_paths)

    # ── Render individual scene clips ──────────────────────────────────
    print("\n" + "=" * 60)
    print("RENDERING SCENE CLIPS...")
    print("=" * 60)

    rendered_clips = {}

    # Render Manim scenes (with auto-fix)
    if result["manim_scenes"]:
        manim_clips = render_manim_scenes(
            output_dir,
            result["manim_scenes"],
            fix_callback=agent.fix_manim_code,
        )
        rendered_clips.update(manim_clips)

    # Render Remotion scenes
    if result["remotion_scenes"]:
        remotion_clips = render_remotion_scenes(
            output_dir,
            result["remotion_scenes"],
        )
        rendered_clips.update(remotion_clips)

    # ── Generate TTS narration ─────────────────────────────────────────
    narration_audio = {}
    narration_scripts = {
        s["index"]: s["narration"]
        for s in result["scenes"]
        if s.get("narration")
    }

    if narration_scripts:
        print("\n" + "=" * 60)
        print("GENERATING NARRATION (Gemini TTS)...")
        print("=" * 60)

        try:
            from tts_generator import generate_scene_narrations
            narration_audio = generate_scene_narrations(
                result["scenes"], narration_scripts, output_dir
            )
            print(f"   Generated {len(narration_audio)}/{len(narration_scripts)} narrations")
        except Exception as e:
            print(f"   TTS generation failed: {e}")
            narration_audio = {}

    # ── Merge clips into final video ───────────────────────────────────
    final_video = merge_clips(output_dir, result["scenes"], rendered_clips, narration_audio)

    # ── Summary ────────────────────────────────────────────────────────
    print_summary(output_dir, saved_files, result["scenes"], rendered_clips, final_video)


if __name__ == "__main__":
    main()
