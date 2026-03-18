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

// Color Palette
const COLORS = {
  PRIMARY: '#58C4DD', // Quantum Blue
  SECONDARY: '#83C167', // Probability Green
  ACCENT: '#FFFF00', // Observation Yellow
  BG: '#1C1C1C', // Deep Charcoal
};

// --- SCENE 01: THE QUANTUM MYSTERY ---
export const Scene01Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Pulsing blur effect
  const blurRadius = interpolate(
    Math.sin(frame / 15),
    [-1, 1],
    [20, 60]
  );
  const pulseOpacity = interpolate(
    Math.sin(frame / 15),
    [-1, 1],
    [0.4, 0.8]
  );

  // Kinetic Typography Logic
  const words = ["WHERE", "IS", "IT?"];
  const flickerIndices = Array.from({ length: 15 }).map((_, i) => ({
    x: random(`x-${i}`) * width,
    y: random(`y-${i}`) * height,
    word: words[Math.floor(random(`w-${i}`) * words.length)],
    visible: random(`v-${i}-${Math.floor(frame / 3)}`) > 0.8, // Flickers every 3 frames
  }));

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BG, overflow: 'hidden' }}>
      {/* Grid Background */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        backgroundImage: `linear-gradient(${COLORS.PRIMARY}22 1px, transparent 1px), linear-gradient(90deg, ${COLORS.PRIMARY}22 1px, transparent 1px)`,
        backgroundSize: '100px 100px',
      }} />

      {/* Pulsing Quantum Blur */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: 'translate(-50%, -50%)',
        width: 400,
        height: 400,
        borderRadius: '50%',
        backgroundColor: COLORS.PRIMARY,
        filter: `blur(${blurRadius}px)`,
        opacity: pulseOpacity,
      }} />

      {/* Kinetic Typography */}
      {flickerIndices.map((item, i) => item.visible && (
        <div key={i} style={{
          position: 'absolute',
          left: item.x,
          top: item.y,
          color: COLORS.PRIMARY,
          fontSize: 60,
          fontWeight: 'bold',
          fontFamily: 'Helvetica, Arial, sans-serif',
          opacity: 0.6,
        }}>
          {item.word}
        </div>
      ))}
    </AbsoluteFill>
  );
};

// --- SCENE 04: THE ACT OF MEASUREMENT ---
export const Scene04Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Eye Scale Spring
  const eyeScale = spring({
    frame: frame - 30,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  // Flash effect
  const flashOpacity = interpolate(
    frame,
    [145, 150, 165],
    [0, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  // Shutter effect (bars closing)
  const shutterProgress = interpolate(
    frame,
    [140, 150, 160],
    [0, 100, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.BG }}>
      {/* Background "Cloud" (fading out) */}
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        opacity: interpolate(frame, [140, 155], [1, 0]),
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: 600,
          height: 600,
          background: `radial-gradient(circle, ${COLORS.PRIMARY} 0%, transparent 70%)`,
          filter: 'blur(40px)',
        }} />
      </div>

      {/* Observation Icon (Eye) */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) scale(${eyeScale})`,
        opacity: interpolate(frame, [0, 30], [0, 1]),
      }}>
        <svg width="300" height="300" viewBox="0 0 100 100" fill="none">
          <path d="M10 50C10 50 25 20 50 20C75 20 90 50 90 50C90 50 75 80 50 80C25 80 10 50 10 50Z" stroke={COLORS.ACCENT} strokeWidth="4" />
          <circle cx="50" cy="50" r="15" stroke={COLORS.ACCENT} strokeWidth="4" />
          <circle cx="50" cy="50" r="6" fill={COLORS.ACCENT} />
        </svg>
      </div>

      {/* Shutter Overlay */}
      <AbsoluteFill style={{ pointerEvents: 'none' }}>
        <div style={{ height: `${shutterProgress / 2}%`, width: '100%', backgroundColor: 'black', position: 'absolute', top: 0 }} />
        <div style={{ height: `${shutterProgress / 2}%`, width: '100%', backgroundColor: 'black', position: 'absolute', bottom: 0 }} />
      </AbsoluteFill>

      {/* White Flash */}
      <AbsoluteFill style={{ backgroundColor: 'white', opacity: flashOpacity, pointerEvents: 'none' }} />
    </AbsoluteFill>
  );
};

// --- SCENE 06: THE QUANTUM BRIDGE ---
export const Scene06Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 15, fps });
  
  const listItems = [
    "From Wave to Particle",
    "Measurement Creates Reality",
    "The Quantum-Classical Bridge"
  ];

  const bgGradient = interpolate(
    frame,
    [0, 60],
    [0.4, 0],
    { extrapolateRight: 'clamp' }
  );

  return (
    <AbsoluteFill style={{ 
      backgroundColor: COLORS.BG,
      background: `linear-gradient(180deg, ${COLORS.BG} 0%, ${COLORS.PRIMARY}${Math.floor(bgGradient * 255).toString(16).padStart(2, '0')} 100%)`
    }}>
      <div style={{ padding: '100px', fontFamily: 'Helvetica, Arial, sans-serif' }}>
        {/* Title */}
        <h1 style={{
          color: COLORS.PRIMARY,
          fontSize: '110px',
          margin: 0,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)`,
          opacity: titleSpring,
        }}>
          The Quantum Bridge
        </h1>

        <div style={{ height: '4px', width: interpolate(frame, [20, 50], [0, 800]), backgroundColor: COLORS.SECONDARY, marginTop: '20px' }} />

        {/* Summary Points */}
        <div style={{ marginTop: '80px' }}>
          {listItems.map((text, i) => {
            const itemSpring = spring({ frame: frame - (45 + i * 15), fps });
            return (
              <div key={i} style={{
                color: 'white',
                fontSize: '50px',
                marginBottom: '40px',
                display: 'flex',
                alignItems: 'center',
                opacity: itemSpring,
                transform: `translateX(${interpolate(itemSpring, [0, 1], [-50, 0])}px)`,
              }}>
                <div style={{ 
                  width: '20px', 
                  height: '20px', 
                  borderRadius: '50%', 
                  backgroundColor: COLORS.ACCENT, 
                  marginRight: '30px' 
                }} />
                {text}
              </div>
            );
          })}
        </div>
      </div>

      {/* Subtle Bottom Glow */}
      <div style={{
        position: 'absolute',
        bottom: -200,
        left: '50%',
        transform: 'translateX(-50%)',
        width: '120%',
        height: '400px',
        background: `radial-gradient(ellipse at center, ${COLORS.PRIMARY}33 0%, transparent 70%)`,
        filter: 'blur(50px)'
      }} />
    </AbsoluteFill>
  );
};

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
  background: '#1C1C1C',
  wave: '#58C4DD',
  result: '#83C167',
  accent: '#FFFF00',
  text: '#FFFFFF',
};

export const Scene05Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { width, height, fps } = useVideoConfig();

  // Animation Timing
  const startCollapseFrame = 90; // 3 seconds in
  const collapseDuration = 15;   // 0.5 seconds for the "snap"
  
  // Spring for the "crunch" effect
  const collapseSpring = spring({
    frame: frame - startCollapseFrame,
    fps,
    config: {
      damping: 12,
      stiffness: 100,
    },
  });

  // Interpolate Wave Parameters
  // Sigma (spread) goes from 150 to 2 (narrow spike)
  const sigma = interpolate(collapseSpring, [0, 1], [150, 2]);
  // Amplitude spikes as it narrows
  const amplitude = interpolate(collapseSpring, [0, 1], [200, 600]);
  // Color shifts from Blue to Green upon collapse
  const waveColor = interpolate(
    collapseSpring,
    [0, 1],
    [0, 1]
  );
  const currentColor = waveColor > 0.5 ? COLORS.result : COLORS.wave;

  // Generate SVG Path for Gaussian Curve: y = A * exp(-(x-x0)^2 / 2s^2)
  const generateWavePath = () => {
    const points = [];
    const centerX = width / 2;
    const centerY = height * 0.7; // Baseline
    const resolution = 2; // Pixels per step

    for (let x = 0; x <= width; x += resolution) {
      const exponent = -Math.pow(x - centerX, 2) / (2 * Math.pow(sigma, 2));
      const y = centerY - amplitude * Math.exp(exponent);
      points.push(`${x},${y}`);
    }

    return `M 0,${centerY} L ${points.join(' L ')} L ${width},${centerY}`;
  };

  // Text Opacity Animations
  const titleOpacity = interpolate(frame, [0, 20, 430, 450], [0, 1, 1, 0]);
  const subtitleOpacity = interpolate(frame, [100, 120, 430, 450], [0, 1, 1, 0]);

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.background, color: COLORS.text, fontFamily: 'sans-serif' }}>
      {/* Coordinate System */}
      <svg width={width} height={height} style={{ position: 'absolute' }}>
        {/* X-Axis */}
        <line 
          x1="200" y1={height * 0.7} 
          x2={width - 200} y2={height * 0.7} 
          stroke="white" strokeWidth="2" strokeOpacity="0.3" 
        />
        {/* Y-Axis */}
        <line 
          x1={width / 2} y1={height * 0.2} 
          x2={width / 2} y2={height * 0.8} 
          stroke="white" strokeWidth="2" strokeOpacity="0.1" 
        />
        
        {/* The Wave Function Path */}
        <path
          d={generateWavePath()}
          fill="none"
          stroke={currentColor}
          strokeWidth="6"
          style={{
            filter: `drop-shadow(0 0 15px ${currentColor}66)`,
          }}
        />

        {/* Area under curve (Probability Density) */}
        <path
          d={`${generateWavePath()} Z`}
          fill={currentColor}
          fillOpacity="0.1"
        />

        {/* Particle "Detection" Flash */}
        {frame >= startCollapseFrame && frame <= startCollapseFrame + 10 && (
          <circle
            cx={width / 2}
            cy={height * 0.7 - amplitude}
            r={interpolate(frame - startCollapseFrame, [0, 10], [0, 100])}
            fill={COLORS.accent}
            fillOpacity={interpolate(frame - startCollapseFrame, [0, 10], [0.8, 0])}
          />
        )}
      </svg>

      {/* Labels and Text */}
      <div style={{ 
        position: 'absolute', 
        top: 100, 
        width: '100%', 
        textAlign: 'center',
        opacity: titleOpacity 
      }}>
        <h1 style={{ fontSize: 60, margin: 0, color: COLORS.wave }}>Ψ(x)</h1>
        <p style={{ fontSize: 30, opacity: 0.6 }}>Probability Amplitude</p>
      </div>

      <div style={{ 
        position: 'absolute', 
        bottom: 150, 
        width: '100%', 
        padding: '0 100px',
        textAlign: 'center',
        opacity: subtitleOpacity,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}>
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: '20px 40px', 
          borderRadius: '15px',
          border: `1px solid ${COLORS.result}44`
        }}>
          <p style={{ fontSize: 32, lineHeight: 1.4, margin: 0 }}>
            "The wide spread of possibilities instantly vanishes,<br/>
            and the particle <span style={{ color: COLORS.result, fontWeight: 'bold' }}>'picks'</span> a single, definite location."
          </p>
        </div>
      </div>

      {/* X-Axis Label */}
      <div style={{ 
        position: 'absolute', 
        bottom: height * 0.25, 
        right: 250, 
        fontSize: 24, 
        opacity: 0.5 
      }}>
        Position (x)
      </div>
    </AbsoluteFill>
  );
};