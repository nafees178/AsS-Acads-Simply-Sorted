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
  primary: '#58C4DD', // Cool Blue
  secondary: '#FF6666', // Warm Red
  accent: '#FFFF00', // Yellow
  background: '#1C1C1C',
};

// --- Scene 01: The Energy Rulebook ---
export const Scene01Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleOpacity = interpolate(frame, [0, 20], [0, 1]);
  const splitProgress = spring({
    frame: frame - 40,
    fps,
    config: { damping: 12 },
  });

  const iconOpacity = (index: number) =>
    interpolate(frame, [80 + index * 20, 100 + index * 20], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });

  const bgGradient = interpolate(frame, [0, 120], [0, 100]);

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        background: `radial-gradient(circle, ${COLORS.background} 0%, rgba(88, 196, 221, ${
          bgGradient / 500
        }) 100%)`,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            fontSize: 120,
            fontWeight: 'bold',
            letterSpacing: 10,
            opacity: titleOpacity,
            transform: `scale(${interpolate(frame, [0, 40], [0.8, 1])})`,
            marginBottom: 40,
          }}
        >
          {frame < 50 ? (
            'THERMODYNAMICS'
          ) : (
            <div style={{ display: 'flex', gap: interpolate(splitProgress, [0, 1], [0, 300]) }}>
              <span style={{ color: COLORS.secondary }}>HEAT</span>
              <span style={{ color: COLORS.primary }}>POWER</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: 100, marginTop: 100 }}>
          {['☀️', '🚂', '🔋'].map((icon, i) => (
            <div
              key={i}
              style={{
                fontSize: 100,
                opacity: iconOpacity(i),
                transform: `translateY(${interpolate(iconOpacity(i), [0, 1], [50, 0])}px)`,
              }}
            >
              {icon}
            </div>
          ))}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 03: The Second Law (Entropy) ---
const Particle: React.FC<{ index: number; chaos: number }> = ({ index, chaos }) => {
  const xGrid = (index % 10) * 60 - 300;
  const yGrid = Math.floor(index / 10) * 60 - 300;

  const randomX = (random(`x-${index}`) - 0.5) * 1200;
  const randomY = (random(`y-${index}`) - 0.5) * 800;

  const x = interpolate(chaos, [0, 1], [xGrid, randomX]);
  const y = interpolate(chaos, [0, 1], [yGrid, randomY]);

  return (
    <div
      style={{
        position: 'absolute',
        width: 12,
        height: 12,
        borderRadius: '50%',
        backgroundColor: chaos > 0.5 ? COLORS.secondary : COLORS.primary,
        left: '50%',
        top: '50%',
        transform: `translate(${x}px, ${y}px)`,
        boxShadow: `0 0 10px ${chaos > 0.5 ? COLORS.secondary : COLORS.primary}`,
        transition: 'background-color 0.5s',
      }}
    />
  );
};

export const Scene03Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const chaos = interpolate(frame, [60, 360], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const entropyValue = interpolate(frame, [60, 360], [0, 100], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', top: 80, width: '100%', textAlign: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 60, fontFamily: 'sans-serif' }}>
          {chaos < 0.5 ? 'ORDER' : 'CHAOS'}
        </h1>
      </div>

      {[...Array(100)].map((_, i) => (
        <Particle key={i} index={i} chaos={chaos} />
      ))}

      {/* Entropy Meter */}
      <div
        style={{
          position: 'absolute',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          width: 800,
          height: 40,
          border: '2px solid white',
          borderRadius: 20,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${entropyValue}%`,
            height: '100%',
            backgroundColor: COLORS.secondary,
            transition: 'width 0.1s linear',
          }}
        />
        <div
          style={{
            position: 'absolute',
            width: '100%',
            textAlign: 'center',
            lineHeight: '40px',
            color: 'white',
            fontWeight: 'bold',
            fontFamily: 'sans-serif',
          }}
        >
          ENTROPY: {Math.round(entropyValue)}%
        </div>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 05: The Big Picture ---
export const Scene05Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const zoom = interpolate(frame, [0, 300], [4, 1], {
    extrapolateRight: 'clamp',
  });

  const card1Spring = spring({ frame: frame - 150, fps, config: { damping: 15 } });
  const card2Spring = spring({ frame: frame - 180, fps, config: { damping: 15 } });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, color: 'white', fontFamily: 'sans-serif' }}>
      {/* Background Starfield/Galaxy Zoom */}
      <AbsoluteFill
        style={{
          transform: `scale(${zoom})`,
          opacity: interpolate(frame, [0, 100], [0.3, 0.8]),
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            background: 'radial-gradient(circle, #333 0%, #000 70%)',
            display: 'flex',
            flexWrap: 'wrap',
          }}
        >
          {[...Array(200)].map((_, i) => (
            <div
              key={i}
              style={{
                position: 'absolute',
                left: `${random(`star-x-${i}`) * 100}%`,
                top: `${random(`star-y-${i}`) * 100}%`,
                width: 2,
                height: 2,
                backgroundColor: 'white',
                borderRadius: '50%',
              }}
            />
          ))}
        </div>
      </AbsoluteFill>

      {/* Summary Cards */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          gap: 50,
        }}
      >
        <div
          style={{
            width: 450,
            height: 250,
            backgroundColor: 'rgba(28, 28, 28, 0.9)',
            border: `2px solid ${COLORS.primary}`,
            borderRadius: 20,
            padding: 30,
            transform: `translateY(${interpolate(card1Spring, [0, 1], [400, 0])}px)`,
            opacity: card1Spring,
          }}
        >
          <div style={{ fontSize: 50, marginBottom: 20 }}>💎</div>
          <h2 style={{ color: COLORS.primary, margin: 0 }}>Law I</h2>
          <p style={{ fontSize: 28 }}>Energy is always conserved.</p>
        </div>

        <div
          style={{
            width: 450,
            height: 250,
            backgroundColor: 'rgba(28, 28, 28, 0.9)',
            border: `2px solid ${COLORS.secondary}`,
            borderRadius: 20,
            padding: 30,
            transform: `translateY(${interpolate(card2Spring, [0, 1], [400, 0])}px)`,
            opacity: card2Spring,
          }}
        >
          <div style={{ fontSize: 50, marginBottom: 20 }}>🌀</div>
          <h2 style={{ color: COLORS.secondary, margin: 0 }}>Law II</h2>
          <p style={{ fontSize: 28 }}>Entropy always increases.</p>
        </div>
      </div>

      <div
        style={{
          position: 'absolute',
          top: 100,
          width: '100%',
          textAlign: 'center',
          opacity: interpolate(frame, [300, 350], [0, 1]),
        }}
      >
        <h1 style={{ fontSize: 80, letterSpacing: 5 }}>THE FUNDAMENTAL FLOW</h1>
      </div>
    </AbsoluteFill>
  );
};