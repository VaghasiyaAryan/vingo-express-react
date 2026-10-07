import { useEffect } from "react";
import { Send, Mail } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";
import { analytics } from "@/lib/analytics.js";

/** Renders the Enquire/WhatsApp/Email CTA row for a product page and fires analytics. */
export default function ProductCtas({ slug, name, enquireHref, whatsappHref, mailtoHref }) {
  useEffect(() => {
    analytics.productView(slug);
  }, [slug]);

  return (
    <div className="mt-8 flex flex-col gap-3 sm:flex-row">
      <a
        href={enquireHref}
        onClick={() => analytics.quoteRequest("product-page-form")}
        className="btn-primary flex-1"
      >
        <Send className="h-4 w-4" />
        Enquire About This Product
      </a>
      <a
        href={whatsappHref}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => analytics.whatsappClick(`product:${name}`)}
        className="btn border border-[#25D366]/30 bg-[#25D366]/10 text-[#128C4A] backdrop-blur-md backdrop-saturate-150 hover:bg-[#25D366]/20"
      >
        <WhatsAppIcon className="h-5 w-5" />
        WhatsApp
      </a>
      <a
        href={mailtoHref}
        onClick={() => analytics.emailClick(`product:${name}`)}
        className="btn border border-navy-200 bg-navy-50/80 text-navy-800 backdrop-blur-md backdrop-saturate-150 hover:bg-navy-100"
      >
        <Mail className="h-4 w-4" />
        Email
      </a>
    </div>
  );
}
