// MyComp.tsx
import React from 'react';
import {
	AbsoluteFill,
	interpolate,
	spring,
	useCurrentFrame,
	useVideoConfig,
	random,
} from 'remotion';

const COLORS = {
	primary: '#58C4DD',
	secondary: '#83C167',
	accent: '#E8CC7D',
	background: '#1C1C1C',
};

// --- Helper Components ---

const BackgroundGrid: React.FC = () => {
	const frame = useCurrentFrame();
	const opacity = interpolate(frame, [0, 30], [0, 0.15], {
		extrapolateRight: 'clamp',
	});

	return (
		<AbsoluteFill
			style={{
				backgroundColor: COLORS.background,
				backgroundImage: `
          linear-gradient(to right, #444 1px, transparent 1px),
          linear-gradient(to bottom, #444 1px, transparent 1px)
        `,
				backgroundSize: '80px 80px',
				opacity,
			}}
		/>
	);
};

const GlowingParticle: React.FC<{ seed: string; color: string }> = ({ seed, color }) => {
	const frame = useCurrentFrame();
	const { width, height } = useVideoConfig();
	
	const initialX = random(seed + 'x') * width;
	const initialY = random(seed + 'y') * height;
	const driftX = Math.sin(frame / 60 + random(seed + 's') * 10) * 50;
	const driftY = Math.cos(frame / 60 + random(seed + 'c') * 10) * 50;
	
	const opacity = interpolate(frame, [0, 50, 310, 360], [0, 0.4, 0.4, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<div
			style={{
				position: 'absolute',
				left: initialX + driftX,
				top: initialY + driftY,
				width: 8,
				height: 8,
				backgroundColor: color,
				borderRadius: '50%',
				filter: `blur(4px) drop-shadow(0 0 10px ${color})`,
				opacity,
			}}
		/>
	);
};

// --- Scene 01: The Concept of Change ---

export const Scene01Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps } = useVideoConfig();

	const titleSpring = spring({ frame, fps, config: { damping: 12 } });
	const titleOpacity = interpolate(frame, [0, 20, 330, 360], [0, 1, 1, 0]);

	const listItems = ['Position', 'Velocity', 'Acceleration'];

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, overflow: 'hidden' }}>
			<BackgroundGrid />
			{Array.from({ length: 20 }).map((_, i) => (
				<GlowingParticle key={i} seed={`p1-${i}`} color={COLORS.primary} />
			))}

			<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: '1200px' }}>
				{/* Main Title */}
				<div
					style={{
						position: 'absolute',
						top: '15%',
						fontSize: '80px',
						fontWeight: 800,
						color: 'white',
						textAlign: 'center',
						opacity: titleOpacity,
						transform: `translateY(${(1 - titleSpring) * -50}px) scale(${0.9 + 0.1 * titleSpring})`,
						textShadow: `0 0 20px ${COLORS.primary}66`,
						fontFamily: 'Helvetica, Arial, sans-serif',
					}}
				>
					THE LANGUAGE <span style={{ color: COLORS.primary }}>OF CHANGE</span>
				</div>

				{/* Kinetic Typography List */}
				<div style={{ display: 'flex', flexDirection: 'column', gap: '40px', marginTop: '100px' }}>
					{listItems.map((text, i) => {
						const delay = 40 + i * 15;
						const itemSpring = spring({ frame: frame - delay, fps, config: { damping: 15, stiffness: 100 } });
						const itemOpacity = interpolate(frame - delay, [0, 20, 280, 310], [0, 1, 1, 0]);
						const rotateX = interpolate(itemSpring, [0, 1], [45, 0]);

						return (
							<div
								key={text}
								style={{
									width: '600px',
									padding: '30px 50px',
									background: 'rgba(255, 255, 255, 0.05)',
									backdropFilter: 'blur(12px)',
									border: `1px solid rgba(255, 255, 255, 0.1)`,
									borderRadius: '20px',
									boxShadow: `0 20px 40px rgba(0,0,0,0.4), inset 0 0 20px rgba(255,255,255,0.05)`,
									display: 'flex',
									alignItems: 'center',
									opacity: itemOpacity,
									transform: `rotateX(${rotateX}deg) scale(${0.8 + 0.2 * itemSpring}) translateZ(${itemSpring * 50}px)`,
								}}
							>
								<div
									style={{
										width: '12px',
										height: '40px',
										backgroundColor: i === 0 ? COLORS.primary : i === 1 ? COLORS.secondary : COLORS.accent,
										marginRight: '30px',
										borderRadius: '6px',
										boxShadow: `0 0 15px ${i === 0 ? COLORS.primary : i === 1 ? COLORS.secondary : COLORS.accent}`,
									}}
								/>
								<span
									style={{
										fontSize: '54px',
										fontWeight: 600,
										color: 'white',
										fontFamily: 'Helvetica, Arial, sans-serif',
										letterSpacing: '2px',
									}}
								>
									{text}
								</span>
							</div>
						);
					})}
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};

// --- Scene 05: Conclusion & Summary ---

export const Scene05Comp: React.FC = () => {
	const frame = useCurrentFrame();
	const { fps, width, height } = useVideoConfig();

	const cardSpring = spring({ frame, fps, config: { damping: 14 } });
	const cardRotateY = interpolate(frame, [0, 360], [-5, 5]);
	const cardRotateX = interpolate(Math.sin(frame / 50), [-1, 1], [-2, 2]);

	const summaryPoints = [
		{ title: 'Describe the Rate', color: COLORS.primary, icon: 'Δ' },
		{ title: 'Visualize the Flow', color: COLORS.secondary, icon: '≈' },
		{ title: 'Solve the System', color: COLORS.accent, icon: '∫' },
	];

	return (
		<AbsoluteFill style={{ backgroundColor: COLORS.background, overflow: 'hidden' }}>
			<BackgroundGrid />
			{Array.from({ length: 20 }).map((_, i) => (
				<GlowingParticle key={i} seed={`p5-${i}`} color={COLORS.secondary} />
			))}

			<AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', perspective: '1500px' }}>
				{/* Glassmorphism Summary Card */}
				<div
					style={{
						width: '1000px',
						height: '650px',
						background: 'linear-gradient(135deg, rgba(255,255,255,0.07) 0%, rgba(255,255,255,0.02) 100%)',
						backdropFilter: 'blur(25px)',
						borderRadius: '40px',
						border: '1px solid rgba(255,255,255,0.15)',
						boxShadow: '0 50px 100px rgba(0,0,0,0.5)',
						display: 'flex',
						flexDirection: 'column',
						padding: '60px',
						transform: `
              scale(${cardSpring}) 
              rotateY(${cardRotateY}deg) 
              rotateX(${cardRotateX}deg)
            `,
						opacity: interpolate(frame, [0, 20, 330, 360], [0, 1, 1, 0]),
					}}
				>
					<div
						style={{
							fontSize: '64px',
							fontWeight: 800,
							color: 'white',
							marginBottom: '60px',
							textAlign: 'center',
							fontFamily: 'Helvetica, Arial, sans-serif',
							borderBottom: '1px solid rgba(255,255,255,0.1)',
							paddingBottom: '30px',
						}}
					>
						SUMMARY
					</div>

					<div style={{ display: 'flex', flexDirection: 'column', gap: '50px' }}>
						{summaryPoints.map((point, i) => {
							const delay = 50 + i * 20;
							const pointSpring = spring({ frame: frame - delay, fps, config: { damping: 12 } });
							const pointX = interpolate(pointSpring, [0, 1], [100, 0]);

							return (
								<div
									key={point.title}
									style={{
										display: 'flex',
										alignItems: 'center',
										opacity: pointSpring,
										transform: `translateX(${pointX}px)`,
									}}
								>
									<div
										style={{
											width: '80px',
											height: '80px',
											borderRadius: '20px',
											backgroundColor: `${point.color}22`,
											border: `2px solid ${point.color}`,
											display: 'flex',
											justifyContent: 'center',
											alignItems: 'center',
											fontSize: '40px',
											fontWeight: 'bold',
											color: point.color,
											marginRight: '40px',
											boxShadow: `0 0 20px ${point.color}44`,
										}}
									>
										{point.icon}
									</div>
									<div
										style={{
											fontSize: '48px',
											fontWeight: 500,
											color: 'white',
											fontFamily: 'Helvetica, Arial, sans-serif',
										}}
									>
										{point.title}
									</div>
								</div>
							);
						})}
					</div>

					{/* Bottom Branding Accent */}
					<div
						style={{
							marginTop: 'auto',
							height: '4px',
							width: '100%',
							background: `linear-gradient(90deg, ${COLORS.primary}, ${COLORS.secondary}, ${COLORS.accent})`,
							borderRadius: '2px',
							opacity: 0.6,
						}}
					/>
				</div>
			</AbsoluteFill>
		</AbsoluteFill>
	);
};