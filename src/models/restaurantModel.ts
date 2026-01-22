import { User } from '../models/userModel';

export interface Restaurant {
    restaurant_id: number;
    owner_id: string;
    name: string;
    email: string;
    phone?: string;
    description?: string;
    adresse?: string;
    latitude?: number;
    longitude?: number;
    rating_average?: number;
    cuisine_type?: string;
    is_open?: boolean;
    preparation_time?: number;
    commission_rate?: number;
    stripe_account_id?: string;
    is_onboarded?: boolean;
    created_at?: Date;
    photo_url?: string;
}
