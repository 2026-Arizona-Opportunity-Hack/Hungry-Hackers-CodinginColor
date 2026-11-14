/** One-shot celebration burst. Decorative: hidden from assistive tech and under reduced motion. */
const COLORS = ["#00a850", "#007a3d", "#005c2e", "#c8c8c8", "#e6f4ed", "#595959"];

const PIECES = Array.from({ length: 28 }, (_, i) => {
  // Deterministic spread so server and client render the same markup.
  const left = (i * 37) % 100;
  const dx = ((i * 53) % 120) - 60;
  return {
    left: `${left}%`,
    color: COLORS[i % COLORS.length],
    delay: `${(i % 7) * 60}ms`,
    dx: `${dx}px`,
    rot: `${((i * 97) % 540) - 270}deg`,
  };
});

export function Confetti() {
  return (
    <div className="confetti" aria-hidden>
      {PIECES.map((p, i) => (
        <i
          key={i}
          style={
            {
              left: p.left,
              background: p.color,
              animationDelay: p.delay,
              "--dx": p.dx,
              "--rot": p.rot,
            } as React.CSSProperties
          }
        />
      ))}
    </div>
  );
}
