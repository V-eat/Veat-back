import { Request, Response } from "express";
import { supabaseAdmin } from "../db";
import { UpdateProfileDto } from "../models/profileModel";

const ensureProfileExists = async (userId: string, userEmail?: string) => {
  const { data: existing, error: existingError } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existingError && existingError.code !== "PGRST116") throw existingError;
  if (existing) return;

  const { error: insertError } = await supabaseAdmin.from("profiles").insert({
    user_id: userId,
    first_name: "",
    last_name: "",
    email: userEmail ?? "",
  });

  if (insertError) throw insertError;
};

export const initializeOnSignup = async (req: Request, res: Response) => {
  const { first_name, last_name, role = "client" } = req.body as {
    first_name?: string;
    last_name?: string;
    role?: "client" | "restaurateur" | "admin";
  };

  try {
    const userId = req.userId!;
    const email = req.userEmail ?? "";

    const { data: existingProfile, error: existingProfileError } = await supabaseAdmin
      .from("profiles")
      .select("id")
      .eq("user_id", userId)
      .maybeSingle();

    if (existingProfileError && existingProfileError.code !== "PGRST116") throw existingProfileError;

    if (!existingProfile) {
      const { error: profileError } = await supabaseAdmin.from("profiles").insert({
        user_id: userId,
        first_name: first_name ?? "",
        last_name: last_name ?? "",
        email,
      });
      if (profileError) throw profileError;
    }

    const { error: roleError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role }, { onConflict: "user_id" });

    if (roleError) throw roleError;

    res.status(201).json({ message: "Profile initialized", role });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getMyProfile = async (req: Request, res: Response) => {
  try {
    await ensureProfileExists(req.userId!, req.userEmail);

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
  
  // Extract role if present - it's stored in user_roles table, not profiles
  const { role, user_id: _uid, id: _id, created_at: _ca, ...profileUpdates } = updates as any;

  try {
    await ensureProfileExists(req.userId!, req.userEmail);

    // Update profiles table
    if (Object.keys(profileUpdates).length > 0) {
      const { error: profileError } = await supabaseAdmin
        .from("profiles")
        .update({ ...profileUpdates, updated_at: new Date().toISOString() })
        .eq("user_id", req.userId);

      if (profileError) throw profileError;
    }

    // Update user_roles table if role is provided
    if (role) {
      const { error: roleError } = await supabaseAdmin
        .from("user_roles")
        .upsert(
          { user_id: req.userId, role },
          { onConflict: 'user_id' }
        );

      if (roleError) throw roleError;
    }

    // Return updated profile
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("user_id", req.userId)
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
    const userId = req.userId!;

    const { data, error } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .maybeSingle();

    if (error && error.code !== 'PGRST116') throw error;

    const { data: ownedRestaurant, error: ownerError } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("owner_id", userId)
      .limit(1)
      .maybeSingle();

    if (ownerError && ownerError.code !== 'PGRST116') throw ownerError;

    if (data?.role === "admin") {
      return res.json({ role: "admin" });
    }

    const inferredRole = ownedRestaurant ? "restaurateur" : (data?.role ?? "client");

    const { error: upsertError } = await supabaseAdmin
      .from("user_roles")
      .upsert({ user_id: userId, role: inferredRole }, { onConflict: "user_id" });

    if (upsertError) throw upsertError;

    res.json({ role: inferredRole });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
