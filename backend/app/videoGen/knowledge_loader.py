"""
Knowledge Loader — reads Manim skills and Remotion prompt from disk
and builds the system prompt that powers the Gemini video agent.

Gemini has a 1M+ token context window, so we can load all skill files.
"""

import os
from pathlib import Path

# ── Priority files that are always loaded first ────────────────────────
PRIORITY_FILENAMES = {"SKILL.md"}

# ── File extensions to include ─────────────────────────────────────────
INCLUDE_EXTENSIONS = {".md", ".py"}

# ── Maximum characters per knowledge section ───────────────────────────
MAX_CHARS_PER_SKILL = 60_000  # ~15k tokens per skill folder


def _read_file_safe(path: Path) -> str:
    """Read a file, returning empty string on any error."""
    try:
        return path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return ""


def _collect_files(directory: Path) -> list[tuple[Path, str]]:
    """
    Recursively collect all relevant files from a skill directory.
    Returns a list of (path, content) tuples, with priority files first.
    """
    priority = []
    regular = []

    for root, _dirs, files in os.walk(directory):
        for fname in sorted(files):
            fpath = Path(root) / fname
            if fpath.suffix not in INCLUDE_EXTENSIONS:
                continue
            content = _read_file_safe(fpath)
            if not content.strip():
                continue

            relative = fpath.relative_to(directory)
            entry = (relative, content)

            if fname in PRIORITY_FILENAMES:
                priority.append(entry)
            else:
                regular.append(entry)

    return priority + regular


def load_manim_knowledge(skills_dir: str | Path) -> str:
    """Load all Manim knowledge from the skills directory."""
    skills_dir = Path(skills_dir)
    if not skills_dir.exists():
        raise FileNotFoundError(f"Skills directory not found: {skills_dir}")

    skill_folders = [
        ("manim-composer", "VIDEO PLANNING (MANIM COMPOSER)"),
        ("manimce-best-practices", "MANIM COMMUNITY EDITION — BEST PRACTICES"),
    ]

    sections = []

    for folder_name, section_title in skill_folders:
        folder = skills_dir / folder_name
        if not folder.exists():
            continue

        files = _collect_files(folder)
        if not files:
            continue

        section_parts = [f"\n{'='*60}", f"## {section_title}", f"{'='*60}\n"]
        char_count = 0

        for relative_path, content in files:
            header = f"\n### File: {relative_path}\n"
            if char_count + len(header) + len(content) > MAX_CHARS_PER_SKILL:
                section_parts.append(
                    f"\n... (truncated — {folder_name} exceeds budget)\n"
                )
                break
            section_parts.append(header)
            section_parts.append(content)
            char_count += len(header) + len(content)

        sections.append("\n".join(section_parts))

    return "\n\n".join(sections)


def load_remotion_knowledge(prompt_path: str | Path) -> str:
    """Load the Remotion system prompt from disk."""
    prompt_path = Path(prompt_path)
    if not prompt_path.exists():
        raise FileNotFoundError(f"Remotion prompt not found: {prompt_path}")

    content = _read_file_safe(prompt_path)
    return f"""
{'='*60}
## REMOTION FRAMEWORK — VIDEO CREATION WITH REACT
{'='*60}

{content}
"""


def build_system_prompt(manim_knowledge: str, remotion_knowledge: str) -> str:
    """Combine Manim and Remotion knowledge into a unified system prompt."""
    return f"""You are an expert video creation agent that creates HYBRID videos using both
**Manim** (Python animation engine) and **Remotion** (React video framework).

Your job: take a topic, plan scenes, and for EACH scene decide the best engine.
Then generate production-ready code for both engines.

## HYBRID PIPELINE
1. **Scene Planning** — Plan 4-6 scenes, tag each as [MANIM] or [REMOTION]
2. **Manim Code Generation** — Generate code for all [MANIM] scenes
3. **Remotion Code Generation** — Generate code for all [REMOTION] scenes
4. Each scene renders as a separate clip, then they merge into one video.

## WHEN TO USE EACH ENGINE

### Tag as [MANIM] when the scene needs:
- Mathematical equations, proofs, derivations (MathTex)
- Geometric constructions, coordinate planes (Axes, NumberPlane)
- Step-by-step visual buildup (Write, Create, Transform)
- 3D mathematical visualizations (ThreeDScene)
- Graph theory, trees, network diagrams
- LaTeX-heavy content with beautiful typesetting

### Tag as [REMOTION] when the scene needs:
- Dynamic text animations, kinetic typography
- Smooth color transitions, gradient backgrounds
- Data visualization with animated charts
- Motion graphics with CSS transforms
- Modern UI-style layouts with cards, grids
- SVG animations and path morphing
- Title cards, intro/outro sequences

## MANIM CODE RULES (CRITICAL)
- STRICTLY use Manim Community Edition (Manim CE). DO NOT use ManimGL, manimlib, or any 3b1b-specific features. Only write code compatible with `manim` (the CE version).
- Use `from manim import *` (ManimCE only)
- NEVER use `.hide()` — use `.set_opacity(0)` instead
- Always use raw strings for LaTeX: `MathTex(r"\\frac{{1}}{{2}}")`
- Each scene = separate Scene class with `construct()` method
- Class names: `Scene01_Title`, `Scene03_Equation`, etc.
- Must run with: `manim -qh scene.py Scene01_Title`
- Use `np.random.seed(42)` at the top of construct() if you use any randomness, for deterministic output

## MANIM FORBIDDEN PATTERNS (THESE WILL CRASH — DO NOT USE)

### Camera Errors
- NEVER use `self.camera.frame` in a standard `Scene` — only `MovingCameraScene` has `.camera.frame`
- NEVER use `self.camera.animate.set_opacity()` — Camera has no animate proxy
- NEVER use `self.camera.auto_zoom()` — this does not exist in ManimCE
- If you need camera zoom/pan, use `MovingCameraScene` and `self.camera.frame.animate.set(width=...)`
- If you just need a regular Scene, scale/shift the mobjects instead of moving the camera

### Naming / Import Errors
- NEVER use `ShowCreation()` — use `Create()` instead (ManimCE renamed it)
- NEVER use `GrowArrow()` — use `Create(arrow)` instead (GrowArrow crashes with custom colors)
- NEVER use `DrawBorderThenFill()` on Text or MathTex — use `Write()` instead
- NEVER use `InteractiveScene` — ManimCE uses `Scene` only
- NEVER use `self.embed()` or `self.frame` — not supported in ManimCE

### Constructor Argument Errors
- NEVER use `width` or `height` parameters for `Square()`. `Square` ONLY takes `side_length`. Use `Rectangle(width=..., height=...)` if you need both.
- NEVER pass `width` and `height` as positional args to `Square()` — it will silently misinterpret them
- NEVER use `Dot3D(point=...)` — use `Dot3D(center=...)` or just positional: `Dot3D(pos)`
- NEVER use `height` or `width` for `BarChart()`. Use `y_length` and `x_length` instead. `BarChart(height=4)` will CRASH with "unexpected keyword argument 'height'".

### Color Errors
- ABSOLUTELY DO NOT use `interpolate_color()` EVER. It is broken in ManimCE and WILL crash. Instead, just pick a specific color constant like `RED`, `BLUE`, `GREEN`, `YELLOW`, `ORANGE`, `PURPLE`, `TEAL`, `GOLD`, `GREY`, etc.
- NEVER use `color=` with a Python tuple like `(1, 0, 0)`. Use ManimCE color constants or hex strings.

### Rate Function Errors
- NEVER use `exponential_decay` as a rate_func — it does NOT go from 0→1, it goes from 1→0. Animations using it may look broken or crash with negative scale. Use `smooth`, `ease_in_out_sine`, or `rush_into` instead.
- NEVER use CSS-style rate_func names like `ease_out_sine`, `ease_in_out`, `ease_in_cubic` etc. — These DO NOT EXIST in ManimCE! Valid rate functions include: `smooth`, `linear`, `rush_into`, `rush_from`, `slow_into`, `there_and_back`, `there_and_back_with_pause`, `running_start`, `wiggle`, `rate_functions.ease_in_out_sine`. If unsure, use `smooth`.

### 3D Scene Errors
- For 3D scenes, use `ThreeDScene`, NOT `Scene`
- Use `self.set_camera_orientation(phi=..., theta=...)` for initial camera angle
- Use `self.begin_ambient_camera_rotation()` for continuous rotation
- Use `self.add_fixed_in_frame_mobjects(text)` for text overlays in 3D scenes — without this, text will be in 3D space and may be invisible
- NEVER create more than ~300 small 3D objects (e.g. Dot3D in a loop) — it will be extremely slow. Keep 3D object counts under 100.
- NEVER put 3D objects (Sphere, Dot3D, Surface, Cone, Cylinder, Arrow3D) into `VGroup`. VGroup ONLY accepts VMobject subclasses. 3D objects are `Mobject` type. Use `Group` instead for 3D objects or mixed 2D+3D collections.

### Safe Alternatives
- For camera zoom: scale mobjects with `group.animate.scale(2)` or use `MovingCameraScene`
- For camera movement: shift mobjects with `group.animate.shift(LEFT*2)`
- For fade to black: `self.play(*[FadeOut(m) for m in self.mobjects])`
- For color gradients: use `color_gradient([RED, BLUE], length)` which returns a list of ManimColor objects
- For background color: use `self.camera.background_color = "#1C1C1C"` at the start of construct()

### Performance (CRITICAL — PREVENT TIMEOUTS)
- NEVER animate (scale, shift, rotate) a full `NumberPlane` or large grid. These have hundreds of sub-mobjects and are extremely slow to transform. Instead, create a SMALL grid or use simple lines.
- Keep total `self.wait()` time under 10 seconds per scene. Each wait second = 60 frames rendered.
- Keep `run_time` values small: 1-3 seconds for most animations, max 5 seconds for complex ones.
- Avoid `LaggedStartMap` with more than 50 elements — it generates a huge animation graph.
- Prefer fewer, larger mobjects over many tiny ones (e.g. 10 big dots instead of 300 small Dot3D).
- Total scene render time MUST stay under 300 seconds. Simpler is better.

## MANIM TEXT LAYOUT (CRITICAL — PREVENT OVERLAPPING)
- TEXT OVERLAPPING IS UNACCEPTABLE! You MUST prevent elements from piling up.
- ALWAYS `FadeOut` or `self.clear()` old elements BEFORE adding new ones in the same area.
- Use `VGroup` to arrange related elements with `.arrange(DOWN, buff=0.7)` and `.center()`.
- Use `.next_to()` with `buff=0.8` or more to space elements far apart.
- Limit font sizes: titles 36-40, body text 28-32, labels 20-24.
- Max 2-3 text elements visible at once — vigorously remove old ones before adding new ones.
- When evaluating positioning, mentally ensure elements have plenty of whitespace. If in doubt, `FadeOut` the previous element before drawing the next one.
- NEVER pile multiple Text/MathTex objects at the same position.

## REMOTION CODE RULES
- TypeScript with React, 1920x1080 at 30fps
- Use `useCurrentFrame()`, `interpolate()`, `spring()`
- Each scene = separate Composition with unique id
- Composition ids: `Scene02`, `Scene04`, etc.
- Use deterministic `random()` from remotion, not Math.random

## DESIGN PRINCIPLES
- Dark backgrounds (#1C1C1C) for premium look
- Consistent color palette (3-5 colors)
- Progressive revelation, build intuition visually
- Large readable text, clean composition
- Smooth transitions, no jarring cuts

## CONTENT RULES
- NEVER include "subscribe", "like", "follow", "share", or any call-to-action
- NEVER include channel promotion, social media links, or clickbait text
- Focus purely on educational content — no filler or promotional material
- End with a clean conclusion, not a CTA

## YOUR KNOWLEDGE BASE

{manim_knowledge}

{remotion_knowledge}
"""


def get_scene_planning_prompt() -> str:
    """Return the prompt for scene planning with engine tagging."""
    return """
Generate a scene-by-scene plan for this video. For EACH scene, decide which
engine is best: [MANIM] for math/equations/geometry or [REMOTION] for
motion graphics/typography/transitions.

IMPORTANT: For each scene, write a **Narration** field with the exact spoken
dialogue (2-4 sentences, conversational and educational). This will be
converted to speech and laid over the video.

Use this EXACT format:

```markdown
# Video Plan: [Topic]

## Overview
- Hook: ...
- Target Audience: ...
- Total Duration: 60-90 seconds
- Key Insight: ...

## Scenes

### Scene 1: [Title] [MANIM]
- Duration: 10-15s
- Visual Elements: ...
- Content: ...
- Narration: "The spoken words for this scene go here. Keep it concise and engaging."
- Why this engine: ...

### Scene 2: [Title] [REMOTION]
- Duration: 10-15s
- Visual Elements: ...
- Content: ...
- Narration: "Another narration line here. Match the duration to the speech length."
- Why this engine: ...

(... 4-6 scenes total)

## Color Palette
- Primary: #hex
- Secondary: #hex
- Accent: #hex
- Background: #1C1C1C
- RULE: DO NOT use typical "AI generated" cliche palettes (like neon purple/magenta/cyan combos). Use professional, elegant, modern design palettes (e.g. clean tech blue, academic slate, earthy tones, or structured pastel).
```

Output ONLY the plan in a markdown code block.
"""


def get_manim_generation_prompt(scene_plan: str, manim_scenes: list[dict]) -> str:
    """Return the prompt for Manim code generation for specific scenes."""
    scene_descriptions = ""
    for s in manim_scenes:
        scene_descriptions += f"\n### {s['class_name']} (Scene {s['index']}): {s['title']}\n{s['description']}\n"

    return f"""
Based on the scene plan, generate ManimCE Python code for these SPECIFIC scenes:

## FULL SCENE PLAN (for context)
{scene_plan}

## SCENES TO IMPLEMENT IN MANIM
{scene_descriptions}

## REQUIREMENTS
- STRICTLY use Manim CE (`manim`). No ManimGL/3b1b code allowed!
- `from manim import *`
- Create a SEPARATE Scene class for EACH scene listed above
- Class names MUST be exactly: {', '.join(s['class_name'] for s in manim_scenes)}
- Each class has its own `construct()` method
- Use proper animations, pauses, colors
- NEVER use .hide() — use .set_opacity(0)
- Use raw strings for LaTeX: r"..."
- Each scene should be 10-20 seconds of animation
- Use the color palette from the plan
- All classes in ONE Python file

Output ONLY Python code in a ```python code block.
"""


def get_remotion_generation_prompt(scene_plan: str, remotion_scenes: list[dict]) -> str:
    """Return the prompt for Remotion code generation for specific scenes."""
    scene_descriptions = ""
    for s in remotion_scenes:
        scene_descriptions += f"\n### {s['comp_id']} (Scene {s['index']}): {s['title']}\n{s['description']}\n"

    return f"""
Based on the scene plan, generate Remotion TypeScript code for these SPECIFIC scenes:

## FULL SCENE PLAN (for context)
{scene_plan}

## SCENES TO IMPLEMENT IN REMOTION
{scene_descriptions}

## REQUIREMENTS
Generate TWO files:

### 1. Root.tsx
- The main export MUST be named `RemotionRoot`: `export const RemotionRoot: React.FC = () => ...`
- Register a SEPARATE Composition for EACH scene
- Composition ids MUST be exactly: {', '.join(s['comp_id'] for s in remotion_scenes)}
- Each composition: 1920x1080, 30fps
- Set durationInFrames based on scene duration (30fps × seconds)

### 2. MyComp.tsx
- Create a SEPARATE React component for each scene
- Component names: {', '.join(s['comp_name'] for s in remotion_scenes)}
- MAKE IT BEAUTIFUL: You MUST use high-end 3D motion graphics that look like they were edited in Adobe After Effects.
- STYLING: Use CSS `perspective: 1000px`, `rotateX`, `rotateY`, glowing effects (`box-shadow`), gradients, glassmorphism, and cinematic typography.
- ANIMATION RULES: NO CHEAP "MARQUEE" OR CONTINUOUS MOVEMENT! Elements should have elegant, punchy entrance animations (e.g., using `spring()` to scale up and fade in), stay completely static while the user reads, and then cleanly animate out.
- Use staggered reveals (e.g., `const delay = index * 10; const scale = spring({{frame: frame - delay...}})`.
- This MUST look like a premium 3D motion graphics YouTube explainer video. Do not output simple 2D sliding text.
- Deterministic (use `random()` from remotion).
- CRITICAL VISUALIZATION RULE: DO NOT use basic HTML `<table>`, raw text, or `<ul>` for data, comparisons, or lists! You MUST visualize data points as creative 3D motion graphic elements: e.g. stylized cards, staggered rows with deep shadows, glowing glassmorphism containers, or 3D grids. Give everything `borderRadius`, `padding`, vibrant gradients, and CSS drop shadows!

Output in separate code blocks:
```tsx
// Root.tsx
```
```tsx
// MyComp.tsx
```
"""


def get_remotion_fallback_prompt(scene_plan: str, failed_scene: dict, error: str) -> str:
    """Return the prompt for generating Remotion code as a fallback for a failed Manim scene."""
    return f"""A Manim scene FAILED to render. Generate Remotion (React/TypeScript) code
to create the SAME scene content instead.

## FAILED MANIM SCENE
- Scene {failed_scene['index']}: {failed_scene['title']}
- Original engine: MANIM (failed)
- Manim class name: {failed_scene['class_name']}
- Error: {error[:500]}

## SCENE DESCRIPTION
{failed_scene.get('description', 'No description available')}

## FULL SCENE PLAN (for context)
{scene_plan}

## REQUIREMENTS
Generate TWO files:

### 1. Root.tsx
- The main export MUST be named `RemotionRoot`: `export const RemotionRoot: React.FC = () => ...`
- Register ONE Composition for this scene
- Composition id MUST be: {failed_scene['comp_id']}
- 1920x1080, 30fps, durationInFrames=450 (15 seconds)

### 2. MyComp.tsx
- Create ONE React component: {failed_scene['comp_name']}
- Recreate the SAME educational content that the Manim scene was supposed to show
- MAKE IT BEAUTIFUL: You MUST use high-end 3D motion graphics that look like they were edited in Adobe After Effects.
- STYLING: Use CSS `perspective: 1000px`, `rotateX`, `rotateY`, glowing effects (`box-shadow`), gradients, glassmorphism, and cinematic typography.
- ANIMATION RULES: NO CHEAP "MARQUEE" OR CONTINUOUS MOVEMENT! Elements should have elegant, punchy entrance animations (e.g., using `spring()` to scale up and fade in), stay completely static while the user reads, and then cleanly animate out.
- Use staggered reveals (e.g., `const delay = index * 10; const scale = spring({{frame: frame - delay...}})`. This MUST look like a premium 3D motion graphics YouTube explainer video.
- CRITICAL VISUALIZATION RULE: DO NOT use basic HTML `<table>`, raw text, or `<ul>` for data, comparisons, or lists! You MUST visualize data points as creative 3D motion graphic elements: e.g. stylized cards, staggered rows with deep shadows, glowing glassmorphism containers, or 3D grids. Give everything `borderRadius`, `padding`, vibrant gradients, and CSS drop shadows!

Output in separate code blocks:
```tsx
// Root.tsx
```
```tsx
// MyComp.tsx
```
"""
