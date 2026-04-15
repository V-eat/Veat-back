import { Request, Response } from "express";
import { supabase } from "../db";
import { User } from "../models/userModel";


export const getAllUsers = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .order("user_id");

    if (error) throw error;
    res.json(data);
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  try {
    const { data, error } = await supabase
      .from("users")
      .select("*")
      .eq("user_id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Not found" });
      }
      throw error;
    }
    res.json(data);
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const createUser = async (req: Request, res: Response) => {
  const {
    last_name,
    first_name,
    email,
    phone,
    password,
    language,
    email_notifications,
    sms_notifications,
    isAdmin,
  } = req.body as Partial<User>;

  if (!email || typeof email !== "string" || !password || typeof password !== "string") {
    return res.status(400).json({ message: "'email' and 'password' are required" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .insert([{
        last_name: last_name || null,
        first_name: first_name || null,
        email,
        phone: phone || null,
        password,
        language: language || null,
        email_notifications: email_notifications ?? true,
        sms_notifications: sms_notifications ?? false,
        isAdmin: isAdmin ?? false,
      }])
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "Email already exists" });
      }
      throw error;
    }
    res.status(201).json(data);
  } 
  catch (err: any) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const updateUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  const allowed: Partial<User> = req.body;
  
  // Filter out undefined and user_id
  const updates: any = {};
  for (const [key, value] of Object.entries(allowed)) {
    if (key === "user_id" || value === undefined) continue;
    updates[key] = value;
  }
  
  if (Object.keys(updates).length === 0) {
    return res.status(400).json({ message: "No fields to update" });
  }

  try {
    const { data, error } = await supabase
      .from("users")
      .update(updates)
      .eq("user_id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") {
        return res.status(404).json({ message: "Not found" });
      }
      throw error;
    }
    res.json(data);
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const deleteUser = async (req: Request, res: Response) => {
  const id = Number(req.params.id);
  if (!id) return res.status(400).json({ message: "Invalid id" });

  try {
    const { error } = await supabase
      .from("users")
      .delete()
      .eq("user_id", id);

    if (error) throw error;
    res.status(204).send();
  } 
  catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
