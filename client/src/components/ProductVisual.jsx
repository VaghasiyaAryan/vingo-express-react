/**
 * Generates a distinctive illustration per product so the catalogue looks
 * designed without stock photography. Everything is derived deterministically
 * from the product slug, so a product's visual is stable for ever — the same
 * product always draws the same illustration.
 *
 * If a product has `image` set, that real photo is used instead. It is served
 * as-is: there is no image optimisation layer in front of this app, so upload
 * photos already sized for the web (roughly 1200px wide is plenty).
 */

function seedFrom(str) {
  let h = 1779033703 ^ str.length;
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}

/** Small deterministic PRNG (mulberry32). */
function rng(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const r2 = (n) => Math.round(n * 100) / 100;

function shapes(form, next, colors) {
  const out = [];
  const palette = [colors.accent, colors.deep, colors.accent, colors.base];
  const pick = () => palette[Math.floor(next() * palette.length)];

  if (form === "powder") {
    // A soft mound plus fine scattered particles.
    out.push({ kind: "mound", fill: colors.accent });
    for (let i = 0; i < 46; i++) {
      out.push({
        kind: "dot",
        cx: r2(28 + next() * 144),
        cy: r2(52 + next() * 74),
        r: r2(0.8 + next() * 1.9),
        fill: pick(),
        opacity: r2(0.35 + next() * 0.5),
      });
    }
    return out;
  }

  const count = form === "granules" ? 26 : form === "blend" ? 18 : 13;

  for (let i = 0; i < count; i++) {
    const cx = r2(34 + next() * 132);
    const cy = r2(46 + next() * 74);
    const rot = r2(next() * 360);
    const fill = pick();
    const opacity = r2(0.72 + next() * 0.28);

    if (form === "slices") {
      out.push({ kind: "slice", cx, cy, r: r2(11 + next() * 8), rot, fill, opacity });
    } else if (form === "dices") {
      out.push({ kind: "dice", cx, cy, s: r2(11 + next() * 7), rot, fill, opacity });
    } else if (form === "granules") {
      out.push({ kind: "dot", cx, cy, r: r2(2.6 + next() * 2.8), fill, opacity });
    } else if (form === "blend") {
      const roll = next();
      if (roll < 0.34) out.push({ kind: "slice", cx, cy, r: r2(8 + next() * 6), rot, fill, opacity });
      else if (roll < 0.67) out.push({ kind: "dice", cx, cy, s: r2(9 + next() * 6), rot, fill, opacity });
      else out.push({ kind: "flake", cx, cy, s: r2(10 + next() * 7), rot, fill, opacity });
    } else {
      out.push({ kind: "flake", cx, cy, s: r2(12 + next() * 9), rot, fill, opacity });
    }
  }
  return out;
}

export default function ProductVisual({ product, className = "", rounded = "rounded-2xl", priority = false }) {
  const { slug, name, image, form = "flakes", colors } = product;

  if (image) {
    return (
      <div className={`relative h-full w-full overflow-hidden bg-slate-50 ${rounded} ${className}`}>
        <img
          src={image}
          alt={name}
          decoding="async"
          fetchPriority={priority ? "high" : undefined}
          loading={priority ? "eager" : "lazy"}
          className="absolute inset-0 h-full w-full object-contain"
        />
      </div>
    );
  }

  const next = rng(seedFrom(slug));
  const parts = shapes(form, next, colors);
  const gid = `pv-${slug}`;

  return (
    <svg
      viewBox="0 0 200 150"
      className={`h-full w-full ${rounded} ${className}`}
      role="img"
      aria-label={`${name} illustration`}
      preserveAspectRatio="xMidYMid slice"
    >
      <defs>
        <linearGradient id={`${gid}-bg`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor={colors.base} />
        </linearGradient>
        <radialGradient id={`${gid}-mound`} cx="50%" cy="100%" r="75%">
          <stop offset="0%" stopColor={colors.accent} />
          <stop offset="100%" stopColor={colors.deep} />
        </radialGradient>
        <clipPath id={`${gid}-clip`}>
          <rect width="200" height="150" />
        </clipPath>
      </defs>

      <g clipPath={`url(#${gid}-clip)`}>
        <rect width="200" height="150" fill={`url(#${gid}-bg)`} />
        <circle cx="164" cy="26" r="46" fill={colors.accent} opacity="0.12" />
        <circle cx="30" cy="132" r="38" fill={colors.deep} opacity="0.08" />

        {parts.map((p, i) => {
          if (p.kind === "mound") {
            return (
              <path
                key={i}
                d="M22 132 C 46 78, 86 62, 100 62 C 116 62, 154 80, 178 132 Z"
                fill={`url(#${gid}-mound)`}
                opacity="0.9"
              />
            );
          }
          if (p.kind === "dot") {
            return <circle key={i} cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} opacity={p.opacity} />;
          }
          if (p.kind === "slice") {
            return (
              <g key={i} transform={`rotate(${p.rot} ${p.cx} ${p.cy})`} opacity={p.opacity}>
                <circle cx={p.cx} cy={p.cy} r={p.r} fill={p.fill} />
                <circle cx={p.cx} cy={p.cy} r={r2(p.r * 0.52)} fill="#ffffff" opacity="0.42" />
              </g>
            );
          }
          if (p.kind === "dice") {
            return (
              <rect
                key={i}
                x={r2(p.cx - p.s / 2)}
                y={r2(p.cy - p.s / 2)}
                width={p.s}
                height={p.s}
                rx={r2(p.s * 0.26)}
                fill={p.fill}
                opacity={p.opacity}
                transform={`rotate(${p.rot} ${p.cx} ${p.cy})`}
              />
            );
          }
          // flake — an irregular curved chip
          return (
            <path
              key={i}
              d={`M${r2(p.cx - p.s / 2)} ${p.cy}
                  q ${r2(p.s * 0.18)} ${r2(-p.s * 0.62)} ${p.s} ${r2(-p.s * 0.2)}
                  q ${r2(p.s * 0.3)} ${r2(p.s * 0.5)} ${r2(-p.s * 0.34)} ${r2(p.s * 0.62)}
                  q ${r2(-p.s * 0.5)} ${r2(p.s * 0.2)} ${r2(-p.s * 0.66)} ${r2(-p.s * 0.42)} Z`}
              fill={p.fill}
              opacity={p.opacity}
              transform={`rotate(${p.rot} ${p.cx} ${p.cy})`}
            />
          );
        })}
      </g>
    </svg>
  );
}
