export interface Dish {
    dish_id: number;
    restaurant_id: number;
    name: string;
    description?: string;
    allergens?: string;
    price: number;
    photo_url?: string;
    is_available?: boolean;
}
