import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Send, CheckCircle2, AlertCircle, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import {
  company,
  productInterestOptions,
  quantityOptions,
  orderFrequencyOptions,
  whatsappLink,
} from "@shared/content.js";
import { countries, countryByCode, formatNational } from "@shared/countries.js";
import { WhatsAppIcon } from "@/components/WhatsAppButton.jsx";
import CountrySelect from "@/components/CountrySelect.jsx";
import Select from "@/components/Select.jsx";
import { analytics } from "@/lib/analytics.js";
import { endpoints } from "@/lib/api.js";

/** Maps a product's category to the matching dropdown option. */
const CATEGORY_TO_INTEREST = {
  "dehydrated-fruits": "Dehydrated Fruits",
  "dehydrated-vegetables": "Dehydrated Vegetables",
  "fruit-vegetable-powders": "Fruit & Vegetable Powders",
  "instant-food": "Dehydrated Instant Foods",
  "custom-blends": "Custom / Private Label",
};

const EMPTY = {
  name: "",
  email: "",
  phone: "", // national number only — the dial code lives in `phoneCountry`
  company: "",
  country: "",
  productInterest: "",
  quantity: "",
  quantityOther: "",
  orderFrequency: "",
  message: "",
  website: "", // honeypot
};

const DEFAULT_PHONE_COUNTRY = "IN";

export default function Enquiry({ products = [] }) {
  const [form, setForm] = useState(EMPTY);
  const [status, setStatus] = useState("idle"); // idle | sending | success | error
  const [errors, setErrors] = useState({});
  const [errorMessage, setErrorMessage] = useState("");
  const [highlightedProduct, setHighlightedProduct] = useState("");
  const [phoneCountry, setPhoneCountry] = useState(DEFAULT_PHONE_COUNTRY);
  // form.country stores the display name (readable in the admin dashboard);
  // this tracks the matching ISO code, which is what CountrySelect needs.
  const [countryCode, setCountryCode] = useState("");

  const phoneMeta = countryByCode(phoneCountry) ?? countryByCode(DEFAULT_PHONE_COUNTRY);

  const update = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  // Same as `update`, but for controls like <Select> that hand back the
  // picked value directly instead of a change event.
  const updateValue = (field) => (val) => {
    setForm((prev) => ({ ...prev, [field]: val }));
    setErrors((prev) => (prev[field] ? { ...prev, [field]: undefined } : prev));
  };

  function handlePhoneChange(e) {
    const raw = e.target.value;

    // Typed or pasted with a leading "+" — treat it as a full international
    // number, detect the dial code, and sync the country picker to match
    // instead of dumping the code's digits into the national number.
    if (raw.trim().startsWith("+")) {
      const digits = raw.replace(/\D/g, "");
      const match = countries
        .filter((c) => digits.startsWith(c.dial.slice(1)))
        .sort((a, b) => b.dial.length - a.dial.length)[0];

      if (match) {
        const national = digits.slice(match.dial.length - 1);
        setPhoneCountry(match.code);
        setForm((prev) => ({ ...prev, phone: formatNational(national, match.fmt) }));
        setErrors((prev) => (prev.phone ? { ...prev, phone: undefined } : prev));
        return;
      }
    }

    setForm((prev) => ({ ...prev, phone: formatNational(raw, phoneMeta.fmt) }));
    setErrors((prev) => (prev.phone ? { ...prev, phone: undefined } : prev));
  }

  // Destination country (where the goods ship) and the phone/WhatsApp dial
  // code (whose number it is) are independent — picking one must never
  // change the other.
  function handleCountryChange(code) {
    const match = countryByCode(code);
    setCountryCode(code);
    setForm((prev) => ({ ...prev, country: match?.name || "" }));
  }

  function handleDialChange(code) {
    setPhoneCountry(code);
    const match = countryByCode(code);
    setForm((prev) => ({ ...prev, phone: formatNational(prev.phone, match?.fmt) }));
  }

  // Arriving from a product page (/?product=<slug>#enquiry) prefills this form.
  // `products` is fetched, so this has to re-run once it lands — on a cold load
  // the effect fires before the catalogue is back from the API.
  const [searchParams] = useSearchParams();
  useEffect(() => {
    const slug = searchParams.get("product");
    if (!slug) return;

    const match = products.find((p) => p.slug === slug);
    if (!match) return;
    const categoryLabel = CATEGORY_TO_INTEREST[match.category];

    setStatus("idle");
    setForm((prev) => ({
      ...prev,
      productInterest: categoryLabel || prev.productInterest,
      message: prev.message.trim()
        ? prev.message
        : `I would like a quotation for ${match.name}. Please share specifications, packaging options and pricing.`,
    }));
    setHighlightedProduct(match.name);
  }, [searchParams, products]);

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("sending");
    setErrors({});
    setErrorMessage("");

    // Send a complete international number, and the typed quantity when
    // "Other" was chosen, so the enquiry reads correctly in the dashboard.
    const quantity =
      form.quantity === "Other (specify)" && form.quantityOther.trim()
        ? form.quantityOther.trim()
        : form.quantity;

    const payload = {
      ...form,
      phone: `${phoneMeta.dial} ${form.phone}`.trim(),
      quantity: [quantity, form.orderFrequency].filter(Boolean).join(" · "),
    };

    try {
      await endpoints.submitInquiry(payload);

      analytics.enquirySubmit({ product: form.productInterest || undefined, country: form.country || undefined });
      setForm(EMPTY);
      setHighlightedProduct("");
      setPhoneCountry(DEFAULT_PHONE_COUNTRY);
      setCountryCode("");
      setStatus("success");
    } catch (err) {
      // Field-level messages come back under `errors`; the top-level message
      // covers both validation failures and an unreachable server.
      setErrors(err?.data?.errors || {});
      setErrorMessage(err?.message || "Something went wrong. Please try again.");
      setStatus("error");
    }
  }

  return (
    <section id="enquiry" className="relative overflow-hidden py-20 lg:py-28">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-b from-white via-navy-50/50 to-white" />
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute right-[6%] top-10 h-[280px] w-[280px] rounded-full bg-orange-200/25 blur-[110px]" />
        <div className="absolute bottom-0 left-[4%] h-[320px] w-[320px] rounded-full bg-navy-200/25 blur-[110px]" />
      </div>

      <div className="container-x grid gap-12 lg:grid-cols-[0.85fr_1.15fr] lg:gap-14">
        <div>
          <span className="section-eyebrow">Get in Touch</span>
          <h2 className="section-title mt-5">Request a quotation</h2>
          <p className="mt-5 text-base leading-relaxed text-ink-500">
            Share your product, quantity and destination port. We will come back with pricing, specifications and
            sample options — usually within one working day.
          </p>

          <ul className="mt-9 space-y-4">
            <li>
              <a
                href={`tel:${company.phoneHref}`}
                onClick={() => analytics.phoneClick("enquiry-sidebar")}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-navy-200 hover:shadow-glass"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <Phone className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Call us</span>
                  <span className="mt-0.5 block text-sm font-semibold text-ink-900">{company.phoneDisplay}</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={whatsappLink()}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => analytics.whatsappClick("enquiry-sidebar")}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-[#25D366]/40 hover:shadow-glass"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#25D366]/10 text-[#128C4A]">
                  <WhatsAppIcon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">WhatsApp</span>
                  <span className="mt-0.5 block text-sm font-semibold text-ink-900">Start a chat instantly</span>
                </span>
              </a>
            </li>
            <li>
              <a
                href={`mailto:${company.email}`}
                onClick={() => analytics.emailClick("enquiry-sidebar")}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition-all hover:border-navy-200 hover:shadow-glass"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                  <Mail className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Email</span>
                  <span className="mt-0.5 block break-all text-sm font-semibold text-ink-900">{company.email}</span>
                </span>
              </a>
            </li>
            <li className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-700">
                <MapPin className="h-5 w-5" />
              </span>
              <span>
                <span className="block text-xs font-semibold uppercase tracking-wider text-ink-500">Office</span>
                <span className="mt-0.5 block text-sm font-semibold text-ink-900">{company.address}</span>
              </span>
            </li>
          </ul>
        </div>

        <div className="rounded-3xl border border-white/60 bg-white/55 p-6 shadow-glass backdrop-blur-xl backdrop-saturate-150 sm:p-9">
          {status === "success" ? (
            <div className="flex h-full min-h-[420px] flex-col items-center justify-center text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-navy-100 text-navy-700">
                <CheckCircle2 className="h-8 w-8" />
              </span>
              <h3 className="mt-6 font-display text-2xl font-bold text-ink-900">Enquiry received</h3>
              <p className="mt-3 max-w-sm text-sm leading-relaxed text-ink-500">
                Thank you for reaching out to {company.shortName}. Our team will review your requirement and
                respond shortly.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn border border-white/30 bg-[#25D366]/90 text-white backdrop-blur-md backdrop-saturate-150 hover:brightness-95"
                >
                  <WhatsAppIcon className="h-5 w-5" />
                  Chat now on WhatsApp
                </a>
                <button type="button" onClick={() => setStatus("idle")} className="btn-ghost">
                  Send another enquiry
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              {highlightedProduct && (
                <div className="mb-6 flex items-center justify-between gap-4 rounded-xl border border-navy-200 bg-navy-50 px-4 py-3">
                  <p className="text-sm text-navy-800">
                    Enquiring about <span className="font-semibold">{highlightedProduct}</span>
                  </p>
                  <button
                    type="button"
                    onClick={() => setHighlightedProduct("")}
                    className="text-xs font-semibold text-navy-700 underline underline-offset-2 hover:text-navy-900"
                  >
                    Clear
                  </button>
                </div>
              )}

              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="name" className="field-label">
                    Full name <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="name"
                    type="text"
                    autoComplete="name"
                    className={`field ${errors.name ? "field-error" : ""}`}
                    placeholder="Your name"
                    value={form.name}
                    onChange={update("name")}
                    required
                  />
                  {errors.name && <p className="mt-1.5 text-xs text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label htmlFor="email" className="field-label">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="email"
                    type="email"
                    autoComplete="email"
                    className={`field ${errors.email ? "field-error" : ""}`}
                    placeholder="you@company.com"
                    value={form.email}
                    onChange={update("email")}
                    required
                  />
                  {errors.email && <p className="mt-1.5 text-xs text-red-600">{errors.email}</p>}
                </div>

                <div>
                  <label htmlFor="phone" className="field-label">
                    Phone / WhatsApp <span className="text-red-500">*</span>
                  </label>
                  <div
                    className={`flex rounded-xl border bg-white transition-colors focus-within:ring-2 ${
                      errors.phone
                        ? "border-red-300 focus-within:border-red-400 focus-within:ring-red-100"
                        : "border-slate-200 focus-within:border-orange-400 focus-within:ring-orange-100"
                    }`}
                  >
                    <CountrySelect
                      variant="dial"
                      ariaLabel="Phone country code"
                      value={phoneCountry}
                      onChange={handleDialChange}
                    />
                    <input
                      id="phone"
                      type="tel"
                      inputMode="tel"
                      autoComplete="tel-national"
                      className="w-full min-w-0 px-3 py-3 text-sm text-ink-900 placeholder:text-slate-400 focus:outline-none"
                      placeholder={phoneMeta.fmt ? phoneMeta.fmt.replace(/#/g, "0") : "Phone number"}
                      value={form.phone}
                      onChange={handlePhoneChange}
                      required
                    />
                  </div>
                  {errors.phone ? (
                    <p className="mt-1.5 text-xs text-red-600">{errors.phone}</p>
                  ) : (
                    form.phone && (
                      <p className="mt-1.5 text-xs text-ink-500">
                        We will contact you on {phoneMeta.dial} {form.phone}
                      </p>
                    )
                  )}
                </div>

                <div>
                  <label htmlFor="company" className="field-label">
                    Company
                  </label>
                  <input
                    id="company"
                    type="text"
                    autoComplete="organization"
                    className="field"
                    placeholder="Company name"
                    value={form.company}
                    onChange={update("company")}
                  />
                </div>

                <div>
                  <label htmlFor="country" className="field-label">
                    Destination country
                  </label>
                  <CountrySelect
                    id="country"
                    variant="country"
                    ariaLabel="Destination country"
                    placeholder="Select a country"
                    value={countryCode}
                    onChange={handleCountryChange}
                  />
                </div>

                <div>
                  <label htmlFor="productInterest" className="field-label">
                    Product interest
                  </label>
                  <Select
                    id="productInterest"
                    ariaLabel="Product interest"
                    placeholder="Select a category"
                    value={form.productInterest}
                    onChange={updateValue("productInterest")}
                    options={productInterestOptions}
                  />
                </div>

                <div>
                  <label htmlFor="quantity" className="field-label">
                    Required quantity
                  </label>
                  <Select
                    id="quantity"
                    ariaLabel="Required quantity"
                    placeholder="Select a quantity"
                    value={form.quantity}
                    onChange={updateValue("quantity")}
                    options={quantityOptions}
                  />
                </div>

                <div>
                  <label htmlFor="orderFrequency" className="field-label">
                    Order frequency
                  </label>
                  <Select
                    id="orderFrequency"
                    ariaLabel="Order frequency"
                    placeholder="Select frequency"
                    value={form.orderFrequency}
                    onChange={updateValue("orderFrequency")}
                    options={orderFrequencyOptions}
                  />
                </div>

                {form.quantity === "Other (specify)" && (
                  <div className="sm:col-span-2">
                    <label htmlFor="quantityOther" className="field-label">
                      Tell us the quantity you need
                    </label>
                    <input
                      id="quantityOther"
                      type="text"
                      className="field"
                      placeholder="e.g. 7 MT per month, or 2 × 40ft containers per quarter"
                      value={form.quantityOther}
                      onChange={update("quantityOther")}
                      autoFocus
                    />
                  </div>
                )}

                <div className="sm:col-span-2">
                  <label htmlFor="message" className="field-label">
                    Your requirement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    rows={4}
                    className={`field resize-y ${errors.message ? "field-error" : ""}`}
                    placeholder="Tell us the products, specifications, packaging and destination port you need."
                    value={form.message}
                    onChange={update("message")}
                    required
                  />
                  {errors.message && <p className="mt-1.5 text-xs text-red-600">{errors.message}</p>}
                </div>
              </div>

              {/* Honeypot — hidden from humans, catches bots. */}
              <div className="absolute left-[-9999px]" aria-hidden="true">
                <label htmlFor="website">Leave this field empty</label>
                <input
                  id="website"
                  type="text"
                  tabIndex={-1}
                  autoComplete="off"
                  value={form.website}
                  onChange={update("website")}
                />
              </div>

              {status === "error" && errorMessage && (
                <p className="mt-5 flex items-start gap-2 rounded-xl bg-red-50 p-3.5 text-sm text-red-700">
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                  {errorMessage}
                </p>
              )}

              <button type="submit" disabled={status === "sending"} className="btn-primary mt-7 w-full disabled:opacity-70">
                {status === "sending" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Sending…
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Send Enquiry
                  </>
                )}
              </button>

              <p className="mt-4 text-center text-xs text-ink-500">
                Prefer to talk?{" "}
                <a
                  href={whatsappLink()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-navy-700 underline underline-offset-2"
                >
                  Message us on WhatsApp
                </a>
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
