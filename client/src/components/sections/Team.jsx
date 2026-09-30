import Reveal from "@/components/Reveal.jsx";
import TeamPortrait from "@/components/TeamPortrait.jsx";

/** Placeholder card, shown while the roster is on its way from the API. */
function TeamCardSkeleton() {
  return (
    <div className="flex animate-pulse flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass">
      <div className="aspect-[4/5] w-full bg-slate-100" />
      <div className="flex flex-col gap-2 p-5">
        <div className="h-4 w-2/3 rounded bg-slate-100" />
        <div className="h-3 w-1/2 rounded bg-slate-100" />
      </div>
    </div>
  );
}

export default function Team({ team = [], loading = false, error = null }) {
  const [leader, ...rest] = team;

  return (
    <section id="team" className="relative overflow-hidden border-y border-slate-100 bg-white py-20 lg:py-28">
      <div className="container-x">
        <Reveal className="mx-auto max-w-2xl text-center">
          <span className="section-eyebrow">Our Team</span>
          <h2 className="section-title mt-5">The people your order actually passes through</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Every enquiry reaches a named person, not a shared inbox — the people who quote it, source and check the
            batch behind it, prepare the documents that travel with it, and keep the stock it ships from.
          </p>
        </Reveal>

        {error && (
          <p className="mt-12 rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-center text-sm text-red-700">
            {error.message} Please refresh the page.
          </p>
        )}

        {loading && team.length === 0 && !error && (
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <TeamCardSkeleton key={i} />
            ))}
          </div>
        )}

        {!loading && !error && team.length === 0 && (
          <p className="mt-12 text-center text-sm text-ink-500">Team profiles are coming soon.</p>
        )}

        {leader && (
          <Reveal delay={0.08} className="mt-14">
            <div className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white shadow-glass transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift md:flex">
              <div className="aspect-[4/3] shrink-0 overflow-hidden md:aspect-auto md:w-72 lg:w-80">
                <span className="block h-full w-full transition-transform duration-700 ease-smooth group-hover:scale-105">
                  <TeamPortrait name={leader.name} photo={leader.photo} textSize="text-4xl" />
                </span>
              </div>
              <div className="flex flex-1 flex-col justify-center p-8 sm:p-10">
                <h3 className="font-display text-2xl font-bold text-ink-900">{leader.name}</h3>
                <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-orange-600">{leader.role}</p>
                <p className="mt-4 text-sm leading-relaxed text-ink-500">{leader.bio}</p>
              </div>
            </div>
          </Reveal>
        )}

        {rest.length > 0 && (
          <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {rest.map((member, i) => (
              <Reveal key={member.id} delay={0.14 + i * 0.06}>
                <div className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200/80 bg-white shadow-glass transition-all duration-500 ease-smooth hover:-translate-y-1 hover:border-navy-200 hover:shadow-lift">
                  <div className="aspect-[4/5] w-full overflow-hidden">
                    <span className="block h-full w-full transition-transform duration-700 ease-smooth group-hover:scale-105">
                      <TeamPortrait name={member.name} photo={member.photo} />
                    </span>
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <h3 className="font-display text-base font-bold text-ink-900">{member.name}</h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-wider text-orange-600">
                      {member.role}
                    </p>
                    <p className="mt-3 text-sm leading-relaxed text-ink-500">{member.bio}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
