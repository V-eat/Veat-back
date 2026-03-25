import { Request, Response } from "express";
import { supabaseAdmin } from "../db";

function generateJoinCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

export const createTable = async (req: Request, res: Response) => {
  const { restaurant_id, table_number } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ message: "restaurant_id is required" });
  }

  try {
    let join_code = generateJoinCode();
    // Ensure uniqueness
    let attempts = 0;
    while (attempts < 5) {
      const { data: existing } = await supabaseAdmin
        .from("virtual_tables")
        .select("id")
        .eq("join_code", join_code)
        .maybeSingle();
      if (!existing) break;
      join_code = generateJoinCode();
      attempts++;
    }

    const { data: table, error } = await supabaseAdmin
      .from("virtual_tables")
      .insert({
        restaurant_id,
        host_user_id: req.userId,
        join_code,
        table_number: table_number ?? null,
        status: "open",
      })
      .select()
      .single();

    if (error) throw error;

    // Host automatically joins
    await supabaseAdmin
      .from("table_members")
      .insert({ table_id: table.id, user_id: req.userId });

    res.status(201).json(table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const joinTable = async (req: Request, res: Response) => {
  const { join_code } = req.body;

  if (!join_code) {
    return res.status(400).json({ message: "join_code is required" });
  }

  try {
    const { data: table, error } = await supabaseAdmin
      .from("virtual_tables")
      .select("*")
      .eq("join_code", join_code.toUpperCase())
      .eq("status", "open")
      .single();

    if (error || !table) {
      return res.status(404).json({ message: "Table not found or already closed" });
    }

    // Add member (ignore if already member)
    await supabaseAdmin
      .from("table_members")
      .upsert({ table_id: table.id, user_id: req.userId }, { onConflict: "table_id,user_id" });

    res.json(table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getTable = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: table, error } = await supabaseAdmin
      .from("virtual_tables")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !table) {
      return res.status(404).json({ message: "Table not found" });
    }

    // Get members with profile info
    const { data: members } = await supabaseAdmin
      .from("table_members")
      .select("*, profiles(first_name, last_name)")
      .eq("table_id", id);

    // Get orders for this table
    const { data: orders } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("table_id", id)
      .order("created_at", { ascending: true });

    res.json({ ...table, members: members ?? [], orders: orders ?? [] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const closeTable = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: table } = await supabaseAdmin
      .from("virtual_tables")
      .select("host_user_id")
      .eq("id", id)
      .single();

    if (!table) return res.status(404).json({ message: "Not found" });
    if (table.host_user_id !== req.userId) {
      return res.status(403).json({ message: "Only the host can close the table" });
    }

    const { data, error } = await supabaseAdmin
      .from("virtual_tables")
      .update({ status: "closed" })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const leaveTable = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from("table_members")
      .delete()
      .eq("table_id", id)
      .eq("user_id", req.userId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getTableByCode = async (req: Request, res: Response) => {
  const { code } = req.params;

  try {
    const { data: table, error } = await supabaseAdmin
      .from("virtual_tables")
      .select("*, virtual_table_members:table_members(user_id, profiles(first_name, last_name))")
      .eq("join_code", code.toUpperCase())
      .eq("status", "open")
      .single();

    if (error || !table) {
      return res.status(404).json({ message: "Table not found or closed" });
    }

    res.json(table);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
