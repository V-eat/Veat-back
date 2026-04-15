import { Request, Response } from "express";
import { supabaseAdmin } from "../db";
import { CreateReviewDto, UpdateReviewDto } from "../models/reviewModel";

export const getRestaurantReviews = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;

  try {
    const { data: reviews, error } = await supabaseAdmin
      .from("reviews")
      .select("*")
      .eq("restaurant_id", restaurantId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    // Fetch profiles for each reviewer
    const userIds = reviews.map((r: any) => r.user_id);
    const { data: profiles } = await supabaseAdmin
      .from("profiles")
      .select("user_id, first_name, last_name, avatar_url")
      .in("user_id", userIds.length ? userIds : ["_none_"]);

    const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

    const result = reviews.map((review: any) => ({
      ...review,
      profiles: profileMap.get(review.user_id) || null,
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const createReview = async (req: Request, res: Response) => {
  const { restaurantId } = req.params;
  const { rating, comment } = req.body as { rating: number; comment?: string };

  if (!rating || rating < 1 || rating > 5) {
    return res.status(400).json({ message: "Rating must be between 1 and 5" });
  }

  try {
    // Check user has a completed order at this restaurant
    // (optional business rule – remove if not needed)
    const { data, error } = await supabaseAdmin
      .from("reviews")
      .insert({
        user_id: req.userId,
        restaurant_id: restaurantId,
        rating,
        comment: comment ?? null,
      })
      .select()
      .single();

    if (error) throw error;

    // Update restaurant rating average
    await updateRestaurantRating(restaurantId);

    res.status(201).json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const updateReview = async (req: Request, res: Response) => {
  const { id } = req.params;
  const { rating, comment } = req.body as UpdateReviewDto;

  try {
    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("user_id, restaurant_id")
      .eq("id", id)
      .single();

    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { data, error } = await supabaseAdmin
      .from("reviews")
      .update({ rating, comment })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;

    await updateRestaurantRating(existing.restaurant_id);

    res.json(data);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

export const deleteReview = async (req: Request, res: Response) => {
  const { id } = req.params;

  try {
    const { data: existing } = await supabaseAdmin
      .from("reviews")
      .select("user_id, restaurant_id")
      .eq("id", id)
      .single();

    if (!existing) return res.status(404).json({ message: "Not found" });
    if (existing.user_id !== req.userId) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const { error } = await supabaseAdmin
      .from("reviews")
      .delete()
      .eq("id", id);

    if (error) throw error;

    await updateRestaurantRating(existing.restaurant_id);

    res.status(204).send();
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Database error" });
  }
};

// Recalculates and persists the restaurant's avg rating and review count
async function updateRestaurantRating(restaurantId: string) {
  const { data: reviews } = await supabaseAdmin
    .from("reviews")
    .select("rating")
    .eq("restaurant_id", restaurantId);

  if (!reviews || reviews.length === 0) {
    await supabaseAdmin
      .from("restaurants")
      .update({ rating: 0, review_count: 0 })
      .eq("id", restaurantId);
    return;
  }

  const avg =
    reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length;

  await supabaseAdmin
    .from("restaurants")
    .update({
      rating: Math.round(avg * 10) / 10,
      review_count: reviews.length,
    })
    .eq("id", restaurantId);
}
