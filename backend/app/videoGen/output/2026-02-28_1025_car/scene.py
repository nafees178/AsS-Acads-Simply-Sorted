from manim import *
import numpy as np

# Color Palette from Video Plan
COLOR_PRIMARY = "#58C4DD"   # Electric Blue
COLOR_SECONDARY = "#83C167" # Leaf Green
COLOR_ACCENT = "#FF6666"    # Engine Red
COLOR_BG = "#1C1C1C"        # Premium Dark Grey

class Scene02_TheFourStrokeCycle(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG
        
        # 1. Setup Cylinder and Piston
        cylinder = RoundedRectangle(corner_radius=0.1, height=5, width=3, color=WHITE)
        cylinder.to_edge(UP, buff=1)
        
        piston = Rectangle(height=1, width=2.8, fill_opacity=0.8, fill_color=GREY_A, stroke_color=WHITE)
        piston.move_to(cylinder.get_top() + DOWN * 1.5)
        
        # Valves
        v_left = Line(UP*0.3, DOWN*0.3, color=COLOR_PRIMARY).move_to(cylinder.get_top() + LEFT*0.7)
        v_right = Line(UP*0.3, DOWN*0.3, color=COLOR_ACCENT).move_to(cylinder.get_top() + RIGHT*0.7)
        
        title = Text("The Four-Stroke Cycle", color=COLOR_PRIMARY).to_edge(DOWN)
        
        self.add(cylinder, piston, v_left, v_right, title)
        
        # 2. Cycle Stages
        stages = ["1. INTAKE", "2. COMPRESSION", "3. POWER", "4. EXHAUST"]
        label = MathTex(r"\text{Stage}", color=WHITE).next_to(cylinder, RIGHT, buff=1)
        
        # --- INTAKE ---
        stage_text = Text(stages[0], color=COLOR_PRIMARY, font_size=36).next_to(label, DOWN)
        fuel_mixture = Rectangle(width=2.8, height=0.1, fill_color=COLOR_PRIMARY, fill_opacity=0.4, stroke_width=0)
        fuel_mixture.align_to(cylinder.get_top(), UP)
        
        self.play(Write(label), Write(stage_text))
        self.play(
            v_left.animate.shift(DOWN*0.3), # Open valve
            piston.animate.shift(DOWN*2.5),
            fuel_mixture.animate.stretch_to_fit_height(2.6).move_to(cylinder.get_top() + DOWN*1.3),
            run_time=2
        )
        self.wait(0.5)
        
        # --- COMPRESSION ---
        new_stage = Text(stages[1], color=WHITE, font_size=36).move_to(stage_text)
        self.play(
            Transform(stage_text, new_stage),
            v_left.animate.shift(UP*0.3), # Close valve
            piston.animate.shift(UP*2.2),
            fuel_mixture.animate.stretch_to_fit_height(0.4).move_to(cylinder.get_top() + DOWN*0.2).set_color(YELLOW),
            run_time=2
        )
        self.wait(0.5)
        
        # --- POWER ---
        new_stage = Text(stages[2], color=COLOR_ACCENT, font_size=36).move_to(stage_text)
        spark = Star(color=YELLOW, fill_opacity=1).scale(0.3).move_to(cylinder.get_top())
        
        self.play(Transform(stage_text, new_stage))
        self.play(FadeIn(spark), Flash(spark, color=COLOR_ACCENT))
        self.play(
            piston.animate.shift(DOWN*2.5),
            fuel_mixture.animate.stretch_to_fit_height(2.6).move_to(cylinder.get_top() + DOWN*1.3).set_color(COLOR_ACCENT),
            FadeOut(spark),
            run_time=1
        )
        self.wait(0.5)
        
        # --- EXHAUST ---
        new_stage = Text(stages[3], color=GREY, font_size=36).move_to(stage_text)
        self.play(
            Transform(stage_text, new_stage),
            v_right.animate.shift(DOWN*0.3), # Open exhaust
            piston.animate.shift(UP*2.5),
            fuel_mixture.animate.stretch_to_fit_height(0.01).move_to(cylinder.get_top()).set_opacity(0),
            run_time=1.5
        )
        self.play(v_right.animate.shift(UP*0.3))
        self.wait(2)


class Scene03_LineartoRotational(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG
        
        # 1. Components
        center_point = DOWN * 1
        crank_radius = 1.5
        crank_circle = Circle(radius=crank_radius, color=GREY_B).move_to(center_point)
        
        # ValueTracker for rotation
        theta = ValueTracker(0)
        
        # Crankshaft arm
        crank_arm = always_redraw(lambda: Line(
            center_point, 
            center_point + np.array([
                crank_radius * np.cos(theta.get_value()), 
                crank_radius * np.sin(theta.get_value()), 
                0
            ]),
            color=WHITE
        ))
        
        # Piston and Connecting Rod
        piston_width = 2
        piston = always_redraw(lambda: Rectangle(
            width=piston_width, height=0.8, 
            fill_color=COLOR_PRIMARY, fill_opacity=0.8
        ).move_to(UP * 2.5 + UP * (crank_radius * np.sin(theta.get_value()) / 2)))
        
        conn_rod = always_redraw(lambda: Line(
            piston.get_bottom(),
            crank_arm.get_end(),
            color=GREY_A
        ))
        
        # Visual cues
        linear_arrow = Arrow(UP*3.5, UP*1.5, color=COLOR_PRIMARY).to_edge(LEFT, buff=1.5)
        linear_label = Text("Linear Motion", color=COLOR_PRIMARY, font_size=24).next_to(linear_arrow, UP)
        
        rot_arrow = CurvedArrow(start_point=RIGHT*2, end_point=RIGHT*2 + UP*0.1, angle=TAU, color=COLOR_SECONDARY).to_edge(RIGHT, buff=1.5)
        rot_label = Text("Rotational Motion", color=COLOR_SECONDARY, font_size=24).next_to(rot_arrow, UP)
        
        # 2. Animation
        self.add(crank_circle, crank_arm, piston, conn_rod)
        self.play(Write(linear_label), Create(linear_arrow))
        self.play(Write(rot_label), Create(rot_arrow))
        
        # Trace the rotation
        dot = Dot(color=COLOR_ACCENT)
        dot.add_updater(lambda m: m.move_to(crank_arm.get_end()))
        path = TracedPath(dot.get_center, stroke_color=COLOR_ACCENT, stroke_width=4)
        self.add(dot, path)
        
        # Conversion Vector
        force_vec = always_redraw(lambda: Arrow(
            piston.get_center(), piston.get_center() + DOWN*1.5, 
            buff=0, color=COLOR_ACCENT, stroke_width=8
        ))
        self.play(FadeIn(force_vec))
        
        # Animate the movement
        self.play(theta.animate.set_value(TAU * 3), run_time=8, rate_func=linear)
        
        self.wait(2)


class Scene05_OvercomingtheElements(Scene):
    def construct(self):
        self.camera.background_color = COLOR_BG
        
        # 1. Coordinate System
        axes = Axes(
            x_range=[0, 10, 1],
            y_range=[0, 10, 1],
            axis_config={"include_tip": True, "color": GREY_A}
        ).scale(0.8).to_edge(DOWN)
        
        labels = axes.get_axis_labels(x_label="v", y_label="Force")
        
        # 2. The Car (Simplified)
        car_body = RoundedRectangle(corner_radius=0.2, width=2, height=0.8, fill_color=COLOR_PRIMARY, fill_opacity=1)
        car_body.move_to(axes.c2p(2, 2))
        wheel1 = Circle(radius=0.2, color=WHITE, fill_opacity=1).move_to(car_body.get_bottom() + LEFT*0.6)
        wheel2 = Circle(radius=0.2, color=WHITE, fill_opacity=1).move_to(car_body.get_bottom() + RIGHT*0.6)
        car = VGroup(car_body, wheel1, wheel2)
        
        # 3. Physics Equations
        eq_drag = MathTex(r"F_d = \frac{1}{2} \rho v^2 C_d A", color=COLOR_ACCENT).to_corner(UR, buff=1)
        eq_fric = MathTex(r"F_f = \mu N", color=COLOR_SECONDARY).next_to(eq_drag, DOWN, aligned_edge=LEFT)
        
        self.play(Create(axes), Write(labels))
        self.play(FadeIn(car))
        self.play(Write(eq_drag), Write(eq_fric))
        
        # 4. Force Vectors
        v_tracker = ValueTracker(2)
        
        f_engine = always_redraw(lambda: Arrow(
            car.get_right(), car.get_right() + RIGHT * 2, 
            buff=0, color=COLOR_PRIMARY
        ))
        
        # Drag grows quadratically with v
        f_drag = always_redraw(lambda: Arrow(
            car.get_left(), car.get_left() + LEFT * (v_tracker.get_value()**2 * 0.05), 
            buff=0, color=COLOR_ACCENT
        ))
        
        # Friction is constant-ish
        f_friction = always_redraw(lambda: Arrow(
            car.get_bottom(), car.get_bottom() + LEFT * 0.8, 
            buff=0, color=COLOR_SECONDARY
        ))
        
        self.play(GrowArrow(f_engine), GrowArrow(f_drag), GrowArrow(f_friction))
        
        # 5. Air Streamlines
        streamlines = VGroup()
        for i in range(3):
            y_off = (i - 1) * 0.4
            line = CubicBezier(
                car.get_left() + LEFT*3 + UP*y_off,
                car.get_left() + LEFT*1 + UP*y_off,
                car.get_top() + LEFT*0.5 + UP*0.2,
                car.get_right() + RIGHT*3 + UP*y_off,
                color=WHITE, stroke_opacity=0.3
            )
            streamlines.add(line)
            
        self.play(LaggedStart(*[Create(s) for s in streamlines], lag_ratio=0.2))
        
        # 6. Speed Up Animation
        self.play(
            v_tracker.animate.set_value(8),
            car.animate.shift(RIGHT * 2),
            run_time=4,
            rate_func=bezier([0, 0, 1, 1])
        )
        
        # Highlight the Drag Force growth
        self.play(Indicate(eq_drag), f_drag.animate.set_color(YELLOW))
        self.wait(2)