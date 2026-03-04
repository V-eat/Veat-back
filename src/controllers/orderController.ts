import { Request, Response } from "express";
import { supabaseAdmin } from "../db";
import { CreateOrderDto, OrderStatus } from "../models/orderModel";

export const getUserOrders = async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*, restaurants(id, name, image_url, address)")
      .eq("user_id", req.userId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getRestaurantOrders = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  try {
    // Verify restaurant ownership
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
      .from("orders")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getOrderById = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .eq("id", id)
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ message: "Not found" });
      throw error;
    }

    // Only allow the order owner or restaurant owner to see it
    if (data.user_id !== req.userId) {
      const { data: restaurant } = await supabaseAdmin
        .from("restaurants")
        .select("owner_id")
        .eq("id", data.restaurant_id)
        .single();

      if (restaurant?.owner_id !== req.userId) {
        return res.status(403).json({ message: "Forbidden" });
      }
    }

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const createOrder = async (req: Request, res: Response) => {
  const body = req.body as CreateOrderDto;

  try {
    const { data, error } = await supabaseAdmin
      .from("orders")
      .insert({
        user_id: req.userId,
        restaurant_id: body.restaurant_id,
        items: JSON.parse(JSON.stringify(body.items)),
        total_amount: body.total_amount,
        arrival_time: body.arrival_time,
        table_number: body.table_number ?? null,
        is_rushed: body.is_rushed ?? false,
        special_instructions: body.special_instructions ?? null,
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

export const updateOrderStatus = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body as { status: OrderStatus };

  const validStatuses: OrderStatus[] = [
    "pending", "confirmed", "preparing", "ready", "completed", "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ message: "Invalid status" });
  }

  try {
    // Find the order and verify the restaurant owner can update it
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("restaurant_id, user_id")
      .eq("id", id)
      .single();

    if (!order) return res.status(404).json({ message: "Not found" });

    const { data: restaurant } = await supabaseAdmin
      .from("restaurants")
      .select("owner_id")
      .eq("id", order.restaurant_id)
      .single();

    if (restaurant?.owner_id !== req.userId && order.user_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status, updated_at: new Date().toISOString() })
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

export const cancelOrder = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: order } = await supabaseAdmin
      .from("orders")
      .select("user_id, status")
      .eq("id", id)
      .single();

    if (!order) return res.status(404).json({ message: "Not found" });
    if (order.user_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }
    if (["completed", "cancelled", "ready"].includes(order.status)) {
      return res.status(400).json({ message: "Order cannot be cancelled at this stage" });
    }

    const { data, error } = await supabaseAdmin
      .from("orders")
      .update({ status: "cancelled", updated_at: new Date().toISOString() })
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
