from manim import *

# Global Color Palette
PRIMARY_BLUE = "#58C4DD"   # Internal Energy / Cold
SECONDARY_RED = "#FF6666"  # Heat / Hot
ACCENT_YELLOW = "#FFFF00" # Work / Energy
BG_DARK = "#1C1C1C"

class Scene02_TheFirstLawConservation(Scene):
    """
    Scene 2: The First Law (Conservation)
    Visualizes ΔU = Q - W using a piston-cylinder diagram.
    """
    def construct(self):
        # Set background
        self.camera.background_color = BG_DARK

        # 1. Title and Equation
        title = Text("The First Law: Conservation", font_size=40, color=WHITE)
        title.to_edge(UP, buff=0.5)

        # Equation: ΔU = Q - W
        # We split it into parts to color and animate them individually
        eq = MathTex(
            r"\Delta U", r"=", r"Q", r"-", r"W",
            font_size=60
        )
        eq.set_color_by_tex(r"\Delta U", PRIMARY_BLUE)
        eq.set_color_by_tex("Q", SECONDARY_RED)
        eq.set_color_by_tex("W", ACCENT_YELLOW)
        eq.next_to(title, DOWN, buff=0.5)

        # 2. Piston-Cylinder Diagram
        # The container
        cylinder = VGroup(
            Line(LEFT * 1.5 + UP * 1.5, LEFT * 1.5 + DOWN * 1.5),
            Line(LEFT * 1.5 + DOWN * 1.5, RIGHT * 1.5 + DOWN * 1.5),
            Line(RIGHT * 1.5 + DOWN * 1.5, RIGHT * 1.5 + UP * 1.5)
        ).shift(DOWN * 1.2)

        # ValueTracker to control the piston height dynamically
        piston_height = ValueTracker(0.8)

        # The Piston Head
        piston = always_redraw(lambda: 
            Rectangle(
                width=2.9, height=0.3, 
                fill_color=GREY_B, fill_opacity=1,
                stroke_color=WHITE
            ).move_to(cylinder[1].get_center() + UP * piston_height.get_value())
        )

        # The Gas inside (representing Internal Energy)
        gas = always_redraw(lambda:
            Rectangle(
                width=2.9, height=piston_height.get_value(),
                fill_color=PRIMARY_BLUE, fill_opacity=0.4,
                stroke_width=0
            ).align_to(cylinder[1], DOWN).shift(UP * 0.05)
        )

        # 3. Animation Sequence
        self.play(Write(title))
        self.play(Write(eq))
        self.play(Create(cylinder), FadeIn(gas))
        self.play(FadeIn(piston))
        self.wait(1)

        # Heat entering (Q)
        heat_arrows = VGroup(*[
            Arrow(DOWN * 3.5 + RIGHT * x, DOWN * 2.5 + RIGHT * x, color=SECONDARY_RED)
            for x in [-0.6, 0, 0.6]
        ])
        
        q_label = MathTex("Q", color=SECONDARY_RED).next_to(heat_arrows, DOWN)

        self.play(
            LaggedStartMap(Create, heat_arrows),
            Write(q_label),
            Indicate(eq[2]), # Highlight Q in equation
            run_time=1.5
        )

        # Piston moves up (Work being done)
        w_label = MathTex("W", color=ACCENT_YELLOW)
        w_label.add_updater(lambda m: m.next_to(piston, UP, buff=0.2))

        self.play(
            piston_height.animate.set_value(2.2),
            Indicate(eq[4]), # Highlight W in equation
            FadeIn(w_label),
            run_time=3,
            rate_func=slow_into
        )

        # Final emphasis on Internal Energy change
        self.play(
            Indicate(eq[0]),
            gas.animate.set_fill(opacity=0.6),
            run_time=2
        )

        self.wait(2)


class Scene04_TheEfficiencyLimit(Scene):
    """
    Scene 4: The Efficiency Limit
    Visualizes a heat engine between two reservoirs and the efficiency formula.
    """
    def construct(self):
        # Set background
        self.camera.background_color = BG_DARK

        # 1. Setup Reservoirs and Engine
        title = Text("The Efficiency Limit", font_size=40, color=WHITE)
        title.to_edge(UP, buff=0.5)

        # Hot Reservoir
        hot_res = RoundedRectangle(corner_radius=0.2, width=4, height=1.2, color=SECONDARY_RED, fill_opacity=0.2)
        hot_res.shift(UP * 2.5)
        th_label = MathTex("T_H", color=SECONDARY_RED).move_to(hot_res)
        hot_text = Text("Hot Reservoir", font_size=20, color=SECONDARY_RED).next_to(hot_res, UP, buff=0.1)

        # Cold Reservoir
        cold_res = RoundedRectangle(corner_radius=0.2, width=4, height=1.2, color=PRIMARY_BLUE, fill_opacity=0.2)
        cold_res.shift(DOWN * 2.5)
        tc_label = MathTex("T_C", color=PRIMARY_BLUE).move_to(cold_res)
        cold_text = Text("Cold Reservoir", font_size=20, color=PRIMARY_BLUE).next_to(cold_res, DOWN, buff=0.1)

        # Engine Circle
        engine = Circle(radius=0.8, color=WHITE, fill_color=BG_DARK, fill_opacity=1)
        engine.move_to(ORIGIN)
        engine_label = Text("Engine", font_size=28).move_to(engine)

        # 2. Flows
        # Flow from Hot to Engine
        flow_in = Arrow(hot_res.get_bottom(), engine.get_top(), color=SECONDARY_RED, buff=0.1, stroke_width=8)
        qh_label = MathTex("Q_H", color=SECONDARY_RED, font_size=32).next_to(flow_in, LEFT)

        # Flow to Cold
        flow_out = Arrow(engine.get_bottom(), cold_res.get_top(), color=PRIMARY_BLUE, buff=0.1, stroke_width=6)
        qc_label = MathTex("Q_C", color=PRIMARY_BLUE, font_size=32).next_to(flow_out, LEFT)

        # Work output
        work_out = Arrow(engine.get_right(), engine.get_right() + RIGHT * 2, color=ACCENT_YELLOW, buff=0.1)
        w_label = MathTex("W", color=ACCENT_YELLOW).next_to(work_out, RIGHT)

        # 3. Efficiency Formula
        formula = MathTex(
            r"\eta", r"=", r"1", r"-", r"\frac{T_C}{T_H}",
            font_size=54
        )
        formula.set_color_by_tex("T_C", PRIMARY_BLUE)
        formula.set_color_by_tex("T_H", SECONDARY_RED)
        formula.to_edge(LEFT, buff=1).shift(UP * 0.5)

        # 4. Animation Sequence
        self.play(Write(title))
        self.play(
            Create(hot_res), Write(th_label), Write(hot_text),
            Create(cold_res), Write(tc_label), Write(cold_text)
        )
        self.play(Create(engine), Write(engine_label))
        self.wait(1)

        # Animate Energy Flow
        self.play(GrowArrow(flow_in), Write(qh_label))
        self.wait(0.5)
        
        # Split flow: Work and Exhaust
        self.play(
            GrowArrow(work_out), Write(w_label),
            GrowArrow(flow_out), Write(qc_label),
            run_time=2
        )
        self.wait(1)

        # Show Formula
        self.play(Write(formula))
        self.wait(1)

        # Highlight the "Tax" (TC/TH)
        box = SurroundingRectangle(formula[4], color=WHITE, buff=0.1)
        explanation = Text("The 'Universe Tax'", font_size=24, color=WHITE).next_to(box, DOWN, buff=0.4)
        
        self.play(Create(box))
        self.play(Write(explanation))
        
        # Animate TH and TC to show relationship
        self.play(
            Indicate(tc_label),
            Indicate(th_label),
            formula[4].animate.scale(1.2),
            run_time=2
        )

        self.wait(3)