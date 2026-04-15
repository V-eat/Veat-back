import { Request, Response } from "express";
import { supabaseAdmin } from "../db";

export const getUserFavorites = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .select("*, restaurants(*)")
      .eq("user_id", req.userId);

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const checkFavorite = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  try {
    const { data } = await supabaseAdmin
      .from("favorites")
      .select("id")
      .eq("user_id", req.userId)
      .eq("restaurant_id", restaurantId)
      .maybeSingle();

    res.json({ isFavorite: !!data });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const addFavorite = async (req: Request, res: Response) => {
  const { restaurant_id } = req.body;

  if (!restaurant_id) {
    return res.status(400).json({ message: "restaurant_id is required" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("favorites")
      .insert({ user_id: req.userId, restaurant_id })
      .select()
      .single();

    if (error) {
      if (error.code === "23505") {
        return res.status(409).json({ message: "Already in favorites" });
      }
      throw error;
    }
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const removeFavorite = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  try {
    const { error } = await supabaseAdmin
      .from("favorites")
      .delete()
      .eq("user_id", req.userId)
      .eq("restaurant_id", restaurantId);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
