import Navbar from "@/components/sections/Navbar.jsx";
import Footer from "@/components/sections/Footer.jsx";
import { company } from "@shared/content.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function PrivacyPolicy() {
  useDocumentTitle("Privacy Policy");

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 sm:pt-32 lg:pt-36">
        <div className="container-x max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">Privacy Policy</h1>
          <p className="mt-3 text-sm text-ink-500">Last updated: {new Date().getFullYear()}</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Information we collect</h2>
              <p className="mt-3">
                When you submit our enquiry form, we collect the details you provide — name, email, phone number,
                company, destination country, product interest, quantity and your message. We do not require an
                account and do not collect payment information through this website.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">How we use it</h2>
              <p className="mt-3">
                Enquiry details are used solely to respond to your request — sharing specifications, pricing and
                samples, and following up on your order. We do not sell or rent your personal information to third
                parties.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Data storage and retention</h2>
              <p className="mt-3">
                Enquiry submissions are stored securely in our database and are accessible only to authorised {company.shortName}{" "}
                staff. We retain enquiry records for as long as reasonably necessary to manage the buyer relationship
                and for legitimate business record-keeping.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Third-party services</h2>
              <p className="mt-3">
                We may use third-party services for email delivery and website analytics. These providers process
                data only as needed to deliver their service and are not permitted to use it for their own marketing
                purposes.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Your rights</h2>
              <p className="mt-3">
                You may ask us to access, correct or delete the information you've submitted at any time by
                contacting us at{" "}
                <a href={`mailto:${company.email}`} className="font-semibold text-navy-700 underline underline-offset-2">
                  {company.email}
                </a>
                .
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Contact</h2>
              <p className="mt-3">
                Questions about this policy can be sent to{" "}
                <a href={`mailto:${company.email}`} className="font-semibold text-navy-700 underline underline-offset-2">
                  {company.email}
                </a>{" "}
                or via WhatsApp at {company.phoneDisplay}.
              </p>
            </section>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
