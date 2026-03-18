// MyComp.tsx
import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion';

const COLORS = {
  primary: '#58C4DD',
  secondary: '#83C167',
  accent: '#FFFF00',
  warning: '#FF6666',
  background: '#1C1C1C',
  gridLine: 'rgba(255, 255, 255, 0.1)',
};

// --- Shared Components ---

const Grid: React.FC<{ opacity: number }> = ({ opacity }) => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        opacity,
        backgroundImage: `linear-gradient(${COLORS.gridLine} 1px, transparent 1px), linear-gradient(90deg, ${COLORS.gridLine} 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }}
    />
  );
};

const Marker: React.FC<{
  label: string;
  color: string;
  x: number;
  y: number;
  scale: number;
}> = ({ label, color, x, y, scale }) => (
  <div
    style={{
      position: 'absolute',
      left: x,
      top: y,
      transform: `translate(-50%, -50%) scale(${scale})`,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
    }}
  >
    <div
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        backgroundColor: color,
        boxShadow: `0 0 20px ${color}`,
      }}
    />
    <span
      style={{
        color: 'white',
        marginTop: 10,
        fontFamily: 'sans-serif',
        fontWeight: 'bold',
        fontSize: 24,
      }}
    >
      {label}
    </span>
  </div>
);

// --- Scene 01: The Pathfinding Problem ---

export const Scene01Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animations
  const aToBScale = spring({ frame, fps, config: { damping: 12 } });
  const aToBOpacity = interpolate(frame, [40, 60], [1, 0], { extrapolateRight: 'clamp' });
  
  const gridOpacity = interpolate(frame, [50, 80], [0, 1], { extrapolateLeft: 'clamp' });
  
  const startEndScale = spring({
    frame: frame - 80,
    fps,
    config: { damping: 12 },
  });

  const textMorphOpacity = interpolate(frame, [120, 140, 180, 200], [0, 1, 1, 0]);
  const pathDrawProgress = spring({
    frame: frame - 180,
    fps,
    durationInFrames: 60,
    config: { stiffness: 40 },
  });

  // Path coordinates
  const startX = width * 0.25;
  const startY = height * 0.5;
  const endX = width * 0.75;
  const endY = height * 0.5;

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background }}>
      <Grid opacity={gridOpacity} />

      {/* Kinetic Typography Intro */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          opacity: aToBOpacity,
          transform: `scale(${aToBScale})`,
        }}
      >
        <h1 style={{ color: 'white', fontSize: 120, fontFamily: 'sans-serif' }}>
          <span style={{ color: COLORS.primary }}>A</span> to{' '}
          <span style={{ color: COLORS.secondary }}>B</span>
        </h1>
      </div>

      {/* Grid Markers */}
      {frame > 80 && (
        <>
          <Marker label="START" color={COLORS.primary} x={startX} y={startY} scale={startEndScale} />
          <Marker label="END" color={COLORS.secondary} x={endX} y={endY} scale={startEndScale} />
        </>
      )}

      {/* Morphing Text */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          width: '100%',
          textAlign: 'center',
          color: COLORS.accent,
          fontSize: 60,
          fontFamily: 'sans-serif',
          fontWeight: 'bold',
          opacity: textMorphOpacity,
        }}
      >
        Shortest Path
      </div>

      {/* Glowing Path */}
      <svg
        style={{
          position: 'absolute',
          width: '100%',
          height: '100%',
          filter: 'drop-shadow(0 0 10px #58C4DD)',
        }}
      >
        <line
          x1={startX}
          y1={startY}
          x2={interpolate(pathDrawProgress, [0, 1], [startX, endX])}
          y2={startY}
          stroke={COLORS.primary}
          strokeWidth="8"
          strokeLinecap="round"
        />
      </svg>
    </AbsoluteFill>
  );
};

// --- Scene 06: Conclusion ---

export const Scene06Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const introOpacity = interpolate(frame, [0, 30], [0, 1]);
  
  const card1X = spring({
    frame: frame - 40,
    fps,
    config: { damping: 15 },
  });
  const card2X = spring({
    frame: frame - 55,
    fps,
    config: { damping: 15 },
  });

  const checkScale = spring({
    frame: frame - 120,
    fps,
    config: { stiffness: 100, damping: 10 },
  });

  const checkPathLength = interpolate(frame, [120, 150], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, opacity: introOpacity }}>
      <Grid opacity={0.4} />

      {/* Solved Path Background */}
      <svg style={{ position: 'absolute', width: '100%', height: '100%', opacity: 0.3 }}>
        <path
          d={`M ${width * 0.2} ${height * 0.7} L ${width * 0.8} ${height * 0.7}`}
          stroke={COLORS.secondary}
          strokeWidth="12"
          strokeDasharray="20 10"
        />
      </svg>

      {/* Summary Cards */}
      <div
        style={{
          display: 'flex',
          gap: 40,
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          padding: 100,
        }}
      >
        {/* Dijkstra Card */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#2A2A2A',
            borderRadius: 20,
            padding: 40,
            border: `2px solid ${COLORS.primary}`,
            transform: `translateY(${(1 - card1X) * 100}px)`,
            opacity: card1X,
          }}
        >
          <h2 style={{ color: COLORS.primary, fontSize: 48, fontFamily: 'sans-serif' }}>Dijkstra</h2>
          <p style={{ color: 'white', fontSize: 32, fontFamily: 'sans-serif' }}>Uninformed Search</p>
          <div style={{ marginTop: 20, color: '#AAA', fontSize: 24 }}>Explores in all directions equally.</div>
        </div>

        {/* A* Card */}
        <div
          style={{
            flex: 1,
            backgroundColor: '#2A2A2A',
            borderRadius: 20,
            padding: 40,
            border: `2px solid ${COLORS.accent}`,
            transform: `translateY(${(1 - card2X) * 100}px)`,
            opacity: card2X,
          }}
        >
          <h2 style={{ color: COLORS.accent, fontSize: 48, fontFamily: 'sans-serif' }}>A* Search</h2>
          <p style={{ color: 'white', fontSize: 32, fontFamily: 'sans-serif' }}>Informed Search</p>
          <div style={{ marginTop: 20, color: '#AAA', fontSize: 24 }}>Uses heuristics to steer toward goal.</div>
        </div>
      </div>

      {/* Final Checkmark Overlay */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: 20,
          transform: `scale(${checkScale})`,
        }}
      >
        <svg width="100" height="100" viewBox="0 0 100 100">
          <path
            d="M 20 50 L 45 75 L 85 30"
            fill="none"
            stroke={COLORS.secondary}
            strokeWidth="12"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray="100"
            strokeDashoffset={100 - checkPathLength}
          />
        </svg>
        <span style={{ color: 'white', fontSize: 60, fontFamily: 'sans-serif', fontWeight: 'bold' }}>
          Path Found
        </span>
      </div>
    </AbsoluteFill>
  );
};