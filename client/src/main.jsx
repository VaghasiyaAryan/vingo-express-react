import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { LazyMotion, MotionConfig, domAnimation } from "framer-motion";
import App from "./App.jsx";
import "./styles/globals.css";

// LazyMotion + `m` components (instead of `motion`) ship only the animation
// features this site uses — fades, slides, in-view reveals and exit
// animations — not drag, layout animations and the rest. `strict` makes any
// stray `motion.*` throw in development rather than silently re-adding them.
//
// reducedMotion="user": visitors who turned on "reduce motion" in their phone
// or OS settings get framer-motion's fades without the movement — the same
// courtesy globals.css already gives the CSS animations.
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </MotionConfig>
    </LazyMotion>
  </StrictMode>
);
