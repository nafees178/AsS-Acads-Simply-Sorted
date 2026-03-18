import React from 'react';
import {
  AbsoluteFill,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
  Sequence,
} from 'remotion';

// --- Sub-components ---

const Pointer: React.FC<{
  label: string;
  color: string;
  index: number;
  totalItems: number;
  direction: 'up' | 'down';
  showFrame: number;
}> = ({ label, color, index, totalItems, direction, showFrame }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const boxWidth = 70;
  const gap = 12;
  const totalWidth = totalItems * boxWidth + (totalItems - 1) * gap;
  const startX = (width - totalWidth) / 2;
  const xPos = startX + index * (boxWidth + gap) + boxWidth / 2;

  const appearance = spring({
    frame: frame - showFrame,
    fps,
    config: { damping: 12, stiffness: 100 },
  });

  const yOffset = direction === 'up' ? 80 : -80;
  const arrowRotate = direction === 'up' ? '0deg' : '180deg';

  return (
    <div
      style={{
        position: 'absolute',
        left: xPos,
        top: '50%',
        transform: `translate(-50%, -50%) scale(${appearance})`,
        opacity: appearance,
        display: 'flex',
        flexDirection: direction === 'up' ? 'column-reverse' : 'column',
        alignItems: 'center',
        zIndex: 10,
      }}
    >
      {/* Arrow */}
      <div
        style={{
          width: 0,
          height: 0,
          borderLeft: '15px solid transparent',
          borderRight: '15px solid transparent',
          borderBottom: `25px solid ${color}`,
          transform: `rotate(${arrowRotate}) translateY(${direction === 'up' ? -10 : 10}px)`,
        }}
      />
      {/* Label */}
      <div
        style={{
          color,
          fontSize: 32,
          fontWeight: 'bold',
          fontFamily: 'Helvetica, Arial, sans-serif',
          marginTop: direction === 'up' ? 0 : 10,
          marginBottom: direction === 'up' ? 10 : 0,
          textShadow: '0 2px 4px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </div>
    </div>
  );
};

// --- Main Scene ---

export const Scene03Comp: React.FC<{
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
}> = ({ primaryColor, secondaryColor, accentColor, backgroundColor }) => {
  const frame = useCurrentFrame();
  const { fps, width } = useVideoConfig();

  const array = Array.from({ length: 20 }, (_, i) => i + 1);
  const lowIdx = 0;
  const highIdx = 19;
  const midIdx = 9; // Math.floor((0 + 19) / 2)

  // Animation Timings
  const START_ARRAY = 10;
  const START_LOW_HIGH = 45;
  const START_MID = 120;
  const START_COMPARE = 210;
  const START_DISCARD = 330;

  return (
    <AbsoluteFill style={{ backgroundColor, color: 'white' }}>
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 80,
          width: '100%',
          textAlign: 'center',
          fontSize: 48,
          fontFamily: 'Helvetica, Arial, sans-serif',
          fontWeight: 300,
          opacity: interpolate(frame, [0, 20], [0, 1]),
        }}
      >
        Step 1: <span style={{ color: accentColor }}>Find the Middle</span>
      </div>

      {/* Array Container */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100%',
          gap: 12,
        }}
      >
        {array.map((val, i) => {
          const isDiscarded = i > midIdx && frame > START_DISCARD;
          const discardOpacity = interpolate(
            frame,
            [START_DISCARD, START_DISCARD + 30],
            [1, 0.15],
            { extrapolateRight: 'clamp' }
          );

          const isMid = i === midIdx;
          const midHighlight = spring({
            frame: frame - START_COMPARE,
            fps,
            config: { stiffness: 100 },
          });

          return (
            <div
              key={i}
              style={{
                width: 70,
                height: 90,
                backgroundColor: isMid
                  ? interpolate(midHighlight, [0, 1], ['#333', accentColor])
                  : '#333',
                border: `2px solid ${isMid ? accentColor : '#555'}`,
                borderRadius: 8,
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                fontSize: 28,
                fontWeight: 'bold',
                fontFamily: 'Monospace',
                color: isMid && frame > START_COMPARE ? '#000' : 'white',
                opacity: isDiscarded ? discardOpacity : 1,
                transform: `scale(${interpolate(
                  frame,
                  [START_ARRAY + i * 2, START_ARRAY + i * 2 + 10],
                  [0, 1],
                  { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
                )})`,
              }}
            >
              {val}
            </div>
          );
        })}
      </div>

      {/* Pointers */}
      <Pointer
        label="Low"
        color={primaryColor}
        index={lowIdx}
        totalItems={array.length}
        direction="up"
        showFrame={START_LOW_HIGH}
      />
      <Pointer
        label="High"
        color={primaryColor}
        index={highIdx}
        totalItems={array.length}
        direction="up"
        showFrame={START_LOW_HIGH + 15}
      />
      <Pointer
        label="Mid"
        color={accentColor}
        index={midIdx}
        totalItems={array.length}
        direction="down"
        showFrame={START_MID}
      />

      {/* Logic Text Overlay */}
      {frame > START_COMPARE && (
        <div
          style={{
            position: 'absolute',
            bottom: 150,
            width: '100%',
            textAlign: 'center',
            fontFamily: 'Helvetica, Arial, sans-serif',
            fontSize: 34,
            lineHeight: 1.4,
            opacity: interpolate(frame, [START_COMPARE, START_COMPARE + 15], [0, 1]),
          }}
        >
          {frame < START_DISCARD ? (
            <div>
              Target <span style={{ color: accentColor }}>7</span> &lt; Middle{' '}
              <span style={{ color: accentColor }}>10</span>
            </div>
          ) : (
            <div style={{ color: '#FF6666' }}>
              Discarding everything to the right...
            </div>
          )}
        </div>
      )}
    </AbsoluteFill>
  );
};