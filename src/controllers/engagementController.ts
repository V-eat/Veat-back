import { Request, Response } from "express";
import { supabaseAdmin } from "../db";

type CompletedOrder = {
  id: string;
  restaurant_id: string;
  total_amount: number;
  created_at: string;
  is_rushed: boolean | null;
};

const GLOBAL_TIER_THRESHOLDS = [
  { name: "Bronze", minPoints: 0 },
  { name: "Silver", minPoints: 600 },
  { name: "Gold", minPoints: 1400 },
  { name: "Platinum", minPoints: 2600 },
];

const RUSH_BONUS = 20;
const LOYALTY_POINT_VALUE_EUR = 0.1;

function resolveTier(points: number) {
  let active = GLOBAL_TIER_THRESHOLDS[0];
  for (const tier of GLOBAL_TIER_THRESHOLDS) {
    if (points >= tier.minPoints) active = tier;
  }
  const next = GLOBAL_TIER_THRESHOLDS.find((tier) => tier.minPoints > active.minPoints) ?? null;
  return {
    currentTier: active.name,
    nextTier: next?.name ?? null,
    pointsToNextTier: next ? Math.max(0, next.minPoints - points) : 0,
  };
}

export const getLoyaltySummary = async (req: Request, res: Response) => {
  try {
    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("id, restaurant_id, total_amount, created_at, is_rushed")
      .eq("user_id", req.userId)
      .eq("status", "completed");

    if (error) throw error;

    const completedOrders = (orders ?? []) as CompletedOrder[];
    const byRestaurant = new Map<string, { ordersCount: number; totalSpent: number; points: number }>();

    let globalSpent = 0;

    for (const order of completedOrders) {
      const orderSpent = Number(order.total_amount) || 0;
      const points = Math.floor(orderSpent / 2) + (order.is_rushed ? RUSH_BONUS : 0);

      globalSpent += orderSpent;
      const current = byRestaurant.get(order.restaurant_id) ?? { ordersCount: 0, totalSpent: 0, points: 0 };
      current.ordersCount += 1;
      current.totalSpent += orderSpent;
      current.points += points;
      byRestaurant.set(order.restaurant_id, current);
    }

    const restaurantIds = [...byRestaurant.keys()];
    const { data: restaurants } = await supabaseAdmin
      .from("restaurants")
      .select("id, name, image_url")
      .in("id", restaurantIds.length ? restaurantIds : ["_none_"]);

    const restaurantMap = new Map((restaurants ?? []).map((r: any) => [r.id, r]));
    const perRestaurant = restaurantIds
      .map((restaurantId) => {
        const metrics = byRestaurant.get(restaurantId)!;
        const restaurant = restaurantMap.get(restaurantId);
        return {
          restaurant_id: restaurantId,
          restaurant_name: restaurant?.name ?? "Restaurant",
          restaurant_image_url: restaurant?.image_url ?? null,
          orders_count: metrics.ordersCount,
          total_spent: Number(metrics.totalSpent.toFixed(2)),
          points: metrics.points,
        };
      })
      .sort((a, b) => b.points - a.points);

    const { data: ledgerRows, error: ledgerError } = await supabaseAdmin
      .from("loyalty_transactions")
      .select("points")
      .eq("user_id", req.userId);
    if (ledgerError) throw ledgerError;

    const globalPoints = (ledgerRows ?? []).reduce((sum: number, row: any) => sum + Number(row.points || 0), 0);
    const tierInfo = resolveTier(globalPoints);

    res.json({
      global: {
        points: globalPoints,
        total_spent: Number(globalSpent.toFixed(2)),
        completed_orders_count: completedOrders.length,
        ...tierInfo,
      },
      restaurants: perRestaurant,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getRecommendations = async (req: Request, res: Response) => {
  try {
    const [{ data: orders }, { data: favorites }, { data: restaurants }, { data: menuItems }] = await Promise.all([
      supabaseAdmin
        .from("orders")
        .select("restaurant_id, total_amount, items, created_at")
        .eq("user_id", req.userId)
        .eq("status", "completed"),
      supabaseAdmin.from("favorites").select("restaurant_id").eq("user_id", req.userId),
      supabaseAdmin
        .from("restaurants")
        .select("id, name, cuisine_type, rating, review_count, image_url, is_active")
        .eq("is_active", true),
      supabaseAdmin.from("menu_items").select("id, restaurant_id, name, category, price, is_available").eq("is_available", true),
    ]);

    const completedOrders = orders ?? [];
    const favoriteRestaurantIds = new Set((favorites ?? []).map((f: any) => f.restaurant_id));
    const orderedRestaurantIds = new Set(completedOrders.map((o: any) => o.restaurant_id));

    const cuisineAffinity = new Map<string, number>();
    for (const order of completedOrders) {
      const restaurant = (restaurants ?? []).find((r: any) => r.id === order.restaurant_id);
      if (!restaurant?.cuisine_type) continue;
      cuisineAffinity.set(
        restaurant.cuisine_type,
        (cuisineAffinity.get(restaurant.cuisine_type) ?? 0) + 1
      );
    }
    const favoriteCuisines = [...cuisineAffinity.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([c]) => c);

    const candidateRestaurants = (restaurants ?? [])
      .filter((r: any) => !orderedRestaurantIds.has(r.id))
      .map((r: any) => {
        let score = Number(r.rating ?? 0) * 12 + Number(r.review_count ?? 0) * 0.2;
        if (favoriteRestaurantIds.has(r.id)) score += 12;
        if (r.cuisine_type && favoriteCuisines.includes(r.cuisine_type)) score += 18;
        return {
          id: r.id,
          name: r.name,
          cuisine_type: r.cuisine_type,
          rating: r.rating,
          review_count: r.review_count,
          image_url: r.image_url,
          score: Number(score.toFixed(2)),
          reason:
            r.cuisine_type && favoriteCuisines.includes(r.cuisine_type)
              ? "Cuisine que vous commandez souvent"
              : "Bien note par les clients",
        };
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 6);

    const itemFrequency = new Map<string, { name: string; count: number }>();
    for (const order of completedOrders) {
      for (const item of order.items ?? []) {
        const key = item?.name ?? "";
        if (!key) continue;
        const existing = itemFrequency.get(key) ?? { name: key, count: 0 };
        existing.count += Number(item?.quantity ?? 1);
        itemFrequency.set(key, existing);
      }
    }

    const favoriteItemNames = [...itemFrequency.values()]
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)
      .map((i) => i.name.toLowerCase());

    const recommendedItems = (menuItems ?? [])
      .filter((item: any) => {
        const lower = String(item.name ?? "").toLowerCase();
        return favoriteItemNames.some((f) => lower.includes(f.split(" ")[0]));
      })
      .slice(0, 8)
      .map((item: any) => ({
        id: item.id,
        restaurant_id: item.restaurant_id,
        name: item.name,
        category: item.category,
        price: item.price,
        reason: "Proche de vos plats favoris",
      }));

    res.json({
      restaurants: candidateRestaurants,
      menu_items: recommendedItems,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const getDynamicPromotions = async (req: Request, res: Response) => {
  try {
    const nowIso = new Date().toISOString();

    const [{ data: favorites, error: favoritesError }, { data: promotions, error: promoError }] = await Promise.all([
      supabaseAdmin.from("favorites").select("restaurant_id").eq("user_id", req.userId),
      supabaseAdmin
        .from("promo_campaigns")
        .select("*")
        .eq("is_active", true)
        .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
        .gte("expires_at", nowIso)
        .order("expires_at", { ascending: true }),
    ]);

    if (favoritesError) throw favoritesError;
    if (promoError) throw promoError;

    const favoriteRestaurantIds = new Set((favorites ?? []).map((f: any) => f.restaurant_id));

    // Keep only global campaigns + restaurant campaigns related to user's favorites.
    const visiblePromotions = (promotions ?? [])
      .filter((promo: any) => {
        if (promo.scope === "global") return true;
        if (promo.scope === "restaurant" && promo.restaurant_id) {
          return favoriteRestaurantIds.has(promo.restaurant_id);
        }
        return false;
      })
      .slice(0, 6);

    res.json(visiblePromotions);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const validatePromotionCode = async (req: Request, res: Response) => {
  const { code, restaurantId, subtotal, maxPlatformDiscount } = req.body as {
    code?: string;
    restaurantId?: string;
    subtotal?: number;
    maxPlatformDiscount?: number;
  };

  if (!code?.trim() || !restaurantId || !subtotal || subtotal <= 0) {
    return res.status(400).json({ message: "code, restaurantId and subtotal are required" });
  }

  try {
    const nowIso = new Date().toISOString();
    const normalizedCode = code.trim().toUpperCase();

    const { data: promo, error } = await supabaseAdmin
      .from("promo_campaigns")
      .select("*")
      .eq("code", normalizedCode)
      .eq("is_active", true)
      .or(`starts_at.is.null,starts_at.lte.${nowIso}`)
      .gte("expires_at", nowIso)
      .maybeSingle();

    if (error) throw error;
    if (!promo) return res.status(404).json({ message: "Code promo invalide ou expiré" });

    if (promo.scope === "restaurant" && promo.restaurant_id !== restaurantId) {
      return res.status(400).json({ message: "Ce code ne s'applique pas à ce restaurant" });
    }

    const minOrder = Number(promo.min_order_amount ?? 0);
    if (minOrder > 0 && Number(subtotal) < minOrder) {
      return res.status(400).json({ message: `Commande minimum ${minOrder.toFixed(2)} €` });
    }

    const alreadyUsed = await supabaseAdmin
      .from("promotion_redemptions")
      .select("id")
      .eq("promotion_id", promo.id)
      .eq("user_id", req.userId)
      .maybeSingle();

    if (!alreadyUsed.error && alreadyUsed.data) {
      return res.status(400).json({ message: "Code déjà utilisé" });
    }

    const discountPercent = Number(promo.discount_percent);
    const rawDiscountAmount = Number(((Number(subtotal) * discountPercent) / 100).toFixed(2));
    const platformCap = Math.max(0, Number(maxPlatformDiscount ?? 0));
    const discountAmount = Number(Math.min(rawDiscountAmount, platformCap).toFixed(2));

    res.json({
      promotion: promo,
      discountAmount,
      rawDiscountAmount,
      cappedByPlatform: discountAmount < rawDiscountAmount,
      discountedSubtotal: Number((Number(subtotal) - discountAmount).toFixed(2)),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const validateLoyaltyUsage = async (req: Request, res: Response) => {
  const { pointsToUse, maxPlatformDiscount } = req.body as {
    pointsToUse?: number;
    maxPlatformDiscount?: number;
  };

  if (!pointsToUse || pointsToUse <= 0) {
    return res.status(400).json({ message: "pointsToUse must be > 0" });
  }

  try {
    const { data: ledgerRows, error } = await supabaseAdmin
      .from("loyalty_transactions")
      .select("points")
      .eq("user_id", req.userId);
    if (error) throw error;
    const availablePoints = (ledgerRows ?? []).reduce((sum: number, row: any) => sum + Number(row.points || 0), 0);

    const platformCap = Math.max(0, Number(maxPlatformDiscount ?? 0));
    const requestedPoints = Math.floor(pointsToUse);
    const maxPointsByPlatform = Math.floor(platformCap / LOYALTY_POINT_VALUE_EUR);
    const pointsApplied = Math.max(0, Math.min(requestedPoints, availablePoints, maxPointsByPlatform));
    const discountAmount = Number((pointsApplied * LOYALTY_POINT_VALUE_EUR).toFixed(2));

    res.json({
      availablePoints,
      requestedPoints,
      pointsApplied,
      pointValueEur: LOYALTY_POINT_VALUE_EUR,
      discountAmount,
      cappedByPlatform: pointsApplied < requestedPoints && pointsApplied === maxPointsByPlatform,
      remainingPoints: Math.max(0, availablePoints - pointsApplied),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};
