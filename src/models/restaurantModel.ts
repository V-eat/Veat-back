export interface Restaurant {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  cuisine_type: string | null;
  email: string;
  phone: string;
  address: string;
  opening_hours: Record<string, { open: string; close: string; isClosed?: boolean }>;
  preparation_time: number;
  rating: number;
  review_count: number;
  price_range: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateRestaurantDto = Omit<
  Restaurant,
  "id" | "created_at" | "updated_at" | "rating" | "review_count"
>;

export type UpdateRestaurantDto = Partial<
  Omit<Restaurant, "id" | "owner_id" | "created_at" | "updated_at">
>;
