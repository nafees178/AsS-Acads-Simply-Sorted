"""
Video Agent — orchestrates the hybrid video generation pipeline.
Each scene is assigned to either Manim or Remotion, rendered as a separate
clip, then merged into one final video.
"""

import re
from grok_client import GeminiClient
from knowledge_loader import (
    get_scene_planning_prompt,
    get_manim_generation_prompt,
    get_remotion_generation_prompt,
    get_fix_manim_prompt,
)


def _strip_code_fences(text: str) -> str:
    """Remove any leftover markdown code fences from text."""
    lines = text.strip().splitlines()
    # Remove leading ```python or ```
    while lines and lines[0].strip().startswith("```"):
        lines.pop(0)
    # Remove trailing ```
    while lines and lines[-1].strip() == "```":
        lines.pop()
    return "\n".join(lines).strip()


def extract_code_block(text: str, language: str = "") -> str:
    """Extract the first fenced code block of the given language from text."""
    if language:
        pattern = rf"```{re.escape(language)}\s*\n(.*?)```"
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return match.group(1).strip()

    pattern = r"```\w*\s*\n(.*?)```"
    match = re.search(pattern, text, re.DOTALL)
    if match:
        return match.group(1).strip()

    return text.strip()


def extract_multiple_code_blocks(text: str, language: str = "tsx") -> list[str]:
    """Extract ALL fenced code blocks of a given language from text."""
    pattern = rf"```{re.escape(language)}\s*\n(.*?)```"
    matches = re.findall(pattern, text, re.DOTALL)
    return [m.strip() for m in matches] if matches else []


def parse_scene_plan(plan_text: str) -> list[dict]:
    """
    Parse a scene plan with engine tags into structured scene metadata.

    Looks for patterns like:
        ### Scene 1: Title [MANIM]
        ### Scene 2: Title [REMOTION]

    Returns:
        List of dicts with keys: index, title, engine, description,
        class_name (for Manim), comp_id/comp_name (for Remotion)
    """
    scenes = []
    # Match: ### Scene N: Title [ENGINE]
    pattern = r"###\s*Scene\s*(\d+)\s*:\s*(.+?)\s*\[(MANIM|REMOTION)\]"
    
    # Split plan into scene blocks
    scene_splits = re.split(r"(?=###\s*Scene\s*\d+)", plan_text)
    
    for block in scene_splits:
        match = re.search(pattern, block, re.IGNORECASE)
        if not match:
            continue
        
        index = int(match.group(1))
        title = match.group(2).strip()
        engine = match.group(3).upper()
        
        # Everything after the header line is the description
        header_end = match.end()
        description = block[header_end:].strip()
        
        # Extract narration text (everything after "Narration:" until the next bullet point or end of block)
        narration_match = re.search(r'Narration:\s*(.+?)(?=\n\s*-|\Z)', block, re.DOTALL | re.IGNORECASE)
        narration = narration_match.group(1).strip() if narration_match else ""
        # Remove any surrounding quotes
        if narration.startswith('"') or narration.startswith("'"):
            narration = narration[1:]
        if narration.endswith('"') or narration.endswith("'"):
            narration = narration[:-1]
        narration = narration.strip()
        
        # Generate identifiers
        safe_title = re.sub(r'[^a-zA-Z0-9]', '', title.replace(' ', ''))[:30]
        
        scene = {
            "index": index,
            "title": title,
            "engine": engine,
            "description": description,
            "narration": narration,
            "class_name": f"Scene{index:02d}_{safe_title}",  # For Manim
            "comp_id": f"Scene{index:02d}",                   # For Remotion
            "comp_name": f"Scene{index:02d}Comp",              # For Remotion
        }
        scenes.append(scene)
    
    return scenes


class VideoAgent:
    """
    Orchestrates the hybrid video generation pipeline:
    1. Scene planning with per-scene engine tagging
    2. Manim code for [MANIM] scenes
    3. Remotion code for [REMOTION] scenes
    """

    def __init__(self, system_prompt: str, client: GeminiClient | None = None):
        self.client = client or GeminiClient()
        self.system_prompt = system_prompt

    def step1_plan_scenes(self, topic: str) -> str:
        """Step 1: Generate a scene plan with engine tags."""
        print("\n Step 1: Planning scenes (with engine selection)...")
        print(f"   Topic: {topic}")

        user_prompt = f"""
Create a video about the following topic:

**{topic}**

{get_scene_planning_prompt()}
"""
        response = self.client.generate(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.8,
        )

        scene_plan = extract_code_block(response, "markdown")
        if scene_plan == response.strip():
            scene_plan = extract_code_block(response, "md")

        print("   Scene plan generated!")
        return scene_plan

    def step2_generate_manim(self, scene_plan: str, manim_scenes: list[dict]) -> str | None:
        """Step 2: Generate ManimCE code for [MANIM] tagged scenes."""
        if not manim_scenes:
            print("\n   No MANIM scenes — skipping")
            return None

        scene_names = [s['class_name'] for s in manim_scenes]
        print(f"\n Step 2: Generating Manim code for {len(manim_scenes)} scenes...")
        print(f"   Classes: {', '.join(scene_names)}")

        user_prompt = get_manim_generation_prompt(scene_plan, manim_scenes)
        response = self.client.generate(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.5,
            max_tokens=16000,
        )

        code = extract_code_block(response, "python")
        print("   Manim code generated!")
        return code

    def step3_generate_remotion(self, scene_plan: str, remotion_scenes: list[dict]) -> tuple[str, str] | None:
        """Step 3: Generate Remotion code for [REMOTION] tagged scenes."""
        if not remotion_scenes:
            print("\n   No REMOTION scenes — skipping")
            return None

        comp_ids = [s['comp_id'] for s in remotion_scenes]
        print(f"\n Step 3: Generating Remotion code for {len(remotion_scenes)} scenes...")
        print(f"   Compositions: {', '.join(comp_ids)}")

        user_prompt = get_remotion_generation_prompt(scene_plan, remotion_scenes)
        response = self.client.generate(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.5,
            max_tokens=16000,
        )

        tsx_blocks = extract_multiple_code_blocks(response, "tsx")

        if len(tsx_blocks) >= 2:
            root_tsx = tsx_blocks[0]
            comp_tsx = tsx_blocks[1]
        elif len(tsx_blocks) == 1:
            root_tsx = tsx_blocks[0]
            comp_tsx = extract_code_block(response, "typescript") or tsx_blocks[0]
        else:
            ts_blocks = extract_multiple_code_blocks(response, "typescript")
            if len(ts_blocks) >= 2:
                root_tsx = ts_blocks[0]
                comp_tsx = ts_blocks[1]
            else:
                root_tsx = self._default_root_tsx(remotion_scenes)
                comp_tsx = extract_code_block(response)

        print("   Remotion code generated!")
        return root_tsx, comp_tsx

    def _default_root_tsx(self, scenes: list[dict]) -> str:
        """Fallback Root.tsx."""
        compositions = ""
        for s in scenes:
            compositions += f"""
            <Composition
                id="{s['comp_id']}"
                component={{{s['comp_name']}}}
                durationInFrames={{300}}
                width={{1920}}
                height={{1080}}
                fps={{30}}
            />"""

        imports = ", ".join(s['comp_name'] for s in scenes)
        return f"""import {{Composition}} from 'remotion';
import {{{imports}}} from './MyComp';

export const RemotionRoot: React.FC = () => {{
    return (
        <>{compositions}
        </>
    );
}};
"""

    def fix_manim_code(self, code: str, error: str, attempt: int = 1) -> str:
        """Send broken Manim code + error to Gemini for auto-fixing."""
        print(f"\n   Auto-fix attempt {attempt}/3 — sending to Gemini...")

        user_prompt = get_fix_manim_prompt(code, error, attempt)
        response = self.client.generate(
            system_prompt=self.system_prompt,
            user_prompt=user_prompt,
            temperature=0.3,
            max_tokens=16000,
        )

        fixed_code = extract_code_block(response, "python")
        # Safety: strip any leftover markdown fences
        fixed_code = _strip_code_fences(fixed_code)
        print(f"   Fixed code received ({len(fixed_code):,} chars)")
        return fixed_code

    def generate_video(self, topic: str) -> dict:
        """
        Run the full hybrid pipeline.

        Returns:
            Dictionary with keys: 'scene_plan', 'scenes', 'manim_code',
            'root_tsx', 'comp_tsx'
        """
        # Step 1: Plan with engine tags
        scene_plan = self.step1_plan_scenes(topic)

        # Parse scene tags
        scenes = parse_scene_plan(scene_plan)
        manim_scenes = [s for s in scenes if s["engine"] == "MANIM"]
        remotion_scenes = [s for s in scenes if s["engine"] == "REMOTION"]

        print(f"\n   Scene breakdown:")
        for s in scenes:
            engine_label = "MANIM" if s["engine"] == "MANIM" else "REMOTION"
            print(f"     Scene {s['index']}: {s['title']} [{engine_label}]")
        print(f"   Total: {len(manim_scenes)} Manim + {len(remotion_scenes)} Remotion")

        # Step 2: Manim code
        manim_code = self.step2_generate_manim(scene_plan, manim_scenes)

        # Step 3: Remotion code
        remotion_result = self.step3_generate_remotion(scene_plan, remotion_scenes)
        root_tsx = remotion_result[0] if remotion_result else None
        comp_tsx = remotion_result[1] if remotion_result else None

        return {
            "scene_plan": scene_plan,
            "scenes": scenes,
            "manim_scenes": manim_scenes,
            "remotion_scenes": remotion_scenes,
            "manim_code": manim_code,
            "root_tsx": root_tsx,
            "comp_tsx": comp_tsx,
        }
