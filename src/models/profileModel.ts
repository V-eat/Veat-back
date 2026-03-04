export type UserRole = "client" | "restaurateur" | "admin";

export interface NotificationPreferences {
  email_orders: boolean;
  email_promotions: boolean;
  email_news: boolean;
}

export interface ProfileSettings {
  language: "fr" | "en";
  theme: "light" | "dark" | "system";
}

export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  role: UserRole;
  date_of_birth: string | null;
  avatar_url: string | null;
  allergies: string[];
  preferences: string[];
  notification_preferences: NotificationPreferences | null;
  settings: ProfileSettings | null;
  created_at: string;
  updated_at: string;
}

export type UpdateProfileDto = Partial<
  Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">
>;
