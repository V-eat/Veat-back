import { Request, Response, NextFunction } from "express";
import { supabaseAdmin } from "../db";

export const requireAdmin = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const { data, error } = await supabaseAdmin
    .from("profiles")
    .select("role")
    .eq("user_id", req.userId)
    .single();

  if (error || data?.role !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }

  next();
};
