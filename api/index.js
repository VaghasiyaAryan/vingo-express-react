// Vercel serverless entry point. Mirrors server/src/index.js but exports the
// Express app instead of calling app.listen() — Vercel's Node runtime calls
// the exported app directly as a (req, res) handler for every request
// rewritten to it (see vercel.json).
import { reportMissingEnv } from "../server/src/env.js";
import { createApp } from "../server/src/app.js";

reportMissingEnv();

export default createApp();
