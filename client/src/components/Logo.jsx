/**
 * VinGo International logo — the company's official artwork.
 *
 * Source files (vector, so sharp at every size):
 *   public/logo.svg       full lockup — mark + "VINGO INTERNATIONAL"
 *   public/logo-mark.svg  the symbol on its own, for tight spaces
 *
 * Pass height utilities via `markClass` (e.g. "h-9 sm:h-11"); the width
 * follows the artwork's own aspect ratio.
 */

export function LogoMark({ className = "h-10" }) {
  return (
    <img src="/logo-mark.svg" alt="" aria-hidden="true" className={`${className} w-auto`} />
  );
}

export default function Logo({ className = "", markClass = "h-10", compact = false }) {
  if (compact) return <LogoMark className={`${markClass} ${className}`} />;

  return (
    <img
      src="/logo.svg"
      alt="VinGo International Pvt Ltd"
      className={`${markClass} w-auto ${className}`}
    />
  );
}
