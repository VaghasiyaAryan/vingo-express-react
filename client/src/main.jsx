import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { MotionConfig } from "framer-motion";
import App from "./App.jsx";
import "./styles/globals.css";

// reducedMotion="user": visitors who turned on "reduce motion" in their phone
// or OS settings get framer-motion's fades without the movement — the same
// courtesy globals.css already gives the CSS animations.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <MotionConfig reducedMotion="user">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </MotionConfig>
  </StrictMode>
);
