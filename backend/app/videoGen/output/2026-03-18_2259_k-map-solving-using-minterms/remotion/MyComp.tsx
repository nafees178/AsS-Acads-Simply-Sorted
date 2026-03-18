// MyComp.tsx
import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	Sequence,
} from 'remotion';

// Color Palette
const COLORS = {
	primary: '#58C4DD', // Electric Blue
	secondary: '#83C167', // Leaf Green
	accent: '#FFFF00', // Vibrant Yellow
	background: '#1C1C1C', // Deep Charcoal
};

// --- Shared Components ---

const GridBackground: React.FC<{ pulse: number }> = ({ pulse }) => {
	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, overflow: 'hidden' }}>
			<div
				style={{
					position: 'absolute',
					width: '200%',
					height: '200%',
					top: '-50%',
					left: '-50%',
					backgroundImage: `linear-gradient(${COLORS.primary}22 1px, transparent 1px), 
                            linear-gradient(90deg, ${COLORS.primary}22 1px, transparent 1px)`,
					backgroundSize: '80px 80px',
					opacity: pulse,
					transform: 'perspective(1000px) rotateX(60deg)',
				}}
			/>
		</AbsoluteFill>
	);
};

// --- Scene 01: Introduction ---

export const Scene01Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	// Pulse effect for background
	const pulse = interpolate(Math.sin(frame / 15), [-1, 1], [0.3, 0.7]);

	// Title Entry
	const titleSpring = spring({ frame, fps, config: { damping: 12 } });
	const titleOpacity = interpolate(frame, [0, 20], [0, 1]);

	// Morphing Text Logic
	const morphStart = 120; // 4 seconds in
	const algebraOpacity = interpolate(frame, [morphStart, morphStart + 20], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const visualLogicOpacity = interpolate(frame, [morphStart + 25, morphStart + 45], [0, 1], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background }}>
			<GridBackground pulse={pulse} />

			{/* Main Title */}
			<div
				style={{
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					height: '100%',
					fontFamily: 'Helvetica, Arial, sans-serif',
					textAlign: 'center',
				}}
			>
				<h1
					style={{
						color: COLORS.primary,
						fontSize: '120px',
						fontWeight: 'bold',
						margin: 0,
						opacity: titleOpacity,
						transform: `scale(${titleSpring})`,
						textShadow: `0 0 20px ${COLORS.primary}66`,
					}}
				>
					K-MAP
					<br />
					SIMPLIFICATION
				</h1>

				{/* Morphing Subtitle Container */}
				<div style={{ position: 'relative', marginTop: '40px', height: '80px' }}>
					<div
						style={{
							position: 'absolute',
							width: '100%',
							left: '50%',
							transform: 'translateX(-50%)',
							color: COLORS.secondary,
							fontSize: '60px',
							opacity: algebraOpacity,
							whiteSpace: 'nowrap',
						}}
					>
						Boolean Algebra
					</div>
					<div
						style={{
							position: 'absolute',
							width: '100%',
							left: '50%',
							transform: 'translateX(-50%)',
							color: COLORS.accent,
							fontSize: '70px',
							fontWeight: 'bold',
							opacity: visualLogicOpacity,
							whiteSpace: 'nowrap',
						}}
					>
						Visual Logic
					</div>
				</div>
			</div>
		</AbsoluteFill>
	);
};

// --- Scene 06: Conclusion ---

export const Scene06Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const entry = (delay: number) =>
		spring({ frame: frame - delay, fps, config: { damping: 15 } });

	const fadeOut = interpolate(frame, [270, 300], [1, 0]);

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, opacity: fadeOut }}>
			<div
				style={{
					padding: '100px',
					display: 'flex',
					flexDirection: 'column',
					height: '100%',
					fontFamily: 'Helvetica, Arial, sans-serif',
				}}
			>
				{/* Header */}
				<div
					style={{
						fontSize: '80px',
						color: COLORS.primary,
						fontWeight: 'bold',
						marginBottom: '60px',
						opacity: interpolate(frame, [0, 20], [0, 1]),
					}}
				>
					Summary
				</div>

				{/* Comparison Section */}
				<div style={{ display: 'flex', justifyContent: 'space-between', flex: 1 }}>
					{/* Before Card */}
					<div
						style={{
							width: '45%',
							background: '#2A2A2A',
							borderRadius: '30px',
							padding: '40px',
							border: `2px solid ${COLORS.primary}44`,
							transform: `translateY(${interpolate(entry(20), [0, 1], [100, 0])}px)`,
							opacity: entry(20),
						}}
					>
						<div style={{ color: '#888', fontSize: '30px', marginBottom: '20px' }}>BEFORE</div>
						<div style={{ color: '#FFF', fontSize: '32px', fontFamily: 'monospace' }}>
							F = A'B'C + A'BC + <br />
							AB'C + ABC
						</div>
						<div style={{ marginTop: '30px', color: '#FF6666' }}>✖ Complex Algebra</div>
					</div>

					{/* Arrow */}
					<div
						style={{
							display: 'flex',
							alignItems: 'center',
							fontSize: '80px',
							color: COLORS.accent,
							opacity: entry(40),
						}}
					>
						→
					</div>

					{/* After Card */}
					<div
						style={{
							width: '45%',
							background: '#2A2A2A',
							borderRadius: '30px',
							padding: '40px',
							border: `2px solid ${COLORS.secondary}88`,
							transform: `translateY(${interpolate(entry(50), [0, 1], [100, 0])}px)`,
							opacity: entry(50),
						}}
					>
						<div style={{ color: '#888', fontSize: '30px', marginBottom: '20px' }}>AFTER</div>
						<div
							style={{
								color: COLORS.accent,
								fontSize: '80px',
								fontWeight: 'bold',
								fontFamily: 'monospace',
							}}
						>
							F = C
						</div>
						<div style={{ marginTop: '30px', color: COLORS.secondary }}>✔ Simple & Fast</div>
					</div>
				</div>

				{/* Final Key Insight */}
				<div
					style={{
						marginTop: 'auto',
						textAlign: 'center',
						padding: '40px',
						fontSize: '50px',
						color: COLORS.primary,
						fontWeight: 'bold',
						opacity: entry(80),
						transform: `scale(${entry(80)})`,
					}}
				>
					Visual Grouping = <span style={{ color: COLORS.accent }}>Logical Efficiency</span>
				</div>
			</div>
		</AbsoluteFill>
	);
};