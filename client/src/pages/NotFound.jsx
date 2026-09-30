import { Link } from "react-router-dom";
import { Home, Search } from "lucide-react";
import Navbar from "@/components/sections/Navbar.jsx";
import Footer from "@/components/sections/Footer.jsx";
import { whatsappLink } from "@shared/content.js";
import { useDocumentTitle } from "@/lib/useDocumentTitle.js";

export default function NotFound() {
  useDocumentTitle("Page Not Found");

  return (
    <>
      <Navbar />
      <main className="flex min-h-[70vh] items-center justify-center bg-mesh-light px-5 py-28">
        <div className="mx-auto max-w-md text-center">
          <p className="font-display text-6xl font-bold text-navy-700">404</p>
          <h1 className="mt-4 font-display text-2xl font-bold text-ink-900">Page not found</h1>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            The page you&apos;re looking for doesn&apos;t exist or may have moved. Try the homepage, or browse our
            product catalogue.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link to="/" className="btn-primary">
              <Home className="h-4 w-4" />
              Back to homepage
            </Link>
            <Link to="/products" className="btn-ghost">
              <Search className="h-4 w-4" />
              Browse products
            </Link>
          </div>
          <a
            href={whatsappLink()}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-6 inline-block text-xs text-ink-500 underline underline-offset-2 transition-colors duration-300 ease-smooth hover:text-navy-700"
          >
            Or message us directly on WhatsApp
          </a>
        </div>
      </main>
      <Footer />
    </>
  );
}
