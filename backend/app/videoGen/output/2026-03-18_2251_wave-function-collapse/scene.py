from manim import *
import numpy as np

# Set background color globally for the premium look
config.background_color = "#1C1C1C"

# Color Palette
QUANTUM_BLUE = "#58C4DD"
PROB_GREEN = "#83C167"
OBS_YELLOW = "#FFFF00"
BG_CHARCOAL = "#1C1C1C"

class Scene02_DefiningtheWaveFunction(Scene):
    def construct(self):
        # 1. Setup Axes
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-1.5, 2, 1],
            x_length=10,
            y_length=5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).to_edge(DOWN, buff=1)

        # 2. Define Wave Function: A Gaussian envelope multiplied by a cosine
        def psi_func(x):
            envelope = np.exp(-x**2 / 2)
            oscillation = np.cos(5 * x)
            return 1.5 * envelope * oscillation

        wave = axes.plot(psi_func, color=QUANTUM_BLUE, x_range=[-4, 4])
        
        # 3. Shaded Area (Probability)
        # We use the absolute value or just the area under the envelope for visual clarity
        area = axes.get_area(wave, x_range=[-4, 4], color=QUANTUM_BLUE, opacity=0.2)

        # 4. Labels
        title = Text("The Wave Function", font_size=40).to_edge(UP, buff=0.5)
        equation = MathTex(r"\Psi(x)", color=QUANTUM_BLUE, font_size=60).next_to(title, DOWN, buff=0.3)
        
        desc_text = Text(
            "A wave of probability", 
            font_size=28, 
            color=GREY_A
        ).next_to(axes, UP, buff=0.2)

        # 5. Animation Sequence
        self.play(Write(title))
        self.play(Create(axes), run_time=1)
        self.wait(0.5)
        
        self.play(
            Create(wave),
            FadeIn(area),
            Write(equation),
            run_time=3
        )
        self.play(Write(desc_text))
        
        # Subtle oscillation effect to show it's "active"
        self.play(wave.animate.shift(UP * 0.1), run_time=1, rate_func=there_and_back)
        self.wait(5)

class Scene03_TheCloudofSuperposition(Scene):
    def construct(self):
        # 1. Recreate state from previous scene
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[-1.5, 2, 1],
            x_length=10,
            y_length=5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).to_edge(DOWN, buff=1)

        def psi_func(x):
            return 1.5 * np.exp(-x**2 / 2) * np.cos(5 * x)

        wave = axes.plot(psi_func, color=QUANTUM_BLUE, x_range=[-4, 4])
        title = Text("Superposition", font_size=40).to_edge(UP, buff=0.5)
        
        self.add(axes, wave, title)

        # 2. Create the Cloud of Dots (Probability Density)
        # We generate dots using a normal distribution to mimic the density
        np.random.seed(42) # Deterministic randomness
        num_dots = 400
        dots = VGroup()
        for _ in range(num_dots):
            # Sample x from normal distribution, y is small random jitter
            x_val = np.random.normal(0, 1.2)
            y_val = np.random.uniform(-0.5, 0.5)
            
            dot = Dot(
                point=axes.c2p(x_val, y_val, 0),
                radius=0.03,
                color=QUANTUM_BLUE,
                fill_opacity=np.random.uniform(0.3, 0.8)
            )
            dots.add(dot)

        # 3. Animation: Transform Wave into Cloud
        sub_text = Text(
            "Everywhere and nowhere at once", 
            font_size=30, 
            color=QUANTUM_BLUE
        ).next_to(title, DOWN, buff=0.3)

        self.play(Write(sub_text))
        self.wait(1)

        # Morph the wave line into the cloud of dots
        self.play(
            ReplacementTransform(wave, dots),
            run_time=3,
            lag_ratio=0.01
        )

        # 4. "Pulsing" the cloud
        self.play(
            dots.animate.scale(1.1),
            rate_func=there_and_back,
            run_time=2
        )
        
        self.wait(4)

class Scene05_TheCollapse(Scene):
    def construct(self):
        # 1. Setup
        axes = Axes(
            x_range=[-4, 4, 1],
            y_range=[0, 5, 1],
            x_length=10,
            y_length=5,
            axis_config={"include_tip": False, "color": GREY_B},
        ).to_edge(DOWN, buff=1)

        title = Text("Wave Function Collapse", font_size=40).to_edge(UP, buff=0.5)
        
        # 2. ValueTrackers for the "Collapse"
        # Sigma controls the width, Amplitude controls the height
        sigma = ValueTracker(1.5)
        amplitude = ValueTracker(1.0)
        
        # 3. Dynamic Wave (Gaussian)
        # As sigma -> 0, the function becomes a spike (Dirac Delta approximation)
        wave = always_redraw(lambda: 
            axes.plot(
                lambda x: amplitude.get_value() * np.exp(-(x - 1.0)**2 / (2 * sigma.get_value()**2)),
                color=PROB_GREEN,
                x_range=[-4, 4]
            )
        )

        label_before = Text("Spread of possibilities", font_size=24, color=QUANTUM_BLUE).next_to(axes, UP)
        
        self.add(axes, title, wave, label_before)
        self.wait(2)

        # 4. The Collapse Animation
        # We shift the wave to a specific point (x=1.0) and sharpen it
        label_after = Text("Definite Location", font_size=32, color=PROB_GREEN).next_to(axes, UP)
        
        # Flash effect to simulate measurement
        flash = Square(width=20, height=20, fill_color=WHITE, fill_opacity=0).set_stroke(width=0)
        self.add(flash)

        self.play(
            flash.animate.set_opacity(0.3),
            rate_func=there_and_back,
            run_time=0.2
        )
        
        self.play(
            sigma.animate.set_value(0.05),
            amplitude.animate.set_value(4.5),
            ReplacementTransform(label_before, label_after),
            run_time=1.5,
            rate_func=exponential_decay
        )
        
        # 5. Highlight the Result
        result_arrow = Arrow(
            start=axes.c2p(1.0, 5, 0), 
            end=axes.c2p(1.0, 4.6, 0), 
            color=OBS_YELLOW
        )
        self.play(Create(result_arrow))
        
        final_text = MathTex(r"x = 1.0", color=PROB_GREEN).next_to(result_arrow, UP)
        self.play(Write(final_text))

        self.wait(5)