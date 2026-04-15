export interface OrderItem {
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  specialInstructions?: string;
}

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "preparing"
  | "ready"
  | "completed"
  | "cancelled";

export interface Order {
  id: string;
  user_id: string | null;
  restaurant_id: string;
  items: OrderItem[];
  status: OrderStatus;
  total_amount: number;
  arrival_time: string;
  table_number: number | null;
  is_rushed: boolean;
  special_instructions: string | null;
  table_id?: string | null;
  released_to_restaurant?: boolean;
  created_at: string;
  updated_at: string;
}

export type CreateOrderDto = Omit<Order, "id" | "created_at" | "updated_at" | "status">;
