import { useEffect } from "react";
import { Send, Mail, FileCheck2 } from "lucide-react";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";
import { analytics } from "@/lib/analytics.js";

/** Renders the Enquire/COA/WhatsApp/Email CTA row for a product page and fires analytics. */
export default function ProductCtas({ slug, name, enquireHref, whatsappHref, mailtoHref, coaUrl }) {
  useEffect(() => {
    analytics.productView(slug);
  }, [slug]);

  return (
    <div className="mt-8 space-y-3">
      <a
        href={enquireHref}
        onClick={() => analytics.quoteRequest("product-page-form")}
        className="btn-primary w-full sm:w-auto"
      >
        <Send className="h-4 w-4" />
        Enquire About This Product
      </a>

      <div className="flex flex-wrap gap-3">
        {coaUrl && (
          <a
            href={coaUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => analytics.coaDownload(slug)}
            title="Download Certificate of Analysis"
            className="btn border border-navy-200 bg-navy-50/80 text-navy-800 backdrop-blur-md backdrop-saturate-150 hover:bg-navy-100"
          >
            <FileCheck2 className="h-4 w-4" />
            COA
          </a>
        )}
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
    </div>
  );
}
