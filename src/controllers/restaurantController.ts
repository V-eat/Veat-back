import { Request, Response } from "express";
import { supabaseAdmin } from "../db";
import { CreateRestaurantDto, UpdateRestaurantDto } from "../models/restaurantModel";

export const getRestaurants = async (req: Request, res: Response) => {
  try {
    let query = supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("is_active", true)
      .order("rating", { ascending: false });

    if (req.query.cuisine_type) {
      query = query.eq("cuisine_type", req.query.cuisine_type as string);
    }
    if (req.query.price_range) {
      query = query.eq("price_range", Number(req.query.price_range));
    }
    if (req.query.search) {
      query = query.ilike("name", `%${req.query.search}%`);
    }

    const { data, error } = await query;
    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getRestaurantById = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ message: "Not found" });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getRestaurantsByOwner = async (req: Request, res: Response) => {
  const ownerId = req.params.ownerId || req.userId;
  try {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .eq("owner_id", ownerId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const createRestaurant = async (req: Request, res: Response) => {
  const body = req.body as CreateRestaurantDto;
  const owner_id = req.userId!;

  try {
    // Prevent duplicate restaurants per owner
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("id")
      .eq("owner_id", owner_id)
      .maybeSingle();

    if (existing) {
      return res.status(409).json({ message: "You already have a restaurant registered" });
    }

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .insert({
        ...body,
        owner_id,
        rating: 0,
        review_count: 0,
        is_active: false,
        status: "pending",
      })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const updateRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as UpdateRestaurantDto;

  try {
    // Verify ownership
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.owner_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update({ ...updates, updated_at: new Date().toISOString() })
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

export const deleteRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: existing } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", id)
      .single();

    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.owner_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { error } = await supabaseAdmin
      .from("restaurants")
      .update({ is_active: false })
      .eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
