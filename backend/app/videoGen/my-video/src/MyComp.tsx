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
  accent: '#FFFF00',
  background: '#1C1C1C',
  text: '#FFFFFF',
};

// --- Scene 01: Introduction ---
export const Scene01Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({
    frame,
    fps,
    config: { damping: 12 },
  });

  const subtitleOpacity = interpolate(frame, [30, 60], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const brandingSlide = spring({
    frame: frame - 50,
    fps,
    config: { stiffness: 100 },
  });

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: COLORS.text,
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      {/* Background Gradient Glow */}
      <div
        style={{
          position: 'absolute',
          width: '1000px',
          height: '1000px',
          background: `radial-gradient(circle, ${COLORS.primary}22 0%, transparent 70%)`,
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      />

      <div style={{ textAlign: 'center', zIndex: 1 }}>
        <h1
          style={{
            fontSize: '120px',
            margin: 0,
            color: COLORS.primary,
            transform: `scale(${titleSpring})`,
            fontWeight: 'bold',
            textTransform: 'uppercase',
            letterSpacing: '4px',
          }}
        >
          Gaussian Elimination
        </h1>
        <h2
          style={{
            fontSize: '60px',
            margin: '20px 0',
            opacity: subtitleOpacity,
            transform: `translateY(${interpolate(frame, [30, 60], [40, 0], {
              extrapolateLeft: 'clamp',
              extrapolateRight: 'clamp',
            })}px)`,
            fontWeight: '300',
            color: COLORS.text,
          }}
        >
          Solving Linear Systems
        </h2>
      </div>

      {/* Branding Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: '80px',
          right: '80px',
          opacity: interpolate(frame, [60, 80], [0, 1]),
          transform: `translateX(${interpolate(brandingSlide, [0, 1], [100, 0])}px)`,
        }}
      >
        <p style={{ fontSize: '28px', margin: 0, color: COLORS.primary }}>
          Abhishek Sarkar
        </p>
        <p style={{ fontSize: '20px', margin: 0, opacity: 0.7 }}>IIT Jodhpur</p>
      </div>
    </AbsoluteFill>
  );
};

// --- Scene 06: Conclusion & Geometric Insight ---
export const Scene06Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  const cardSpring = spring({
    frame,
    fps,
    config: { damping: 15 },
  });

  const solutionOpacity = interpolate(frame, [40, 70], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Abstract Geometric Planes Visualization
  const Plane: React.FC<{ color: string; rotation: number; delay: number }> = ({
    color,
    rotation,
    delay,
  }) => {
    const planeSpring = spring({
      frame: frame - delay,
      fps,
      config: { mass: 2 },
    });
    return (
      <div
        style={{
          position: 'absolute',
          width: '300px',
          height: '300px',
          backgroundColor: color,
          opacity: 0.3 * planeSpring,
          transform: `rotate(${rotation}deg) skew(20deg, 10deg)`,
          border: `2px solid ${color}`,
        }}
      />
    );
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: COLORS.background,
        color: COLORS.text,
        fontFamily: 'Helvetica, Arial, sans-serif',
      }}
    >
      {/* Geometric Graphic Container */}
      <div
        style={{
          position: 'absolute',
          left: '20%',
          top: '50%',
          transform: 'translateY(-50%) scale(1.2)',
          width: '400px',
          height: '400px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <Plane color={COLORS.primary} rotation={0} delay={60} />
        <Plane color={COLORS.secondary} rotation={60} delay={80} />
        <Plane color={COLORS.accent} rotation={120} delay={100} />
        <div
          style={{
            width: '15px',
            height: '15px',
            backgroundColor: COLORS.text,
            borderRadius: '50%',
            boxShadow: `0 0 20px ${COLORS.text}`,
            zIndex: 10,
            opacity: solutionOpacity,
          }}
        />
      </div>

      {/* Summary Card */}
      <div
        style={{
          position: 'absolute',
          right: '10%',
          top: '50%',
          transform: `translateY(-50%) scale(${cardSpring})`,
          width: '800px',
          padding: '60px',
          backgroundColor: '#252525',
          borderRadius: '30px',
          borderLeft: `10px solid ${COLORS.primary}`,
          boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
        }}
      >
        <h3 style={{ fontSize: '40px', color: COLORS.primary, margin: '0 0 20px 0' }}>
          Final Solution
        </h3>
        <div
          style={{
            fontSize: '80px',
            fontWeight: 'bold',
            color: COLORS.secondary,
            opacity: solutionOpacity,
            marginBottom: '40px',
          }}
        >
          (1/2, 1/2, 5/2)
        </div>
        <p style={{ fontSize: '24px', lineHeight: '1.6', opacity: 0.8 }}>
          Gaussian elimination transforms complex intersections into a clear
          mathematical path. It remains the backbone of modern linear solvers
          and LU decomposition.
        </p>
      </div>

      {/* End Fade */}
      <AbsoluteFill
        style={{
          backgroundColor: 'black',
          opacity: interpolate(frame, [420, 450], [0, 1]),
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};