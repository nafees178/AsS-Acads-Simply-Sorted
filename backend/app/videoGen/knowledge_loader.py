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
        ("manimgl-best-practices", "MANIM GL (3b1b) — BEST PRACTICES"),
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
- Use `from manim import *` (ManimCE only)
- NEVER use `.hide()` — use `.set_opacity(0)` instead
- Always use raw strings for LaTeX: `MathTex(r"\\frac{{1}}{{2}}")`
- Each scene = separate Scene class with `construct()` method
- Class names: `Scene01_Title`, `Scene03_Equation`, etc.
- Must run with: `manim -qh scene.py Scene01_Title`

## MANIM FORBIDDEN PATTERNS (THESE WILL CRASH — DO NOT USE)
- NEVER use `self.camera.frame` — this is ManimGL only, not ManimCE
- NEVER use `self.camera.animate.set_opacity()` — Camera has no animate
- NEVER use `ShowCreation()` — use `Create()` instead (ManimCE name)
- NEVER use `GrowArrow()` on arrows with custom colors — it crashes in some ManimCE versions. ALWAYS use `Create(arrow)` instead.
- NEVER use `InteractiveScene` — ManimCE uses `Scene` only
- NEVER use `self.embed()` — ManimGL only
- NEVER use `self.frame` — ManimGL only
- For camera zoom: use `self.play(self.camera.auto_zoom(mobjects))` or scale the mobjects
- For camera movement: move mobjects instead (e.g., `group.animate.shift(LEFT*2)`)
- For fade to black: use `self.play(*[FadeOut(m) for m in self.mobjects])`

## MANIM TEXT LAYOUT (CRITICAL — PREVENT OVERLAPPING)
- ALWAYS `FadeOut` or `self.clear()` old elements BEFORE adding new ones in the same area
- Use `.to_edge(UP/DOWN/LEFT/RIGHT)` and `.to_corner()` for positioning, not absolute coords
- Use `.next_to()` with `buff=0.5` or more to space elements apart
- Limit font sizes: titles 40-48, body text 28-36, labels 20-24
- Max 3-4 text elements visible at once — remove old ones before adding new
- Use `.shift()` to nudge elements when they get close
- Use `VGroup` to arrange related elements with `.arrange(DOWN, buff=0.4)`
- Test mental layout: title at top, main content center, labels below/beside
- When showing equations with labels, put equation center, labels to sides
- NEVER pile multiple Text/MathTex objects at the same position

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
- Use `useCurrentFrame()`, `interpolate()`, `spring()`
- Dark background, vibrant colors from the palette
- Smooth animations and transitions
- Deterministic (use `random()` from remotion)

Output in separate code blocks:
```tsx
// Root.tsx
```
```tsx
// MyComp.tsx
```
"""


def get_fix_manim_prompt(code: str, error: str, attempt: int) -> str:
    """Return the prompt for fixing broken Manim code given an error."""
    return f"""The following ManimCE Python code failed to render. Fix the error and return
the COMPLETE corrected code.

## FIX ATTEMPT {attempt}/3

## ERROR
```
{error}
```

## BROKEN CODE
```python
{code}
```

## COMMON FIXES
- `.hide()` does NOT exist in ManimCE → use `.set_opacity(0)`
- `GrowArrow(arrow)` crashes on colored arrows → use `Create(arrow)`
- Use raw strings for LaTeX: `MathTex(r"\\frac{{1}}{{2}}")`
- `Axes` has no `get_z_axis_label` → only for `ThreeDAxes`
- `TracedPath` needs a callable, not a point
- Don't use deprecated methods or non-existent attributes

## RULES
- Return the ENTIRE fixed Python file, not just the changed part
- Output ONLY Python code in a single ```python code block
- Do NOT add any explanation, just the code
"""
