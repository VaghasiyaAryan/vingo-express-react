import { User } from "lucide-react";

/** "Jane Doe" -> "JD" — shown when a member has no photo set. */
export function initials(name) {
  return String(name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
}

/** Portrait placeholder used until a team member has a real photo. */
export default function TeamPortrait({ name, photo, textSize = "text-3xl", iconSize = "h-8 w-8" }) {
  if (photo) {
    return <img src={photo} alt={name} className="h-full w-full object-cover" />;
  }

  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-navy-100 via-white to-orange-100">
      <User className={`${iconSize} text-navy-300`} strokeWidth={1.5} />
      <span className={`font-display font-bold text-navy-300 ${textSize}`}>{initials(name)}</span>
    </div>
  );
}
