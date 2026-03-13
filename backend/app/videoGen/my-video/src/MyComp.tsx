// MyComp.tsx
import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
} from 'remotion';

// Color Palette
const COLORS = {
	primary: '#58C4DD', // Manim Blue
	secondary: '#83C167', // Eigen-Green
	accent: '#FFFF00', // Vector Gold
	background: '#1C1C1C', // Premium Dark
	text: '#FFFFFF',
};

// --- Helper Components ---

const Label: React.FC<{
	text: string;
	color: string;
	x: number;
	y: number;
	opacity: number;
	lineDir: 'up' | 'down';
}> = ({ text, color, x, y, opacity, lineDir }) => {
	return (
		<div
			style={{
				position: 'absolute',
				left: x,
				top: y,
				opacity,
				display: 'flex',
				flexDirection: lineDir === 'up' ? 'column-reverse' : 'column',
				alignItems: 'center',
			}}
		>
			<div style={{ width: 2, height: 60, backgroundColor: color }} />
			<div
				style={{
					color,
					fontSize: 32,
					fontWeight: 'bold',
					fontFamily: 'sans-serif',
					padding: '10px 20px',
					border: `2px solid ${color}`,
					borderRadius: 8,
					backgroundColor: 'rgba(0,0,0,0.5)',
				}}
			>
				{text}
			</div>
		</div>
	);
};

// --- Scene Components ---

export const Scene02Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const eqSpring = spring({ frame, fps, config: { damping: 12 } });
	const opacity = interpolate(frame, [0, 20], [0, 1]);

	// Timings for labels
	const label1Opacity = interpolate(frame, [40, 60], [0, 1], { extrapolateRight: 'clamp' });
	const label2Opacity = interpolate(frame, [70, 90], [0, 1], { extrapolateRight: 'clamp' });
	const label3Opacity = interpolate(frame, [100, 120], [0, 1], { extrapolateRight: 'clamp' });

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' }}>
			<div
				style={{
					display: 'flex',
					fontSize: 180,
					fontFamily: 'serif',
					color: COLORS.text,
					transform: `scale(${eqSpring})`,
					opacity,
				}}
			>
				<span style={{ color: COLORS.primary, marginRight: 20 }}>A</span>
				<span style={{ color: COLORS.accent, fontStyle: 'italic' }}>v</span>
				<span style={{ margin: '0 40px' }}>=</span>
				<span style={{ color: COLORS.secondary, fontStyle: 'italic', marginRight: 20 }}>λ</span>
				<span style={{ color: COLORS.accent, fontStyle: 'italic' }}>v</span>
			</div>

			{/* Matrix Label */}
			<Label text="Matrix" color={COLORS.primary} x={780} y={320} opacity={label1Opacity} lineDir="down" />
			
			{/* Eigenvector Label */}
			<Label text="Eigenvector" color={COLORS.accent} x={920} y={660} opacity={label2Opacity} lineDir="up" />
			
			{/* Eigenvalue Label */}
			<Label text="Eigenvalue" color={COLORS.secondary} x={1080} y={320} opacity={label3Opacity} lineDir="down" />
		</AbsoluteFill>
	);
};

export const Scene04Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, width } = useVideoConfig();

	const card1Move = spring({ frame, fps, delay: 10, config: { damping: 15 } });
	const card2Move = spring({ frame, fps, delay: 30, config: { damping: 15 } });

	const cardStyle: React.CSSProperties = {
		width: 600,
		height: 400,
		backgroundColor: '#2A2A2A',
		borderRadius: 30,
		border: `4px solid ${COLORS.primary}`,
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 40,
		boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
	};

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, flexDirection: 'row', justifyContent: 'space-evenly', alignItems: 'center' }}>
			{/* Left Card: Algebraic */}
			<div
				style={{
					...cardStyle,
					borderColor: COLORS.primary,
					transform: `translateX(${interpolate(card1Move, [0, 1], [-width / 2, 0])}px)`,
					opacity: card1Move,
				}}
			>
				<div style={{ color: COLORS.primary, fontSize: 48, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
					Algebraic Multiplicity
				</div>
				<div style={{ width: 100, height: 100, borderRadius: '50%', border: `8px solid ${COLORS.primary}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, color: COLORS.primary }}>
					#λ
				</div>
				<div style={{ color: COLORS.text, fontSize: 28, marginTop: 30 }}>Count of Repeated Roots</div>
			</div>

			{/* Right Card: Geometric */}
			<div
				style={{
					...cardStyle,
					borderColor: COLORS.secondary,
					transform: `translateX(${interpolate(card2Move, [0, 1], [width / 2, 0])}px)`,
					opacity: card2Move,
				}}
			>
				<div style={{ color: COLORS.secondary, fontSize: 48, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' }}>
					Geometric Multiplicity
				</div>
				<div style={{ width: 120, height: 80, border: `8px solid ${COLORS.secondary}`, position: 'relative' }}>
					<div style={{ position: 'absolute', top: -10, left: -10, width: 20, height: 20, backgroundColor: COLORS.secondary }} />
				</div>
				<div style={{ color: COLORS.text, fontSize: 28, marginTop: 30 }}>Dimension of Eigenspace</div>
			</div>
		</AbsoluteFill>
	);
};

export const Scene06Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const items = [
		'Eigenpair (λ, v)',
		'Characteristic Equation',
		'Multiplicity (Alg vs Geo)',
		'Diagonalization',
	];

	const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
	const titleY = interpolate(frame, [0, 20], [50, 0]);

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, padding: 100 }}>
			<div
				style={{
					fontSize: 80,
					fontWeight: 'bold',
					color: COLORS.primary,
					marginBottom: 60,
					opacity: titleOpacity,
					transform: `translateY(${titleY}px)`,
					fontFamily: 'sans-serif',
				}}
			>
				Summary
			</div>

			<div style={{ display: 'flex', flexDirection: 'column', gap: 40 }}>
				{items.map((item, i) => {
					const itemSpring = spring({
						frame,
						fps,
						delay: 40 + i * 15,
						config: { damping: 12 },
					});

					return (
						<div
							key={item}
							style={{
								display: 'flex',
								alignItems: 'center',
								opacity: itemSpring,
								transform: `translateX(${interpolate(itemSpring, [0, 1], [-50, 0])}px)`,
							}}
						>
							<div
								style={{
									width: 40,
									height: 40,
									backgroundColor: COLORS.secondary,
									borderRadius: 8,
									marginRight: 30,
									display: 'flex',
									alignItems: 'center',
									justifyContent: 'center',
								}}
							>
								<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4">
									<path d="M20 6L9 17L4 12" />
								</svg>
							</div>
							<div style={{ fontSize: 44, color: COLORS.text, fontFamily: 'sans-serif' }}>
								{item}
							</div>
						</div>
					);
				})}
			</div>

			{/* Final Insight Glow */}
			<div
				style={{
					position: 'absolute',
					bottom: 100,
					left: 100,
					right: 100,
					padding: 40,
					borderRadius: 20,
					backgroundColor: 'rgba(88, 196, 221, 0.1)',
					border: `2px solid ${COLORS.primary}`,
					fontSize: 36,
					color: COLORS.primary,
					textAlign: 'center',
					opacity: interpolate(frame, [150, 180], [0, 1]),
					fontStyle: 'italic',
				}}
			>
				"Unlock the heart of Linear Algebra."
			</div>
		</AbsoluteFill>
	);
};