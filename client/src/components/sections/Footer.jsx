import { Link } from "react-router-dom";
import { Phone, Mail, MapPin, Globe, Instagram, Facebook, Linkedin } from "lucide-react";
import Logo from "@/components/Logo.jsx";
import { company, social, productCategories, whatsappLink } from "@shared/content.js";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";

// Lucide has no X (formerly Twitter) mark — its "Twitter" icon is still the
// old bird logo — so the current wordmark is drawn directly.
function XIcon(props) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

const socialLinks = [
  {
    href: social.instagram,
    label: "Instagram",
    Icon: Instagram,
    hoverClass: "hover:border-transparent hover:bg-gradient-to-tr hover:from-[#f9ce34] hover:via-[#ee2a7b] hover:to-[#6228d7] hover:text-white",
  },
  {
    href: social.facebook,
    label: "Facebook",
    Icon: Facebook,
    hoverClass: "hover:border-[#1877F2] hover:bg-[#1877F2] hover:text-white",
  },
  {
    href: social.linkedin,
    label: "LinkedIn",
    Icon: Linkedin,
    hoverClass: "hover:border-[#0A66C2] hover:bg-[#0A66C2] hover:text-white",
  },
  {
    href: social.twitter,
    label: "X (Twitter)",
    Icon: XIcon,
    hoverClass: "hover:border-ink-900 hover:bg-ink-900 hover:text-white",
  },
];

const quickLinks = [
  { href: "/about", label: "About Us" },
  { href: "/products", label: "Products" },
  { href: "/why-us", label: "Why Choose Us" },
  { href: "/process", label: "Our Process" },
  { href: "/global-reach", label: "Global Reach" },
  { href: "/team", label: "Our Team" },
  { href: "/contact", label: "Request a Quote" },
];

export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-50/80">
      <div className="container-x py-14 lg:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-4">
          <div className="lg:pr-6">
            <Logo />
            <p className="mt-5 text-sm leading-relaxed text-ink-500">
              Exporters of dehydrated fruits, vegetables, fruit and vegetable powders, and dehydrated instant food
              mixes — supplied to specification, worldwide.
            </p>
            <div className="mt-5 flex items-center gap-3">
              {socialLinks.map(({ href, label, Icon, hoverClass }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-ink-500 shadow-sm transition-all duration-350 ease-smooth hover:-translate-y-1 hover:scale-110 hover:shadow-lg ${hoverClass}`}
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
            <a
              href={whatsappLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="btn mt-6 border border-white/30 bg-[#25D366]/90 px-5 py-2.5 text-white backdrop-blur-md backdrop-saturate-150 hover:brightness-95"
            >
              <WhatsAppIcon className="h-4 w-4" />
              WhatsApp Us
            </a>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">Quick Links</h3>
            <ul className="mt-5 space-y-3">
              {quickLinks.map((link) => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-ink-500 transition-colors duration-300 ease-smooth hover:text-navy-700">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">Products</h3>
            <ul className="mt-5 space-y-3">
              {productCategories.map((cat) => (
                <li key={cat.slug}>
                  <Link
                    to={`/products?category=${cat.slug}`}
                    className="text-sm text-ink-500 transition-colors duration-300 ease-smooth hover:text-navy-700"
                  >
                    {cat.title}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-ink-900">Contact</h3>
            <ul className="mt-5 space-y-4 text-sm text-ink-500">
              <li className="flex items-start gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" />
                <a href={`tel:${company.phoneHref}`} className="transition-colors duration-300 ease-smooth hover:text-navy-700">
                  {company.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" />
                <a href={`mailto:${company.email}`} className="break-all transition-colors duration-300 ease-smooth hover:text-navy-700">
                  {company.email}
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Globe className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" />
                <a
                  href="https://vingointernational.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="break-all transition-colors duration-300 ease-smooth hover:text-navy-700"
                >
                  vingointernational.com
                </a>
              </li>
              <li className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-navy-600" />
                {company.address}
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col items-center justify-between gap-4 border-t border-slate-200 pt-7 sm:flex-row">
          <p className="text-xs text-ink-500">
            © {new Date().getFullYear()} {company.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-xs text-ink-500">
            <Link to="/privacy-policy" className="transition-colors duration-300 ease-smooth hover:text-navy-700">
              Privacy Policy
            </Link>
            <Link to="/terms-and-conditions" className="transition-colors duration-300 ease-smooth hover:text-navy-700">
              Terms &amp; Conditions
            </Link>
            <Link to="/cookie-policy" className="transition-colors duration-300 ease-smooth hover:text-navy-700">
              Cookie Policy
            </Link>
            <Link to="/admin" className="transition-colors duration-300 ease-smooth hover:text-navy-700">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
