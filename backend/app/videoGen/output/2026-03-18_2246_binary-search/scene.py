from manim import *
import random

# Global Color Palette
PRIMARY_BLUE = "#58C4DD"
SUCCESS_GREEN = "#83C167"
HIGHLIGHT_YELLOW = "#FFFF00"
BG_COLOR = "#1C1C1C"

class Scene02_ThePrerequisite(Scene):
    def construct(self):
        # Set background color
        self.camera.background_color = BG_COLOR

        # 1. Title
        title = Text("Prerequisite: Sorted Data", font_size=40, color=PRIMARY_BLUE)
        title.to_edge(UP)
        self.play(Write(title))
        self.wait(0.5)

        # 2. Create Unsorted Array
        # Using 15 elements to ensure readability on screen
        numbers = list(range(1, 16))
        shuffled_numbers = numbers.copy()
        random.seed(42)
        random.shuffle(shuffled_numbers)

        def create_array(nums):
            group = VGroup()
            for n in nums:
                square = Square(side_length=0.7, stroke_color=WHITE, stroke_width=2)
                tex = Text(str(n), font_size=24)
                cell = VGroup(square, tex)
                group.add(cell)
            group.arrange(RIGHT, buff=0.1)
            return group

        unsorted_array = create_array(shuffled_numbers)
        unsorted_array.center()

        self.play(
            LaggedStart(
                *[FadeIn(m, shift=DOWN) for m in unsorted_array],
                lag_ratio=0.05
            )
        )
        self.wait(1)

        # 3. Shuffle/Sort Animation
        sorted_array = create_array(numbers)
        sorted_array.center()

        # Create a mapping for the transformation
        # We transform each element of the unsorted array to its sorted counterpart
        transformations = []
        for i, val in enumerate(shuffled_numbers):
            # Find where this value should go in the sorted array
            target_index = numbers.index(val)
            transformations.append(unsorted_array[i].animate.move_to(sorted_array[target_index]))

        self.play(*transformations, run_time=2)
        self.wait(1)

        # 4. Highlight the sorted nature
        brace = Brace(unsorted_array, DOWN, color=SUCCESS_GREEN)
        brace_text = brace.get_text("Perfectly Ordered").set_color(SUCCESS_GREEN)

        self.play(Create(brace), Write(brace_text))
        self.wait(2)

        # Clear for next scene
        self.play(FadeOut(title), FadeOut(unsorted_array), FadeOut(brace), FadeOut(brace_text))
        self.wait(1)


class Scene03_TheMiddleLogic(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # 1. Create Sorted Array (0 to 14)
        numbers = list(range(0, 15))
        array = VGroup()
        for i in numbers:
            sq = Square(side_length=0.8, stroke_color=WHITE)
            val = Text(str(i), font_size=28)
            cell = VGroup(sq, val)
            array.add(cell)
        array.arrange(RIGHT, buff=0.1).center()

        target_val = 3
        target_text = Text(f"Target: {target_val}", color=HIGHLIGHT_YELLOW, font_size=36)
        target_text.to_edge(UP).shift(LEFT * 3)

        self.add(array)
        self.play(Write(target_text))
        self.wait(0.5)

        # 2. Pointers Setup
        low_ptr = Arrow(DOWN, UP, color=PRIMARY_BLUE).next_to(array[0], DOWN)
        low_label = Text("Low", font_size=20, color=PRIMARY_BLUE).next_to(low_ptr, DOWN)

        high_ptr = Arrow(DOWN, UP, color=PRIMARY_BLUE).next_to(array[14], DOWN)
        high_label = Text("High", font_size=20, color=PRIMARY_BLUE).next_to(high_ptr, DOWN)

        self.play(
            Create(low_ptr), Write(low_label),
            Create(high_ptr), Write(high_label)
        )
        self.wait(1)

        # 3. Calculate Mid
        # Mid = (0 + 14) // 2 = 7
        mid_idx = 7
        mid_ptr = Arrow(UP, DOWN, color=HIGHLIGHT_YELLOW).next_to(array[mid_idx], UP)
        mid_label = Text("Mid", font_size=20, color=HIGHLIGHT_YELLOW).next_to(mid_ptr, UP)

        self.play(Create(mid_ptr), Write(mid_label))
        self.play(Indicate(array[mid_idx], color=HIGHLIGHT_YELLOW))
        self.wait(1)

        # 4. Logic Explanation
        logic_text = Text("3 < 7? Yes.", font_size=32, color=HIGHLIGHT_YELLOW)
        logic_text.to_edge(UP).shift(RIGHT * 3)
        
        self.play(Write(logic_text))
        self.wait(1)

        # Discard right side
        discard_rect = SurroundingRectangle(array[8:], color=RED, buff=0.05)
        self.play(Create(discard_rect))
        self.play(
            array[8:].animate.set_opacity(0.2),
            FadeOut(high_ptr), FadeOut(high_label),
            FadeOut(discard_rect)
        )
        self.wait(2)


class Scene04_HalvingtheSpace(Scene):
    def construct(self):
        self.camera.background_color = BG_COLOR

        # 1. Reconstruct previous state (Target 3, Left half active)
        numbers = list(range(0, 15))
        array = VGroup()
        for i in numbers:
            sq = Square(side_length=0.8, stroke_color=WHITE)
            val = Text(str(i), font_size=28)
            cell = VGroup(sq, val)
            array.add(cell)
        array.arrange(RIGHT, buff=0.1).center()
        array[8:].set_opacity(0.2)
        self.add(array)

        target_text = Text("Target: 3", color=HIGHLIGHT_YELLOW, font_size=36).to_edge(UP).shift(LEFT * 3)
        self.add(target_text)

        # Current Pointers
        low_ptr = Arrow(DOWN, UP, color=PRIMARY_BLUE).next_to(array[0], DOWN)
        low_label = Text("Low", font_size=20, color=PRIMARY_BLUE).next_to(low_ptr, DOWN)
        
        # High moves to Mid - 1 (index 6)
        high_ptr = Arrow(DOWN, UP, color=PRIMARY_BLUE).next_to(array[6], DOWN)
        high_label = Text("High", font_size=20, color=PRIMARY_BLUE).next_to(high_ptr, DOWN)

        mid_ptr = Arrow(UP, DOWN, color=HIGHLIGHT_YELLOW).next_to(array[7], UP)
        mid_label = Text("Mid", font_size=20, color=HIGHLIGHT_YELLOW).next_to(mid_ptr, UP)

        self.add(low_ptr, low_label, high_ptr, high_label, mid_ptr, mid_label)
        self.wait(1)

        # 2. Iteration 2: New Mid
        # New Mid = (0 + 6) // 2 = 3
        new_mid_idx = 3
        
        self.play(
            mid_ptr.animate.next_to(array[new_mid_idx], UP),
            mid_label.animate.next_to(array[new_mid_idx], UP, buff=0.5),
            run_time=1.5
        )
        self.play(Indicate(array[new_mid_idx], color=HIGHLIGHT_YELLOW))
        
        # Compare: Target 3 == Mid Value 3?
        match_text = Text("Match Found!", font_size=40, color=SUCCESS_GREEN)
        match_text.to_edge(UP).shift(RIGHT * 3)
        
        self.play(Write(match_text))
        self.play(
            array[new_mid_idx][0].animate.set_fill(SUCCESS_GREEN, opacity=0.5),
            array[new_mid_idx][1].animate.set_color(SUCCESS_GREEN)
        )
        self.wait(1)

        # 3. Visualizing "Halving"
        # Dim everything else to show the power of the search
        other_indices = [i for i in range(15) if i != new_mid_idx]
        self.play(
            *[array[i].animate.set_opacity(0.1) for i in other_indices],
            FadeOut(low_ptr), FadeOut(low_label),
            FadeOut(high_ptr), FadeOut(high_label),
            FadeOut(mid_ptr), FadeOut(mid_label)
        )

        final_msg = Text("Search Area Halved Each Step", font_size=36, color=PRIMARY_BLUE)
        final_msg.next_to(array, DOWN, buff=1)
        self.play(Write(final_msg))
        self.wait(3)