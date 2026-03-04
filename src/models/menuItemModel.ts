export interface MenuItem {
  id: string;
  restaurant_id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  allergens: string[];
  is_available: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateMenuItemDto = Omit<MenuItem, "id" | "created_at" | "updated_at">;

export type UpdateMenuItemDto = Partial<
  Omit<MenuItem, "id" | "restaurant_id" | "created_at" | "updated_at">
>;
