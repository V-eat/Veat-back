import { Request, Response } from "express";
import { supabaseAdmin } from "../db";
import { CreateMenuItemDto, UpdateMenuItemDto } from "../models/menuItemModel";

export const getMenuItems = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  try {
    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("category")
      .order("name");

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const createMenuItem = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const body = req.body as Omit<CreateMenuItemDto, "restaurant_id">;

  try {
    // Verify ownership
    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", restaurantId)
      .single();

    if (!restaurant) return res.status(404).json({ message: "Restaurant not found" });
    if (restaurant.owner_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
      .insert({ ...body, restaurant_id: restaurantId })
      .select()
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const updateMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;
  const updates = req.body as UpdateMenuItemDto;

  try {
    // Get the menu item to find restaurant owner
    const { data: item } = await supabaseAdmin
      .from("menu_items")
      .select("restaurant_id")
      .eq("id", id)
      .single();

    if (!item) return res.status(404).json({ message: "Not found" });

    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", item.restaurant_id)
      .single();

    if (restaurant?.owner_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("menu_items")
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

export const deleteMenuItem = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: item } = await supabaseAdmin
      .from("menu_items")
      .select("restaurant_id")
      .eq("id", id)
      .single();

    if (!item) return res.status(404).json({ message: "Not found" });

    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", item.restaurant_id)
      .single();

    if (restaurant?.owner_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { error } = await supabaseAdmin
      .from("menu_items")
      .delete()
      .eq("id", id);

    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
