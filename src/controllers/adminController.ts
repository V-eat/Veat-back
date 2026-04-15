import { Request, Response } from "express";
import { supabaseAdmin } from "../db";

// ─── Stats ───────────────────────────────────────────────────────────────────

export const getAdminStats = async (_req: Request, res: Response) => {
  try {
    const [usersRes, restaurantsRes, ordersRes] = await Promise.all([
      supabaseAdmin.from("profiles").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("restaurants").select("id", { count: "exact", head: true }),
      supabaseAdmin.from("orders").select("total_amount, status, is_rushed"),
    ]);

    if (ordersRes.error) throw ordersRes.error;

    const orders = ordersRes.data ?? [];
    const completed = orders.filter((o) => o.status === "completed");
    const totalRevenue = completed.reduce((s, o) => s + Number(o.total_amount), 0);
    const rushedCount = completed.filter((o) => o.is_rushed).length;
    const rushedFees = rushedCount * 2.5;
    const platformFees = completed.length * 1.5 + rushedCount * 1;

    res.json({
      totalUsers: usersRes.count ?? 0,
      totalRestaurants: restaurantsRes.count ?? 0,
      totalOrders: orders.length,
      totalRevenue,
      rushedFees,
      platformFees,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

// ─── Users ────────────────────────────────────────────────────────────────────

export const getAdminUsers = async (_req: Request, res: Response) => {
  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    res.json(data ?? []);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const updateUserRole = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { role } = req.body as { role: "client" | "restaurateur" | "admin" };

  const validRoles = ["client", "restaurateur", "admin"];
  if (!validRoles.includes(role)) {
    return res.status(400).json({ message: "Invalid role" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update({ role, updated_at: new Date().toISOString() })
      .eq("user_id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ message: "User not found" });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

// ─── Restaurants ──────────────────────────────────────────────────────────────

export const getAdminRestaurants = async (_req: Request, res: Response) => {
  try {
    const { data: restaurants, error } = await supabaseAdmin
      .from("restaurants")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    if (!restaurants || restaurants.length === 0) {
      return res.json([]);
    }

    // Fetch owner profiles separately (avoids FK dependency)
    const ownerIds = [...new Set(restaurants.map((r) => r.owner_id).filter(Boolean))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name, last_name, email")
      .in("user_id", ownerIds);

    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const enriched = restaurants.map((r) => ({
      ...r,
      profiles: profileMap.get(r.owner_id) ?? null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const approveRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update({
        is_active: true,
        status: "approved",
        rejection_reason: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ message: "Restaurant not found" });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const rejectRestaurant = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { reason } = req.body as { reason: string };

  if (!reason?.trim()) {
    return res.status(400).json({ message: "A rejection reason is required" });
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("restaurants")
      .update({
        is_active: false,
        status: "rejected",
        rejection_reason: reason.trim(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      if (error.code === "PGRST116") return res.status(404).json({ message: "Restaurant not found" });
      throw error;
    }
    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const getAdminOrders = async (_req: Request, res: Response) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!orders || orders.length === 0) return res.json([]);

    // Fetch restaurant names separately
    const restaurantIds = [...new Set(orders.map((o) => o.restaurant_id).filter(Boolean))];
    const { data: restaurants } = await supabaseAdmin
      .from("restaurants")
      .select("id, name")
      .in("id", restaurantIds);

    // Fetch user emails separately
    const userIds = [...new Set(orders.map((o) => o.user_id).filter(Boolean))];
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, email, first_name, last_name")
      .in("user_id", userIds);

    const restaurantMap = new Map((restaurants ?? []).map((r) => [r.id, r]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const enriched = orders.map((o) => ({
      ...o,
      restaurants: restaurantMap.get(o.restaurant_id) ?? null,
      profiles: profileMap.get(o.user_id) ?? null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const getAdminReviews = async (_req: Request, res: Response) => {
  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    if (!reviews || reviews.length === 0) return res.json([]);

    const restaurantIds = [...new Set(reviews.map((r) => r.restaurant_id).filter(Boolean))];
    const userIds = [...new Set(reviews.map((r) => r.user_id).filter(Boolean))];

    const [{ data: restaurants }, { data: profiles }] = await Promise.all([
      supabaseAdmin.from("restaurants").select("id, name").in("id", restaurantIds),
      supabaseAdmin.from("profiles").select("user_id, first_name, last_name").in("user_id", userIds),
    ]);

    const restaurantMap = new Map((restaurants ?? []).map((r) => [r.id, r]));
    const profileMap = new Map((profiles ?? []).map((p) => [p.user_id, p]));

    const enriched = reviews.map((r) => ({
      ...r,
      restaurants: restaurantMap.get(r.restaurant_id) ?? null,
      profiles: profileMap.get(r.user_id) ?? null,
    }));

    res.json(enriched);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const deleteAdminReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { error } = await supabaseAdmin.from("reviews").delete().eq("id", id);
    if (error) throw error;
    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
