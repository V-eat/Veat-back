export interface OrderUser {
    order_id: number;
    user_id: string;
    is_owner?: boolean;
    is_paid?: boolean;
    amount?: number;
}
