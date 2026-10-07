import Navbar from "@/components/sections/Navbar.jsx";
import Footer from "@/components/sections/Footer.jsx";
import { company } from "@shared/content.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function CookiePolicy() {
  useDocumentTitle("Cookie Policy");

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 sm:pt-32 lg:pt-36">
        <div className="container-x max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">Cookie Policy</h1>
          <p className="mt-3 text-sm text-ink-500">Last updated: {new Date().getFullYear()}</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">What cookies we use</h2>
              <p className="mt-3">
                This website uses a small number of cookies. A session cookie is set only when you sign in to the
                admin dashboard, to keep you logged in — it is not set for regular visitors browsing the public site.
                We may also use privacy-respecting analytics to understand which pages are useful to visitors; this
                does not identify you personally.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Why</h2>
              <p className="mt-3">
                The admin session cookie is strictly necessary — without it, the admin dashboard could not verify
                you're signed in. Analytics cookies, where used, help us understand overall traffic and improve the
                site; they are not used to build advertising profiles.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Managing cookies</h2>
              <p className="mt-3">
                Most browsers let you block or delete cookies through their settings. Blocking the admin session
                cookie will prevent the admin dashboard from working; it has no effect on browsing the public site.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Contact</h2>
              <p className="mt-3">
                Questions about this policy can be sent to{" "}
                <a href={`mailto:${company.email}`} className="font-semibold text-navy-700 underline underline-offset-2">
                  {company.email}
                </a>
                .
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
