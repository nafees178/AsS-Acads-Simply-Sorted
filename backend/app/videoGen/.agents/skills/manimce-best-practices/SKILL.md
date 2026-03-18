---
name: manimce-best-practices
description: |
  Trigger when: (1) User mentions "manim" or "Manim Community" or "ManimCE", (2) Code contains `from manim import *`, (3) User runs `manim` CLI commands, (4) Working with Scene, MathTex, Create(), or ManimCE-specific classes.

  Best practices for Manim Community Edition - the community-maintained Python animation engine. Covers Scene structure, animations, LaTeX/MathTex, 3D with ThreeDScene, camera control, styling, and CLI usage.
---

## How to use

Read individual rule files for detailed explanations and code examples:

### Core Concepts
- [rules/scenes.md](rules/scenes.md) - Scene structure, construct method, and scene types
- [rules/mobjects.md](rules/mobjects.md) - Mobject types, VMobject, Groups, and positioning
- [rules/animations.md](rules/animations.md) - Animation classes, playing animations, and timing

### Creation & Transformation
- [rules/creation-animations.md](rules/creation-animations.md) - Create, Write, FadeIn, DrawBorderThenFill
- [rules/transform-animations.md](rules/transform-animations.md) - Transform, ReplacementTransform, morphing
- [rules/animation-groups.md](rules/animation-groups.md) - AnimationGroup, LaggedStart, Succession

### Text & Math
- [rules/text.md](rules/text.md) - Text mobjects, fonts, and styling
- [rules/latex.md](rules/latex.md) - MathTex, Tex, LaTeX rendering, and coloring formulas
- [rules/text-animations.md](rules/text-animations.md) - Write, AddTextLetterByLetter, TypeWithCursor

### Styling & Appearance
- [rules/colors.md](rules/colors.md) - Color constants, gradients, and color manipulation
- [rules/styling.md](rules/styling.md) - Fill, stroke, opacity, and visual properties

### Positioning & Layout
- [rules/positioning.md](rules/positioning.md) - move_to, next_to, align_to, shift methods
- [rules/grouping.md](rules/grouping.md) - VGroup, Group, arrange, and layout patterns

### Coordinate Systems & Graphing
- [rules/axes.md](rules/axes.md) - Axes, NumberPlane, coordinate systems
- [rules/graphing.md](rules/graphing.md) - Plotting functions, parametric curves
- [rules/3d.md](rules/3d.md) - ThreeDScene, 3D axes, surfaces, camera orientation

### Animation Control
- [rules/timing.md](rules/timing.md) - Rate functions, easing, run_time, lag_ratio
- [rules/updaters.md](rules/updaters.md) - Updaters, ValueTracker, dynamic animations
- [rules/camera.md](rules/camera.md) - MovingCameraScene, zoom, pan, frame manipulation

### Configuration & CLI
- [rules/cli.md](rules/cli.md) - Command-line interface, rendering options, quality flags
- [rules/config.md](rules/config.md) - Configuration system, manim.cfg, settings

### Shapes & Geometry
- [rules/shapes.md](rules/shapes.md) - Circle, Square, Rectangle, Polygon, and geometric primitives
- [rules/lines.md](rules/lines.md) - Line, Arrow, Vector, DashedLine, and connectors

## Working Examples

Complete, tested example files demonstrating common patterns:

- [examples/basic_animations.py](examples/basic_animations.py) - Shape creation, text, lagged animations, path movement
- [examples/math_visualization.py](examples/math_visualization.py) - LaTeX equations, color-coded math, derivations
- [examples/updater_patterns.py](examples/updater_patterns.py) - ValueTracker, dynamic animations, physics simulations
- [examples/graph_plotting.py](examples/graph_plotting.py) - Axes, functions, areas, Riemann sums, polar plots
- [examples/3d_visualization.py](examples/3d_visualization.py) - ThreeDScene, surfaces, 3D camera, parametric curves

## Scene Templates

Copy and modify these templates to start new projects:

- [templates/basic_scene.py](templates/basic_scene.py) - Standard 2D scene template
- [templates/camera_scene.py](templates/camera_scene.py) - MovingCameraScene with zoom/pan
- [templates/threed_scene.py](templates/threed_scene.py) - 3D scene with surfaces and camera rotation

## Quick Reference

### Basic Scene Structure
```python
from manim import *

class MyScene(Scene):
    def construct(self):
        # Create mobjects
        circle = Circle()

        # Add to scene (static)
        self.add(circle)

        # Or animate
        self.play(Create(circle))

        # Wait
        self.wait(1)
```

### Render Command
```bash
# Basic render with preview
manim -pql scene.py MyScene

# Quality flags: -ql (low), -qm (medium), -qh (high), -qk (4k)
manim -pqh scene.py MyScene
```

### Jupyter Notebook Support

Use the `%%manim` cell magic:

```python
%%manim -qm MyScene
class MyScene(Scene):
    def construct(self):
        self.play(Create(Circle()))
```

### Common Pitfalls to Avoid

#### General
1. **Version confusion** — Ensure you're using `manim` (Community Edition), NOT `manimgl` or `manimlib`
2. **Check imports** — `from manim import *` is ManimCE. If you see `from manimlib import *`, that's ManimGL (wrong!)
3. **Outdated tutorials** — Many YouTube tutorials use ManimGL syntax. Always check against official ManimCE docs
4. **manimpango issues** — If text rendering fails, check manimpango installation requirements
5. **PATH issues (Windows)** — If `manim` command not found, use `python -m manim` or check PATH

#### Constructor Argument Crashes
6. **`Square()` arguments** — `Square()` ONLY accepts `side_length`. NEVER pass `width` or `height`. Use `Rectangle(width=w, height=h)` if you need both dimensions.
7. **`Dot3D` keyword** — Use `Dot3D(center=...)` or positional `Dot3D(pos)`. Do NOT use `Dot3D(point=...)`.
8. **`Arrow` with zero length** — If `start == end`, Arrow crashes. Always ensure start and end differ.

#### Color Crashes
9. **`interpolate_color` with strings** — NEVER pass raw hex strings (e.g. `"#FF0000"`) to `interpolate_color()`. It crashes: `'str' object has no attribute 'interpolate'`. Wrap with `ManimColor("#FF0000")` first, or use built-in constants like `RED`, `BLUE`.
10. **Tuple colors** — NEVER use `color=(1, 0, 0)`. Use ManimCE color constants or hex strings.
11. **Safe gradient** — Use `color_gradient([RED, BLUE], n)` which returns a list of proper ManimColor objects.

#### Camera Crashes
12. **`self.camera.frame` in `Scene`** — Only `MovingCameraScene` has `.camera.frame`. Using it in a regular `Scene` will crash immediately.
13. **`self.camera.animate`** — Camera has NO `.animate` proxy in standard `Scene`. Only `MovingCameraScene` supports `self.camera.frame.animate`.
14. **`self.camera.auto_zoom()`** — This does NOT exist in ManimCE. Scale mobjects instead.
15. **Camera zoom/pan** — If you need it, inherit from `MovingCameraScene` and use `self.camera.frame.animate.set(width=...)`.

#### Renamed / Removed APIs
16. **`ShowCreation()`** — Renamed to `Create()` in ManimCE. `ShowCreation` will crash.
17. **`GrowArrow()`** — Crashes with custom colors. Always use `Create(arrow)` instead.
18. **`DrawBorderThenFill()` on Text** — Use `Write()` for Text and MathTex objects.
19. **`InteractiveScene`** — Does not exist. Use `Scene`.
20. **`self.embed()` / `self.frame`** — Not supported in ManimCE at all.
21. **`.hide()`** — Does not exist. Use `.set_opacity(0)` instead.

#### Rate Function Errors
22. **`exponential_decay`** — Goes from 1→0, NOT 0→1! Animations using it as rate_func will play backwards or crash with negative scale. Use `smooth`, `rush_into`, or `there_and_back` instead.
23. **CSS-style rate_func names** — names like `ease_out_sine`, `ease_in_out`, `ease_in_cubic` do NOT exist in ManimCE! Valid functions: `smooth`, `linear`, `rush_into`, `rush_from`, `slow_into`, `there_and_back`, `there_and_back_with_pause`, `running_start`, `wiggle`. When unsure, use `smooth`.

#### 3D Scene Errors
23. **3D without ThreeDScene** — To use 3D objects (Sphere, Surface, etc.), inherit from `ThreeDScene`, not `Scene`.
24. **Text in 3D** — Always call `self.add_fixed_in_frame_mobjects(text)` for text overlays in 3D. Without it, text renders in 3D space and may be invisible.
25. **Too many 3D objects** — Creating >200 small Dot3D objects in a loop will be extremely slow. Keep 3D object counts under 100.
26. **Camera orientation** — Use `self.set_camera_orientation(phi=..., theta=...)` at the start of a ThreeDScene.

#### Determinism
27. **Non-deterministic randomness** — Always call `np.random.seed(42)` at the top of `construct()` if using `np.random`. Without it, renders may differ between runs and debugging becomes impossible.

### Installation

```bash
# Install Manim Community
pip install manim

# Check installation
manim checkhealth
```

### Useful Commands

```bash
manim -pql scene.py Scene    # Preview low quality (development)
manim -pqh scene.py Scene    # Preview high quality
manim --format gif scene.py  # Output as GIF
manim checkhealth            # Verify installation
manim plugins -l             # List plugins
```
