import { Suspense, lazy } from "react";
import { Route, Routes, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";

import ScrollBehaviour from "./components/ScrollBehaviour.jsx";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import Products from "./pages/Products.jsx";
import Product from "./pages/Product.jsx";
import WhyUs from "./pages/WhyUs.jsx";
import Process from "./pages/Process.jsx";
import GlobalReach from "./pages/GlobalReach.jsx";
import Team from "./pages/Team.jsx";
import Faq from "./pages/Faq.jsx";
import Contact from "./pages/Contact.jsx";
import BusinessCard from "./pages/BusinessCard.jsx";
import NotFound from "./pages/NotFound.jsx";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import Terms from "./pages/legal/Terms.jsx";
import CookiePolicy from "./pages/legal/CookiePolicy.jsx";

// The admin dashboard is a whole second application that no site visitor ever
// loads. Splitting it out keeps it out of the public bundle entirely.
const AdminRoutes = lazy(() => import("./admin/AdminRoutes.jsx"));

export default function App() {
  const location = useLocation();
  // Admin routes get no page-fade — snappy, and skipping it means dashboard
  // navigation state never gets caught mid-transition.
  const isAdmin = location.pathname.startsWith("/admin");

  // Pinned to this render's location for the non-admin branch, so the page
  // that's fading out keeps rendering its own (now stale) route instead of
  // snapping to whatever the router context has already moved on to.
  const routes = (
    <Routes location={isAdmin ? undefined : location}>
      <Route path="/" element={<Home />} />
      <Route path="/about" element={<About />} />
      <Route path="/products" element={<Products />} />
      <Route path="/products/:slug" element={<Product />} />
      <Route path="/why-us" element={<WhyUs />} />
      <Route path="/process" element={<Process />} />
      <Route path="/global-reach" element={<GlobalReach />} />
      <Route path="/team" element={<Team />} />
      <Route path="/faq" element={<Faq />} />
      <Route path="/contact" element={<Contact />} />
      <Route path="/card" element={<BusinessCard />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms-and-conditions" element={<Terms />} />
      <Route path="/cookie-policy" element={<CookiePolicy />} />
      <Route
        path="/admin/*"
        element={
          <Suspense fallback={<div className="min-h-screen bg-slate-50" />}>
            <AdminRoutes />
          </Suspense>
        }
      />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );

  return (
    <>
      <ScrollBehaviour />
      {isAdmin ? (
        routes
      ) : (
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
          >
            {routes}
          </motion.div>
        </AnimatePresence>
      )}
    </>
  );
}
