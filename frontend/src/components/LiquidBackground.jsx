/**
 * Ambient floating color blobs behind frosted glass panels — the core visual
 * signature of the "Liquid Glass" look. Purely decorative, fixed behind
 * everything, pointer-events disabled.
 */
export default function LiquidBackground({ variant = 'light' }) {
  const palettes = {
    light: ['#7A1F2B', '#C9A227', '#b8465a'],
    dark: ['#7A1F2B', '#C9A227', '#4a1620'],
  };
  const colors = palettes[variant] || palettes.light;

  return (
    <div className="liquid-bg">
      <div className="liquid-blob" style={{ top: '-10%', left: '-10%', width: '45vw', height: '45vw', background: colors[0], animationDelay: '0s' }} />
      <div className="liquid-blob" style={{ top: '30%', right: '-15%', width: '40vw', height: '40vw', background: colors[1], animationDelay: '4s' }} />
      <div className="liquid-blob" style={{ bottom: '-15%', left: '20%', width: '38vw', height: '38vw', background: colors[2], animationDelay: '8s' }} />
    </div>
  );
}
