import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Reveal from "@/components/Reveal.jsx";
import { whatsappLink } from "@shared/content.js";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";

/** Closing call to action on the inner pages — sends visitors to the Contact page. */
export default function QuoteCta({
  title = "Ready to source with VinGo?",
  text = "Tell us the product, quantity and destination port — we usually reply with pricing and sample options within one working day.",
}) {
  return (
    <section className="py-10 sm:py-16 lg:py-20">
      <div className="container-x">
        <Reveal>
          <div className="flex flex-col items-center gap-5 rounded-3xl bg-gradient-to-br from-navy-700 to-navy-900 p-6 text-center text-white shadow-liftNavy sm:gap-6 sm:p-12 lg:flex-row lg:text-left">
            <div className="flex-1">
              <h2 className="font-display text-2xl font-bold sm:text-3xl">{title}</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-navy-100 sm:text-base">{text}</p>
            </div>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <Link to="/contact" className="btn-primary">
                Request a Quotation
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="btn border border-white/50 bg-white/80 text-navy-800 hover:bg-white"
              >
                <WhatsAppIcon className="h-5 w-5" />
                WhatsApp
              </a>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
