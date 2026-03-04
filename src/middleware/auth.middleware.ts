import { Request, Response, NextFunction } from "express";
import { supabase } from "../db";

// Extend Express Request to carry the authenticated user
declare global {
  namespace Express {
    interface Request {
      userId?: string;
      userEmail?: string;
    }
  }
}

/**
 * Validates the Supabase JWT from the Authorization header.
 * Rejects requests without a valid token.
 */
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    return res.status(401).json({ message: "Authorization token required" });
  }

  const token = authHeader.slice(7);
  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  req.userId = user.id;
  req.userEmail = user.email;
  next();
};

/**
 * Optionally validates the JWT.
 * Attaches user if token is present and valid; continues without user otherwise.
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7);
    const { data: { user } } = await supabase.auth.getUser(token);
    if (user) {
      req.userId = user.id;
      req.userEmail = user.email;
    }
  }
  next();
};
