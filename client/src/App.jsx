import { Suspense, lazy } from "react";
import { Route, Routes } from "react-router-dom";

import ScrollBehaviour from "./components/ScrollBehaviour.jsx";
import Home from "./pages/Home.jsx";
import Product from "./pages/Product.jsx";
import BusinessCard from "./pages/BusinessCard.jsx";
import NotFound from "./pages/NotFound.jsx";
import PrivacyPolicy from "./pages/legal/PrivacyPolicy.jsx";
import Terms from "./pages/legal/Terms.jsx";
import CookiePolicy from "./pages/legal/CookiePolicy.jsx";

// The admin dashboard is a whole second application that no site visitor ever
// loads. Splitting it out keeps it out of the public bundle entirely.
const AdminRoutes = lazy(() => import("./admin/AdminRoutes.jsx"));

export default function App() {
  return (
    <>
      <ScrollBehaviour />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/products/:slug" element={<Product />} />
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
    </>
  );
}
