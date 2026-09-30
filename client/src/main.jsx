import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import App from "./App.jsx";
import "./styles/globals.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
      {/* Sets window.va, which lib/analytics.js already dispatches every
          custom event (whatsapp_click, enquiry_submit, coa_download, …) to
          whenever it's present — this is the only wiring those calls were
          ever missing. */}
      <Analytics />
    </BrowserRouter>
  </StrictMode>
);
