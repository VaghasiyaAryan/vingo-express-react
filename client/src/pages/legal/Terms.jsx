import Navbar from "@/components/sections/Navbar.jsx";
import Footer from "@/components/sections/Footer.jsx";
import { company } from "@shared/content.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function Terms() {
  useDocumentTitle("Terms & Conditions");

  return (
    <>
      <Navbar />
      <main className="pt-28 pb-20 sm:pt-32 lg:pt-36">
        <div className="container-x max-w-3xl">
          <h1 className="font-display text-3xl font-bold text-ink-900 sm:text-4xl">Terms &amp; Conditions</h1>
          <p className="mt-3 text-sm text-ink-500">Last updated: {new Date().getFullYear()}</p>

          <div className="mt-10 space-y-8 text-sm leading-relaxed text-ink-700">
            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Use of this website</h2>
              <p className="mt-3">
                This website is provided by {company.name} to present our product range and let prospective buyers
                request quotations. Content is provided in good faith for general informational purposes; specific
                product specifications, pricing and availability are confirmed directly with our team before any
                order is placed.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Enquiries and quotations</h2>
              <p className="mt-3">
                Submitting the enquiry form does not create a binding order. Quotations we provide in response are
                subject to confirmation of specification, quantity, packaging, Incoterms and payment terms, and are
                valid only for the period stated in the quotation itself.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Product information</h2>
              <p className="mt-3">
                We aim to keep product descriptions accurate and up to date. Where specifications on this website are
                indicative, they are marked as such — please confirm exact specifications, minimum order quantities
                and certifications required for your shipment directly with our team before finalising an order.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Intellectual property</h2>
              <p className="mt-3">
                The {company.shortName} name, logo and website content are the property of {company.name}. Content
                may not be reproduced or redistributed without permission.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Limitation of liability</h2>
              <p className="mt-3">
                While we take care to keep this website accurate, we do not guarantee it is error-free or
                uninterrupted, and we are not liable for decisions made solely on the basis of general website
                content rather than a confirmed quotation and agreed contract.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Governing law</h2>
              <p className="mt-3">
                These terms are governed by the laws of India. Any disputes will be subject to the jurisdiction of
                the courts having authority over our registered place of business.
              </p>
            </section>

            <section>
              <h2 className="font-display text-lg font-bold text-ink-900">Contact</h2>
              <p className="mt-3">
                Questions about these terms can be sent to{" "}
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
