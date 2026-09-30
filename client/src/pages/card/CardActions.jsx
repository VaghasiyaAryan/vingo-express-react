import { AtSign, ContactRound, Phone } from "lucide-react";
import { analytics } from "@/lib/analytics.js";

const tile =
  "flex flex-col items-center justify-center gap-2 rounded-2xl px-1 py-3 text-center transition-all duration-200 active:scale-95";

export default function CardActions({ phoneDisplay, phoneHref, email }) {
  return (
    // The bottom padding carries the iOS home-indicator inset so the last row of
    // labels never sits under the gesture bar.
    <nav
      aria-label="Contact actions"
      className="grid shrink-0 grid-cols-3 gap-2 border-t border-slate-200 bg-white px-3 pt-3"
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <a
        href={`tel:${phoneHref}`}
        onClick={() => analytics.phoneClick("business_card")}
        aria-label={`Call ${phoneDisplay}`}
        className={`${tile} text-navy-700 hover:bg-navy-50`}
      >
        <Phone className="h-[1.35rem] w-[1.35rem]" strokeWidth={1.9} />
        <span className="text-[0.68rem] font-medium leading-tight">Mobile</span>
      </a>

      <a
        href={`mailto:${email}`}
        onClick={() => analytics.emailClick("business_card")}
        aria-label={`Email ${email}`}
        className={`${tile} text-navy-700 hover:bg-navy-50`}
      >
        <AtSign className="h-[1.35rem] w-[1.35rem]" strokeWidth={1.9} />
        <span className="text-[0.68rem] font-medium leading-tight">E-mail address</span>
      </a>

      {/* The one action worth highlighting — it's what turns a link into a saved contact. */}
      <a
        href="/api/vcard"
        download
        aria-label="Download contact card"
        className={`${tile} border border-orange-200 bg-orange-50 text-orange-600 shadow-lift hover:bg-orange-100`}
      >
        <ContactRound className="h-[1.35rem] w-[1.35rem]" strokeWidth={1.9} />
        <span className="text-[0.68rem] font-semibold leading-tight">Add to contacts</span>
      </a>
    </nav>
  );
}
