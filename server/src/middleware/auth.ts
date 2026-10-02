import type { RequestHandler } from "express";
import { createClient } from "@supabase/supabase-js";
import { env } from "../lib/env.ts";

declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

// Used only to verify access tokens; the server never stores a Supabase session.
const supabase = createClient(env.SUPABASE_URL, env.SUPABASE_PUBLISHABLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Verifies the Supabase access token from `Authorization: Bearer <jwt>` and sets req.userId.
// Every route that touches user data must sit behind this and scope its queries by req.userId.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice("Bearer ".length) : undefined;
  if (!token) {
    res.status(401).json({ error: "Missing bearer token" });
    return;
  }

  // getClaims returns an error for bad signatures/expiry but throws on malformed tokens.
  const userId = await supabase.auth
    .getClaims(token)
    .then(({ data, error }) => (error ? undefined : data?.claims.sub))
    .catch(() => undefined);

  if (!userId) {
    res.status(401).json({ error: "Invalid or expired token" });
    return;
  }

  req.userId = userId;
  next();
};
