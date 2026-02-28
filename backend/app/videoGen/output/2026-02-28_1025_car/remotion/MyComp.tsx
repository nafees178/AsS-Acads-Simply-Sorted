// MyComp.tsx
import React from 'react';
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
} from 'remotion';

// Color Palette
const COLORS = {
  PRIMARY: '#58C4DD', // Electric Blue
  SECONDARY: '#83C167', // Leaf Green
  ACCENT: '#FF6666', // Engine Red
  BACKGROUND: '#1C1C1C', // Dark Grey
  WHITE: '#FFFFFF',
};

// --- SCENE 01: THE ANATOMY OF MOTION ---
export const Scene01Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const carEntrance = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const textPulse = Math.sin(frame / 10) * 0.05 + 1;

  // Car silhouette path (simplified)
  const carPath = "M200,600 L300,600 C300,500 450,450 600,450 L1200,450 C1400,450 1600,500 1700,600 L1800,600 L1800,750 L1700,750 C1700,680 1550,680 1550,750 L450,750 C450,680 300,680 300,750 L200,750 Z";

  const drawProgress = interpolate(frame, [0, 60], [2000, 0], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ opacity: carEntrance }}>
        <path
          d={carPath}
          fill="none"
          stroke={COLORS.PRIMARY}
          strokeWidth="4"
          strokeDasharray="2000"
          strokeDashoffset={drawProgress}
        />
      </svg>

      <AbsoluteFill style={{ color: COLORS.WHITE, fontFamily: 'Helvetica, Arial, sans-serif' }}>
        <div style={{
          position: 'absolute',
          top: '20%',
          left: '10%',
          fontSize: 80,
          fontWeight: 'bold',
          opacity: interpolate(frame, [40, 60], [0, 1]),
          transform: `scale(${textPulse})`,
          color: COLORS.ACCENT
        }}>
          INTERNAL COMBUSTION
        </div>
        <div style={{
          position: 'absolute',
          bottom: '20%',
          right: '10%',
          fontSize: 80,
          fontWeight: 'bold',
          opacity: interpolate(frame, [80, 100], [0, 1]),
          transform: `scale(${textPulse})`,
          color: COLORS.SECONDARY
        }}>
          MECHANICAL ENERGY
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// --- SCENE 04: MANAGING THE POWER ---
const FlowNode: React.FC<{ label: string; x: number; y: number; delay: number }> = ({ label, x, y, delay }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const opacity = spring({ frame: frame - delay, fps, config: { damping: 20 } });

  return (
    <div style={{
      position: 'absolute',
      left: x,
      top: y,
      width: 250,
      height: 120,
      backgroundColor: 'rgba(255,255,255,0.05)',
      border: `2px solid ${COLORS.PRIMARY}`,
      borderRadius: 15,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      color: COLORS.WHITE,
      fontSize: 28,
      fontWeight: 'bold',
      opacity,
      transform: `scale(${opacity})`,
      boxShadow: `0 0 20px ${COLORS.PRIMARY}44`
    }}>
      {label}
    </div>
  );
};

export const Scene04Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const flowProgress = (frame % 60) / 60;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND }}>
      <FlowNode label="ENGINE" x={200} y={480} delay={0} />
      <FlowNode label="TRANSMISSION" x={600} y={480} delay={15} />
      <FlowNode label="DRIVESHAFT" x={1000} y={480} delay={30} />
      <FlowNode label="DIFFERENTIAL" x={1400} y={480} delay={45} />

      {/* Connection Lines with Flowing Light */}
      <svg width="1920" height="1080" style={{ position: 'absolute' }}>
        <defs>
          <linearGradient id="flowGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="transparent" />
            <stop offset={flowProgress * 100 + '%'} stopColor={COLORS.SECONDARY} />
            <stop offset="100%" stopColor="transparent" />
          </linearGradient>
        </defs>
        <line x1="450" y1="540" x2="600" y2="540" stroke={COLORS.WHITE} strokeWidth="2" opacity="0.2" />
        <line x1="850" y1="540" x2="1000" y2="540" stroke={COLORS.WHITE} strokeWidth="2" opacity="0.2" />
        <line x1="1250" y1="540" x2="1400" y2="540" stroke={COLORS.WHITE} strokeWidth="2" opacity="0.2" />
        
        {/* Flowing Highlight */}
        <path d="M450,540 L1400,540" fill="none" stroke="url(#flowGrad)" strokeWidth="6" strokeDasharray="50, 150" strokeDashoffset={-frame * 5} />
      </svg>

      <div style={{
        position: 'absolute',
        bottom: 100,
        width: '100%',
        textAlign: 'center',
        color: COLORS.PRIMARY,
        fontSize: 40,
        fontWeight: '300',
        opacity: interpolate(frame, [60, 90], [0, 1])
      }}>
        MANAGING THE FLOW OF TORQUE
      </div>
    </AbsoluteFill>
  );
};

// --- SCENE 06: ENGINEERING HARMONY ---
const GridItem: React.FC<{ icon: string; label: string; index: number }> = ({ icon, label, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const delay = index * 5;
  const anim = spring({ frame: frame - 30 - delay, fps, config: { damping: 15 } });

  return (
    <div style={{
      width: 300,
      height: 250,
      margin: 20,
      backgroundColor: '#252525',
      borderRadius: 20,
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      opacity: anim,
      transform: `translateY(${interpolate(anim, [0, 1], [50, 0])}px)`,
      border: `1px solid ${COLORS.PRIMARY}33`
    }}>
      <div style={{ fontSize: 60, marginBottom: 10 }}>{icon}</div>
      <div style={{ color: COLORS.WHITE, fontSize: 24, fontWeight: 'bold' }}>{label}</div>
    </div>
  );
};

export const Scene06Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const finalTitleOpacity = interpolate(frame, [150, 180], [0, 1], { extrapolateLeft: 'clamp' });
  const finalTitleScale = spring({ frame: frame - 150, fps, config: { damping: 12 } });

  const items = [
    { icon: '⚡', label: 'SPARK' },
    { icon: '⚙️', label: 'PISTON' },
    { icon: '🔗', label: 'GEAR' },
    { icon: '🌀', label: 'ROTATION' },
    { icon: '⛽', label: 'FUEL' },
    { icon: '🏎️', label: 'MOTION' },
  ];

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BACKGROUND, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        opacity: interpolate(frame, [0, 150, 180], [1, 1, 0])
      }}>
        {items.map((item, i) => (
          <GridItem key={i} index={i} icon={item.icon} label={item.label} />
        ))}
      </div>

      <AbsoluteFill style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        pointerEvents: 'none'
      }}>
        <div style={{
          fontSize: 100,
          fontWeight: 'bold',
          color: COLORS.PRIMARY,
          opacity: finalTitleOpacity,
          transform: `scale(${finalTitleScale})`,
          textAlign: 'center',
          textShadow: `0 0 30px ${COLORS.PRIMARY}66`
        }}>
          MASTERPIECE OF<br />ENGINEERING
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  );
};