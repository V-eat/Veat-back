export interface Order {
    order_id: number;
    restaurant_id: number;
    order_date?: Date;
    total_amount?: number;
    solo_payment?: boolean;
    guests_number?: number;
    status?: string;
}
