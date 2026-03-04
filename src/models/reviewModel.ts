export interface Review {
  id: string;
  user_id: string;
  restaurant_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export type CreateReviewDto = Omit<Review, "id" | "created_at">;

export type UpdateReviewDto = Pick<Review, "rating" | "comment">;
