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

// --- Theme Constants ---
const COLORS = {
  gold: '#E3B04B',
  slate: '#5D6D7E',
  white: '#F4F6F7',
  bg: '#1C1C1C',
  glass: 'rgba(255, 255, 255, 0.05)',
};

// --- Sub-Components ---

const Particle: React.FC<{
  type: 'proton' | 'neutron';
  index: number;
  startPos: { x: number; y: number };
}> = ({ type, index, startPos }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Fusion timing: move to center between frame 30 and 90
  const moveProgress = spring({
    frame: frame - 30 - index * 5,
    fps,
    config: { damping: 12, stiffness: 60 },
  });

  // Final cluster positions (Helium nucleus / Alpha particle)
  const clusterOffsets = [
    { x: -30, y: -30 }, // Proton 1
    { x: 30, y: 30 },  // Proton 2
    { x: 30, y: -30 }, // Neutron 1
    { x: -30, y: 30 }, // Neutron 2
  ];

  const x = interpolate(moveProgress, [0, 1], [startPos.x, clusterOffsets[index].x]);
  const y = interpolate(moveProgress, [0, 1], [startPos.y, clusterOffsets[index].y]);
  const scale = spring({
    frame: frame - index * 3,
    fps,
    config: { mass: 0.5 },
  });

  const glowColor = type === 'proton' ? COLORS.gold : COLORS.slate;

  return (
    <div
      style={{
        position: 'absolute',
        width: 100,
        height: 100,
        borderRadius: '50%',
        background: `radial-gradient(circle at 30% 30%, ${glowColor}, #000)`,
        boxShadow: `0 0 40px ${glowColor}66, inset 0 0 20px rgba(255,255,255,0.3)`,
        left: '50%',
        top: '50%',
        transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'white',
        fontSize: 40,
        fontWeight: 'bold',
        border: '2px solid rgba(255,255,255,0.1)',
      }}
    >
      {type === 'proton' ? '+' : ''}
    </div>
  );
};

const DataCard: React.FC<{
  label: string;
  value: string;
  percentage: number;
  color: string;
  delay: number;
  xOffset: number;
}> = ({ label, value, percentage, color, delay, xOffset }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entry = spring({
    frame: frame - delay,
    fps,
    config: { damping: 15 },
  });

  const barHeight = interpolate(entry, [0, 1], [0, percentage * 4]);

  return (
    <div
      style={{
        position: 'absolute',
        left: '50%',
        bottom: '20%',
        transform: `translateX(-50%) translateX(${xOffset}px) perspective(1000px) rotateY(${interpolate(
          entry,
          [0, 1],
          [20, 0]
        )}deg)`,
        opacity: entry,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 20,
      }}
    >
      {/* 3D Glass Bar */}
      <div
        style={{
          width: 120,
          height: barHeight,
          background: `linear-gradient(to top, ${color}CC, ${color}33)`,
          borderRadius: '15px 15px 5px 5px',
          border: `1px solid ${color}`,
          boxShadow: `0 0 30px ${color}44`,
          backdropFilter: 'blur(5px)',
          position: 'relative',
        }}
      />
      
      {/* Glassmorphism Label Card */}
      <div
        style={{
          padding: '20px 40px',
          background: COLORS.glass,
          borderRadius: 20,
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(15px)',
          textAlign: 'center',
          boxShadow: '0 20px 40px rgba(0,0,0,0.4)',
        }}
      >
        <div style={{ color: COLORS.white, fontSize: 24, opacity: 0.7, marginBottom: 5 }}>
          {label}
        </div>
        <div style={{ color: color, fontSize: 48, fontWeight: 900 }}>
          {value}
        </div>
      </div>
    </div>
  );
};

export const Scene04Comp: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Formula animation
  const formulaOpacity = interpolate(frame, [100, 120, 200, 220], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const formulaScale = spring({
    frame: frame - 100,
    fps,
    config: { mass: 0.8 },
  });

  return (
    <AbsoluteFill style={{ backgroundColor: COLORS.bg, overflow: 'hidden', fontFamily: 'Inter, sans-serif' }}>
      {/* Background Subtle Grid */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '60px 60px',
          opacity: 0.5,
        }}
      />

      {/* Scene Title */}
      <Sequence durationInFrames={90}>
        <div
          style={{
            position: 'absolute',
            top: 100,
            width: '100%',
            textAlign: 'center',
            color: COLORS.white,
            fontSize: 60,
            fontWeight: 800,
            letterSpacing: '0.2em',
            textShadow: '0 0 20px rgba(255,255,255,0.3)',
            transform: `translateY(${interpolate(frame, [0, 30], [20, 0])}px)`,
            opacity: interpolate(frame, [0, 20, 70, 90], [0, 1, 1, 0]),
          }}
        >
          COSMIC NUCLEOSYNTHESIS
        </div>
      </Sequence>

      {/* Particle Fusion Visualization */}
      <Sequence from={20} durationInFrames={250}>
        <AbsoluteFill style={{ perspective: '1000px' }}>
          <Particle type="proton" index={0} startPos={{ x: -400, y: -200 }} />
          <Particle type="proton" index={1} startPos={{ x: 400, y: 200 }} />
          <Particle type="neutron" index={2} startPos={{ x: 400, y: -200 }} />
          <Particle type="neutron" index={3} startPos={{ x: -400, y: 200 }} />
        </AbsoluteFill>
      </Sequence>

      {/* Mathematical Formula Overlay */}
      <div
        style={{
          position: 'absolute',
          top: '40%',
          width: '100%',
          textAlign: 'center',
          opacity: formulaOpacity,
          transform: `scale(${formulaScale})`,
          color: COLORS.white,
          fontSize: 80,
          fontWeight: 300,
          textShadow: `0 0 30px ${COLORS.gold}AA`,
        }}
      >
        <span style={{ color: COLORS.gold }}>H</span> + <span style={{ color: COLORS.gold }}>H</span>
        <span style={{ margin: '0 40px', opacity: 0.5 }}>→</span>
        <span style={{ color: COLORS.slate, fontWeight: 700 }}>He</span>
      </div>

      {/* Bar Chart Section */}
      <Sequence from={240}>
        <AbsoluteFill>
          <DataCard
            label="HYDROGEN"
            value="75%"
            percentage={75}
            color={COLORS.gold}
            delay={0}
            xOffset={-250}
          />
          <DataCard
            label="HELIUM"
            value="25%"
            percentage={25}
            color={COLORS.slate}
            delay={15}
            xOffset={250}
          />
          
          {/* Chart Floor Reflection */}
          <div
            style={{
              position: 'absolute',
              bottom: '18%',
              left: '50%',
              transform: 'translateX(-50%) rotateX(80deg)',
              width: 1000,
              height: 400,
              background: 'radial-gradient(ellipse at center, rgba(255,255,255,0.1) 0%, transparent 70%)',
              zIndex: -1,
            }}
          />
        </AbsoluteFill>
      </Sequence>

      {/* Cinematic Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          boxShadow: 'inset 0 0 300px rgba(0,0,0,0.8)',
          pointerEvents: 'none',
        }}
      />
    </AbsoluteFill>
  );
};