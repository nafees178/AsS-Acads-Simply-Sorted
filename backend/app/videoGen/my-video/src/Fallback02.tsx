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

// --- Styled Components (Logic-based) ---

const MathText: React.FC<{ children: React.ReactNode; color?: string; size?: number }> = ({ 
  children, 
  color = 'white', 
  size = 80 
}) => (
  <div style={{
    fontFamily: 'serif',
    fontStyle: 'italic',
    fontSize: size,
    color,
    display: 'flex',
    alignItems: 'center',
    textShadow: `0 0 15px ${color}44`,
  }}>
    {children}
  </div>
);

const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div style={{
    background: 'rgba(255, 255, 255, 0.03)',
    backdropFilter: 'blur(12px)',
    borderRadius: '32px',
    border: '1px solid rgba(255, 255, 255, 0.1)',
    boxShadow: '0 20px 50px rgba(0, 0, 0, 0.3)',
    padding: '40px 60px',
    ...style,
  }}>
    {children}
  </div>
);

export const Scene02Comp: React.FC<{
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = ({ primaryColor, secondaryColor, accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();

  // Animations
  const titleSpring = spring({ frame, fps, config: { damping: 12 } });
  const equationEntry = spring({ frame: frame - 45, fps, config: { damping: 15 } });
  const transformProgress = spring({ frame: frame - 180, fps, config: { stiffness: 60 } });
  const highlightGlow = interpolate(Math.sin(frame / 10), [-1, 1], [0.4, 0.8]);

  return (
    <AbsoluteFill style={{ backgroundColor, overflow: 'hidden', perspective: '1200px' }}>
      {/* Cinematic Background Grid */}
      <AbsoluteFill style={{
        backgroundImage: `radial-gradient(circle at center, ${primaryColor}11 0%, transparent 70%), 
                          linear-gradient(${primaryColor}05 1px, transparent 1px), 
                          linear-gradient(90deg, ${primaryColor}05 1px, transparent 1px)`,
        backgroundSize: '100% 100%, 80px 80px, 80px 80px',
        opacity: 0.4,
        transform: `rotateX(60deg) translateY(-200px) scale(2)`,
      }} />

      {/* Scene Title */}
      <Sequence durationInFrames={90}>
        <div style={{
          position: 'absolute',
          top: 100,
          width: '100%',
          textAlign: 'center',
          opacity: titleSpring,
          transform: `translateY(${interpolate(titleSpring, [0, 1], [50, 0])}px)`,
        }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: 48, 
            letterSpacing: '0.2em', 
            fontWeight: 300,
            textShadow: '0 0 20px rgba(255,255,255,0.2)'
          }}>
            DEFINING THE EQUATION
          </h1>
        </div>
      </Sequence>

      {/* Main Equation Card */}
      <div style={{
        position: 'absolute',
        left: '50%',
        top: '45%',
        transform: `translate(-50%, -50%) scale(${equationEntry}) rotateY(${interpolate(equationEntry, [0, 1], [15, 0])}deg)`,
        opacity: equationEntry,
      }}>
        <GlassCard style={{ 
            display: 'flex', 
            flexDirection: 'column', 
            alignItems: 'center', 
            gap: '40px',
            width: 800,
            boxShadow: `0 0 60px ${primaryColor}${Math.floor(highlightGlow * 20).toString(16)}`
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '30px' }}>
            {/* dy/dx part */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MathText color={primaryColor}>dy</MathText>
              <div style={{ width: '100%', height: '4px', background: 'white', margin: '10px 0', borderRadius: 2 }} />
              <MathText color={primaryColor}>dx</MathText>
            </div>

            <MathText size={100}>=</MathText>

            {/* y part */}
            <MathText color={accentColor} size={120}>y</MathText>
          </div>

          {/* Subtitle / Label */}
          <div style={{ 
            color: 'white', 
            fontSize: 28, 
            opacity: 0.6, 
            fontWeight: 300, 
            fontFamily: 'sans-serif',
            borderTop: '1px solid rgba(255,255,255,0.1)',
            paddingTop: 20,
            width: '100%',
            textAlign: 'center'
          }}>
            A relationship between a value and its rate of change
          </div>
        </GlassCard>
      </div>

      {/* Functional Transformation Visualization (Bottom Half) */}
      <Sequence from={180}>
        <div style={{
          position: 'absolute',
          bottom: 150,
          width: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          gap: '100px',
          opacity: transformProgress,
          transform: `translateY(${interpolate(transformProgress, [0, 1], [100, 0])}px)`
        }}>
          {/* Function f(x) */}
          <GlassCard style={{ width: 350, textAlign: 'center', border: `1px solid ${secondaryColor}44` }}>
            <div style={{ color: secondaryColor, fontSize: 20, marginBottom: 10, fontWeight: 700 }}>THE FUNCTION</div>
            <MathText size={60} color="white">f(x) = e^x</MathText>
          </GlassCard>

          {/* Animated Arrow */}
          <div style={{ position: 'relative', width: 150, height: 4 }}>
            <div style={{ 
                width: '100%', 
                height: '100%', 
                background: `linear-gradient(90deg, ${secondaryColor}, ${primaryColor})`,
                boxShadow: `0 0 20px ${primaryColor}` 
            }} />
            <div style={{ 
                position: 'absolute', 
                right: -10, 
                top: -8, 
                borderLeft: '20px solid ' + primaryColor,
                borderTop: '10px solid transparent',
                borderBottom: '10px solid transparent'
            }} />
          </div>

          {/* Derivative f'(x) */}
          <GlassCard style={{ width: 350, textAlign: 'center', border: `1px solid ${primaryColor}44` }}>
            <div style={{ color: primaryColor, fontSize: 20, marginBottom: 10, fontWeight: 700 }}>THE DERIVATIVE</div>
            <MathText size={60} color="white">f'(x) = e^x</MathText>
          </GlassCard>
        </div>
      </Sequence>

      {/* Floating Insight Text */}
      <Sequence from={300}>
        <div style={{
          position: 'absolute',
          bottom: 50,
          width: '100%',
          textAlign: 'center',
          color: accentColor,
          fontSize: 32,
          fontWeight: 300,
          letterSpacing: '0.1em',
          opacity: spring({ frame: frame - 300, fps }),
          textShadow: `0 0 10px ${accentColor}66`
        }}>
          "Searching for the hidden rule..."
        </div>
      </Sequence>

      {/* Cinematic Vignette */}
      <AbsoluteFill style={{
        boxShadow: 'inset 0 0 300px rgba(0,0,0,0.8)',
        pointerEvents: 'none'
      }} />
    </AbsoluteFill>
  );
};