import { useEffect } from "react";
import { businessCard, businessCardInitials, businessCardName } from "@shared/content.js";
import ShareButton from "./card/ShareButton.jsx";
import CardActions from "./card/CardActions.jsx";

export default function BusinessCard() {
  const { role, organization, quote, photo, phoneDisplay, phoneHref, email, website, websiteUrl, address } =
    businessCard;

  // The card is the whole viewport, so the page behind it should not show a
  // white gutter on overscroll. Scoped to this route and undone on the way out.
  useEffect(() => {
    const previous = document.body.style.backgroundColor;
    document.body.style.backgroundColor = "#f2f2f9";
    document.title = `${businessCardName} — ${businessCard.organization}`;
    return () => {
      document.body.style.backgroundColor = previous;
    };
  }, []);

  return (
    <main className="flex min-h-[100svh] w-full items-center justify-center bg-navy-50 bg-mesh-light sm:p-6">
      {/* Phone-sized by design at every width: edge-to-edge on a handset, and from
          tablet up the exact same screen sits inside a centred device shell so the
          card never stretches into an unrecognisable desktop layout. */}
      <div className="relative flex h-[100svh] w-full flex-col overflow-hidden bg-white sm:h-[812px] sm:max-h-[calc(100svh-3rem)] sm:w-[390px] sm:rounded-[2.5rem] sm:border-[10px] sm:border-navy-900 sm:shadow-[0_40px_90px_-24px_rgba(20,19,56,0.55)]">
        {/* Avatar — sits above the panel and overlaps its top curve. */}
        <div className="relative z-10 flex shrink-0 justify-center px-6 pt-8 sm:pt-9">
          <div className="h-32 w-32 overflow-hidden rounded-full bg-gradient-to-br from-navy-500 to-navy-900 shadow-[0_18px_40px_-14px_rgba(20,19,56,0.55)] ring-[6px] ring-white sm:h-36 sm:w-36">
            {photo ? (
              <img src={photo} alt={businessCardName} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-4xl font-bold tracking-wide text-white">
                {businessCardInitials}
              </div>
            )}
          </div>
        </div>

        {/* Identity panel */}
        {/* min-h-0 + internal scroll: on a landscape phone or a short browser window
            the panel gives way instead of shoving the action rail off the card. */}
        <div className="relative z-0 -mt-16 flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain rounded-t-[2.25rem] bg-gradient-to-b from-navy-100 via-navy-100 to-navy-200 px-6 pb-6 pt-[5.25rem] text-center sm:-mt-[4.5rem] sm:pt-24">
          <ShareButton name={businessCardName} role={role} organization={organization} />

          <h1 className="font-display text-[1.7rem] font-bold leading-[1.15] text-navy-900 sm:text-[1.9rem]">
            {businessCardName}
          </h1>

          <p className="mt-2.5 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-navy-600">{role}</p>
          <p className="mt-1 text-sm font-medium text-navy-700">{organization}</p>

          <blockquote className="mt-6 rounded-2xl border border-white/70 bg-white/55 px-5 py-4 text-sm italic leading-relaxed text-navy-800 shadow-glass backdrop-blur-sm">
            &ldquo;{quote}&rdquo;
          </blockquote>

          <div className="mt-auto pt-6 text-[0.7rem] font-medium text-navy-600">
            <a
              href={websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="underline decoration-navy-400 underline-offset-4 transition-colors hover:text-navy-900"
            >
              {website}
            </a>
            <span className="mx-2 text-navy-400">·</span>
            <span>{address}</span>
          </div>
        </div>

        {/* Action rail */}
        <CardActions phoneDisplay={phoneDisplay} phoneHref={phoneHref} email={email} />
      </div>
    </main>
  );
}
