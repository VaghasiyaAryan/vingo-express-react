import Navbar from "@/components/sections/Navbar.jsx";
import Footer from "@/components/sections/Footer.jsx";
import WhatsAppButton from "@/components/WhatsAppButton.jsx";

/** The chrome every public page shares: navbar, footer and the floating WhatsApp button. */
export default function SiteLayout({ children }) {
  return (
    <>
      <Navbar />
      <main>{children}</main>
      <Footer />
      <WhatsAppButton />
    </>
  );
}
