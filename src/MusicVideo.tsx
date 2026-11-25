import React from 'react';
import { AbsoluteFill, Audio, staticFile, useCurrentFrame } from 'remotion';
import { C, clamp01, easeIn, easeInOut, easeOut, F, lerp, prog, rand, sp } from './lib';
import { Background } from './components/Background';
import { Grain } from './components/primitives';
import MTL from '../music-timeline.json';

const FPS = MTL.fps;
const W = 1080;
const H = 1080;

// ─── helpers ────────────────────────────────────────────────────────────────

/** Animated waveform bars driven purely by frame + seed so they look musical */
const WaveformBars: React.FC<{ t: number; count?: number; opacity?: number; color?: string }> = ({
  t, count = 48, opacity = 1, color = C.coral,
}) => {
  const bars = Array.from({ length: count }, (_, i) => {
    const phase = i / count;
    const speed1 = 1.3 + rand(i * 7) * 1.4;
    const speed2 = 0.7 + rand(i * 13) * 0.9;
    const speed3 = 2.1 + rand(i * 31) * 1.1;
    const h = 0.08
      + 0.38 * Math.abs(Math.sin(t * speed1 + phase * Math.PI * 3.7))
      + 0.22 * Math.abs(Math.sin(t * speed2 + phase * Math.PI * 2.1 + 1.3))
      + 0.14 * Math.abs(Math.sin(t * speed3 + phase * Math.PI * 5.3 + 2.6));
    return Math.min(1, h);
  });
  const barW = W / count;
  const maxH = H * 0.55;
  return (
    <svg style={{ position: 'absolute', inset: 0, opacity }} width={W} height={H}>
      {bars.map((h, i) => {
        const bh = h * maxH;
        return (
          <rect
            key={i}
            x={i * barW + barW * 0.15}
            y={H / 2 - bh / 2}
            width={barW * 0.7}
            height={bh}
            rx={barW * 0.3}
            fill={color}
            opacity={0.3 + 0.7 * h}
          />
        );
      })}
    </svg>
  );
};

/** Orbiting rings */
const Rings: React.FC<{ t: number; count?: number; opacity?: number }> = ({
  t, count = 5, opacity = 1,
}) => (
  <svg style={{ position: 'absolute', inset: 0, opacity }} width={W} height={H}>
    {Array.from({ length: count }, (_, i) => {
      const r = 90 + i * 90 + Math.sin(t * (0.4 + i * 0.15)) * 18;
      const strokeOp = 0.08 + 0.22 * Math.abs(Math.sin(t * 0.6 + i));
      return (
        <circle
          key={i}
          cx={W / 2}
          cy={H / 2}
          r={r}
          fill="none"
          stroke={C.coral}
          strokeWidth={1.5 + i * 0.4}
          strokeOpacity={strokeOp}
        />
      );
    })}
  </svg>
);

/** Floating particles */
const Particles: React.FC<{ t: number; count?: number; opacity?: number }> = ({
  t, count = 60, opacity = 1,
}) => (
  <svg style={{ position: 'absolute', inset: 0, opacity }} width={W} height={H}>
    {Array.from({ length: count }, (_, i) => {
      const seed = i * 137.508;
      const baseX = (rand(seed) * W * 0.9) + W * 0.05;
      const baseY = (rand(seed + 1) * H * 0.9) + H * 0.05;
      const speed = 0.08 + rand(seed + 2) * 0.18;
      const amp = 20 + rand(seed + 3) * 50;
      const x = baseX + Math.sin(t * speed + rand(seed + 4) * 6.28) * amp;
      const y = baseY + Math.cos(t * speed * 0.7 + rand(seed + 5) * 6.28) * amp * 0.6;
      const r = 1.5 + rand(seed + 6) * 3.5;
      const a = 0.15 + 0.6 * Math.abs(Math.sin(t * speed * 1.3 + rand(seed + 7) * 6.28));
      return <circle key={i} cx={x} cy={y} r={r} fill={C.coral} opacity={a} />;
    })}
  </svg>
);

/** Big display text with slide-up mask reveal */
const BigText: React.FC<{
  children: React.ReactNode;
  k: number;
  out?: number;
  style?: React.CSSProperties;
}> = ({ children, k, out = 0, style }) => (
  <div style={{ overflow: 'hidden', display: 'inline-block', ...style }}>
    <div
      style={{
        transform: `translateY(${lerp(60, 0, k) - out * 60}px)`,
        opacity: k * (1 - out),
        willChange: 'transform',
      }}
    >
      {children}
    </div>
  </div>
);

// ─── scenes ──────────────────────────────────────────────────────────────────

const Intro: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const { intro } = MTL;
  const titleK = prog(t, intro.titleIn, intro.titleIn + 0.9, easeOut);
  const subK   = prog(t, intro.subtitleIn, intro.subtitleIn + 0.8, easeOut);
  const fadeOut = prog(t, intro.fadeOut, intro.fadeOut + 0.6, easeIn);
  if (t < intro.titleIn - 0.1 || t > intro.fadeOut + 0.8) return null;
  return (
    <AbsoluteFill style={{ opacity: 1 - fadeOut }}>
      <div
        style={{
          position: 'absolute', inset: 0, display: 'flex',
          flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          textAlign: 'center', gap: 24,
        }}
      >
        <BigText k={titleK} style={{ fontFamily: F.serif, fontSize: 108, lineHeight: 1, color: C.cream, letterSpacing: '-0.02em' }}>
          Music Video
        </BigText>
        <BigText k={subK} style={{ fontFamily: F.mono, fontSize: 18, letterSpacing: '0.22em', color: C.muted }}>
          4 MIN 40 SEC · 60 FPS
        </BigText>
      </div>
      <WaveformBars t={t} opacity={0.18} />
    </AbsoluteFill>
  );
};

const Scene1: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const { s1 } = MTL;
  const enter  = prog(t, s1.start, s1.start + 0.5, easeOut);
  const exit   = prog(t, s1.exit, s1.exit + 0.6, easeIn);
  if (t < s1.start - 0.1 || t > s1.exit + 0.8) return null;
  const words  = ['Feel', 'The', 'Beat.'];
  const colors = [C.cream, C.creamDim, C.coral];
  const starts = [s1.word1, s1.word2, s1.word3];
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <WaveformBars t={t} opacity={0.55} count={64} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        {words.map((w, i) => {
          const k = prog(t, starts[i], starts[i] + 0.75, easeOut);
          const out = prog(t, s1.exit + i * 0.04, s1.exit + 0.4 + i * 0.04, easeIn);
          return (
            <BigText key={i} k={k} out={out} style={{
              fontFamily: F.serif, fontSize: 148, lineHeight: 1.05, letterSpacing: '-0.02em',
              fontStyle: i === 2 ? 'italic' : undefined, color: colors[i],
            }}>
              {w}
            </BigText>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene2: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const { s2 } = MTL;
  const enter = prog(t, s2.start, s2.start + 0.6, easeOut);
  const exit  = prog(t, s2.exit, s2.exit + 0.6, easeIn);
  if (t < s2.start - 0.1 || t > s2.exit + 0.8) return null;
  const cols = 7; const rows = 7;
  const cellW = W / cols; const cellH = H / rows;
  const wordList = ['Rhythm', '&', 'Flow'];
  const wordStarts = [s2.grid1, s2.grid2, s2.grid3];
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <svg style={{ position: 'absolute', inset: 0 }} width={W} height={H}>
        {Array.from({ length: rows }, (_, row) =>
          Array.from({ length: cols }, (_, col) => {
            const seed = row * cols + col;
            const phase = (row + col) / (rows + cols);
            const speed = 1.0 + rand(seed * 17) * 1.2;
            const pulse = 0.3 + 0.65 * Math.abs(Math.sin(t * speed + phase * Math.PI * 2.5));
            const r = 6 + 22 * pulse;
            return (
              <circle key={`${row}-${col}`}
                cx={col * cellW + cellW / 2} cy={row * cellH + cellH / 2}
                r={r} fill={C.coral} opacity={0.08 + 0.55 * pulse} />
            );
          })
        )}
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {wordList.map((w, i) => {
          const k = prog(t, wordStarts[i], wordStarts[i] + 0.7, easeOut);
          const out = prog(t, s2.exit + i * 0.05, s2.exit + 0.4 + i * 0.05, easeIn);
          return (
            <BigText key={i} k={k} out={out} style={{
              fontFamily: F.serif, fontSize: i === 1 ? 80 : 112,
              fontStyle: i === 1 ? 'italic' : undefined,
              color: i === 1 ? C.coral : C.cream, marginRight: 18,
            }}>
              {w}
            </BigText>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

const Scene3: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const { s3 } = MTL;
  const enter = prog(t, s3.start, s3.start + 0.6, easeOut);
  const exit  = prog(t, s3.exit, s3.exit + 0.6, easeIn);
  if (t < s3.start - 0.1 || t > s3.exit + 0.8) return null;
  const ringsIn = prog(t, s3.rings, s3.rings + 1.0, easeOut);
  const text1K  = prog(t, s3.text1, s3.text1 + 0.9, easeOut);
  const text1Out = prog(t, s3.exit, s3.exit + 0.4, easeIn);
  const text2K   = prog(t, s3.text2, s3.text2 + 0.9, easeOut);
  const text2Out  = prog(t, s3.exit + 0.08, s3.exit + 0.48, easeIn);
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <Rings t={t} count={8} opacity={ringsIn} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
        <BigText k={text1K} out={text1Out} style={{ fontFamily: F.serif, fontSize: 96, color: C.cream, letterSpacing: '-0.02em' }}>
          In Motion
        </BigText>
        <BigText k={text2K} out={text2Out} style={{ fontFamily: F.serif, fontStyle: 'italic', fontSize: 72, color: C.coral }}>
          always becoming
        </BigText>
      </div>
    </AbsoluteFill>
  );
};

const Scene4: React.FC<{ t: number; frame: number }> = ({ t }) => {
  const { s4 } = MTL;
  const enter = prog(t, s4.start, s4.start + 0.6, easeOut);
  const exit  = prog(t, s4.exit, s4.exit + 0.6, easeIn);
  if (t < s4.start - 0.1 || t > s4.exit + 0.8) return null;
  const particlesIn = prog(t, s4.particles, s4.particles + 1.0, easeOut);
  const line1K   = prog(t, s4.line1, s4.line1 + 0.9, easeOut);
  const line1Out  = prog(t, s4.exit, s4.exit + 0.4, easeIn);
  const line2K    = prog(t, s4.line2, s4.line2 + 0.9, easeOut);
  const line2Out   = prog(t, s4.exit + 0.08, s4.exit + 0.48, easeIn);
  return (
    <AbsoluteFill style={{ opacity: enter * (1 - exit) }}>
      <Particles t={t} count={80} opacity={particlesIn} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <BigText k={line1K} out={line1Out} style={{ fontFamily: F.serif, fontSize: 108, color: C.cream, letterSpacing: '-0.025em' }}>
          Let It Go
        </BigText>
        <BigText k={line2K} out={line2Out} style={{ fontFamily: F.mono, fontSize: 20, letterSpacing: '0.2em', color: C.muted }}>
          AND LET THE MUSIC MOVE YOU
        </BigText>
      </div>
    </AbsoluteFill>
  );
};

const Outro: React.FC<{ t: number }> = ({ t }) => {
  const { outro } = MTL;
  const titleK  = prog(t, outro.titleIn, outro.titleIn + 1.2, easeOut);
  const fadeOut = prog(t, outro.fadeOut, outro.fadeOut + 1.0, easeIn);
  if (t < outro.start - 0.1) return null;
  return (
    <AbsoluteFill style={{ opacity: titleK * (1 - fadeOut) }}>
      <WaveformBars t={t} opacity={0.22} count={32} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20 }}>
        <BigText k={titleK} style={{ fontFamily: F.serif, fontSize: 88, color: C.cream, letterSpacing: '-0.02em' }}>
          Thank you.
        </BigText>
        <BigText k={prog(t, outro.titleIn + 0.4, outro.titleIn + 1.4, easeOut)}
          style={{ fontFamily: F.mono, fontSize: 16, letterSpacing: '0.2em', color: C.muted }}>
          4:40 · MADE WITH REMOTION
        </BigText>
      </div>
    </AbsoluteFill>
  );
};

// ─── root composition ─────────────────────────────────────────────────────────

export const MusicVideo: React.FC = () => {
  const frame = useCurrentFrame();
  const t = frame / FPS;
  const glow = 0.15 + 0.4 * Math.abs(Math.sin(t * 0.9));

  return (
    <AbsoluteFill style={{ background: C.bg, overflow: 'hidden' }}>
      <Audio src={staticFile('music.mp3')} />
      <Background t={t} glow={glow} />
      <Intro  t={t} frame={frame} />
      <Scene1 t={t} frame={frame} />
      <Scene2 t={t} frame={frame} />
      <Scene3 t={t} frame={frame} />
      <Scene4 t={t} frame={frame} />
      <Outro  t={t} />
      <div style={{
        position: 'absolute', bottom: 36, right: 54,
        fontFamily: F.mono, fontSize: 13, letterSpacing: '0.16em',
        color: 'rgba(240,238,230,0.18)',
      }}>
        {String(Math.floor(t / 60)).padStart(2, '0')}:{String(Math.floor(t % 60)).padStart(2, '0')}
      </div>
      <Grain frame={frame} />
    </AbsoluteFill>
  );
};
