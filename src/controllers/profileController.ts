import { Request, Response } from "express";
import { supabaseAdmin } from "../db";
import { UpdateProfileDto } from "../models/profileModel";

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", req.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ message: "Profile not found" });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const updateMyProfile = async (req: Request, res: Response) => {
  const updates = req.body as UpdateProfileDto;

  // Prevent changing protected fields
  const { user_id: _uid, id: _id, created_at: _ca, ...safeUpdates } = updates as any;

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ ...safeUpdates, updated_at: new Date().toISOString() })
      .eq("user_id", req.userId)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getMyRole = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("user_id", req.userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.json({ role: "client" });
      throw error;
    }
    res.json({ role: data?.role ?? "client" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
