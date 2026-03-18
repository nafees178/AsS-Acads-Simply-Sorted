from manim import *

# Set background color globally
config.background_color = "#1C1C1C"

# Color Palette
PRIMARY = "#58C4DD"  # Electric Blue
SECONDARY = "#83C167"  # Leaf Green
ACCENT = "#FFFF00"  # Vibrant Yellow

class Scene02_TheTruthTableMinterms(Scene):
    def construct(self):
        # Title
        title = Text("Truth Table & Minterms", color=PRIMARY, font_size=40).to_edge(UP)
        self.play(Write(title))

        # Create Truth Table
        # Columns: A, B, C | F
        table_data = [
            ["0", "0", "0", "0"],
            ["0", "0", "1", "1"], # m1
            ["0", "1", "0", "0"],
            ["0", "1", "1", "1"], # m3
            ["1", "0", "0", "0"],
            ["1", "0", "1", "1"], # m5
            ["1", "1", "0", "0"],
            ["1", "1", "1", "1"], # m7
        ]
        
        table = Table(
            table_data,
            col_labels=[MathTex("A"), MathTex("B"), MathTex("C"), MathTex("F")],
            include_outer_lines=True,
            line_config={"stroke_width": 1, "color": GREY}
        ).scale(0.6).shift(LEFT * 3)

        self.play(Create(table))
        self.wait(1)

        # Highlight rows with Output = 1
        highlight_indices = [2, 4, 6, 8] # 1-indexed including header
        highlights = VGroup()
        
        for idx in highlight_indices:
            rect = table.get_rows()[idx].copy()
            rect.set_fill(SECONDARY, opacity=0.3)
            highlights.add(rect)
        
        self.play(FadeIn(highlights))
        
        # Minterm Labels
        m_labels = VGroup(
            MathTex("m_1", color=SECONDARY).next_to(table.get_rows()[2], RIGHT),
            MathTex("m_3", color=SECONDARY).next_to(table.get_rows()[4], RIGHT),
            MathTex("m_5", color=SECONDARY).next_to(table.get_rows()[6], RIGHT),
            MathTex("m_7", color=SECONDARY).next_to(table.get_rows()[8], RIGHT),
        )
        
        self.play(Write(m_labels))
        self.wait(1)

        # Boolean Sum Expression
        expression = MathTex(
            r"F = \sum(1, 3, 5, 7)", 
            color=ACCENT, 
            font_size=48
        ).shift(RIGHT * 3.5)
        
        self.play(Write(expression))
        self.play(Circumscribe(expression, color=ACCENT))
        self.wait(2)

class Scene03_MappingtotheGrid(Scene):
    def construct(self):
        # Setup Grid (2x4)
        # Rows: A=0, A=1
        # Cols: BC=00, 01, 11, 10 (Gray Code)
        
        grid = VGroup()
        cells = []
        for r in range(2):
            row_cells = []
            for c in range(4):
                cell = Square(side_length=1.2, stroke_color=WHITE, stroke_width=2)
                cell.shift(RIGHT * c * 1.2 + DOWN * r * 1.2)
                row_cells.append(cell)
                grid.add(cell)
            cells.append(row_cells)
        
        grid.center()
        
        # Labels
        a_label = MathTex("A").next_to(grid, LEFT, buff=0.8).shift(UP * 0.6)
        a_vals = VGroup(MathTex("0"), MathTex("1"))
        a_vals[0].next_to(cells[0][0], LEFT, buff=0.3)
        a_vals[1].next_to(cells[1][0], LEFT, buff=0.3)
        
        bc_label = MathTex("BC").next_to(grid, UP, buff=0.8).shift(LEFT * 1.8)
        bc_vals = VGroup(MathTex("00"), MathTex("01"), MathTex("11"), MathTex("10"))
        for i, val in enumerate(bc_vals):
            val.next_to(cells[0][i], UP, buff=0.3)

        self.play(Create(grid), Write(a_label), Write(bc_label))
        self.play(Write(a_vals), Write(bc_vals))
        self.wait(1)

        # Minterm mapping: m1(0,01), m3(0,11), m5(1,01), m7(1,11)
        # Indices in cells: (0,1), (0,2), (1,1), (1,2)
        target_indices = [(0, 1), (0, 2), (1, 1), (1, 2)]
        ones = VGroup()
        
        for r, c in target_indices:
            one = MathTex("1", color=SECONDARY, font_size=60)
            one.move_to(cells[r][c].get_center())
            ones.add(one)

        # Animation of ones flying in
        self.play(LaggedStart(*[FadeIn(one, scale=1.5) for one in ones], lag_ratio=0.3))
        self.wait(1)
        
        # Highlight Gray Code adjacency
        gray_box = SurroundingRectangle(bc_vals[1:3], color=ACCENT, buff=0.1)
        gray_text = Text("Gray Code: 1-bit change", color=ACCENT, font_size=24).next_to(gray_box, UP)
        
        self.play(Create(gray_box), Write(gray_text))
        self.wait(2)

class Scene04_ThePowerofGrouping(Scene):
    def construct(self):
        # Recreate Grid from Scene 3
        grid = VGroup(*[Square(side_length=1.2) for _ in range(8)]).arrange_in_grid(rows=2, cols=4, buff=0)
        grid.center()
        
        ones_pos = [1, 2, 5, 6] # Indices in the 8-cell grid for m1, m3, m5, m7
        ones = VGroup()
        for idx in ones_pos:
            one = MathTex("1", color=SECONDARY).move_to(grid[idx].get_center())
            ones.add(one)
            
        self.add(grid, ones)
        
        # Grouping
        # The group is the central 2x2 block (cols 01 and 11)
        group_rect = RoundedRectangle(
            width=2.4, height=2.4, corner_radius=0.3, 
            color=PRIMARY, stroke_width=6, fill_opacity=0.2
        )
        group_rect.move_to(grid.get_center())
        
        self.play(Create(group_rect))
        self.wait(1)
        
        # Analysis labels
        # A changes from 0 to 1
        # B changes from 0 to 1
        # C is always 1
        
        analysis = VGroup(
            MathTex("A: 0 \\to 1", color=RED),
            MathTex("B: 0 \\to 1", color=RED),
            MathTex("C: 1 \\to 1", color=SECONDARY)
        ).arrange(DOWN, aligned_edge=LEFT).to_edge(RIGHT, buff=1)
        
        self.play(Write(analysis[0]))
        self.wait(0.5)
        self.play(Write(analysis[1]))
        self.wait(0.5)
        self.play(Write(analysis[2]))
        
        self.play(Indicate(analysis[2]))
        self.wait(2)

class Scene05_ExtractingtheResult(Scene):
    def construct(self):
        # Initial Equation
        eq1 = MathTex(
            r"F", r"=", r"\bar{A}\bar{B}C", r"+", r"\bar{A}BC", r"+", r"A\bar{B}C", r"+", r"ABC",
            font_size=40
        ).to_edge(UP, buff=1.5)
        
        self.play(Write(eq1))
        self.wait(1)

        # Crossing out redundant variables (A and B)
        # We'll create crosses over the A and B terms
        # Indices for A/B in the tex strings:
        # \bar{A}\bar{B} is at eq1[2], \bar{A}B at eq1[4], etc.
        
        crosses = VGroup()
        # Cross out A and B parts conceptually
        for i in [2, 4, 6, 8]:
            # Each minterm is 3 chars long (e.g., \bar{A}\bar{B}C)
            # This is a simplification for visual effect
            c = Cross(eq1[i], stroke_color=RED, stroke_width=2, scale_factor=0.8)
            crosses.add(c)
            
        self.play(Create(crosses))
        self.wait(1)

        # Final simplified result
        eq2 = MathTex(
            r"F", r"=", r"C",
            color=ACCENT,
            font_size=72
        )
        
        # Move eq1 and crosses out while bringing in eq2
        self.play(
            FadeOut(eq1),
            FadeOut(crosses),
            Write(eq2)
        )
        
        self.play(Circumscribe(eq2, color=ACCENT, fade_out=True))
        
        summary = Text("Logic Simplified!", color=PRIMARY, font_size=32).next_to(eq2, DOWN, buff=1)
        self.play(FadeIn(summary, shift=UP))
        
        self.wait(3)