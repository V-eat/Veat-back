export interface Profile {
  id: string;
  user_id: string;
  first_name: string;
  last_name: string;
  email: string;
  date_of_birth: string | null;
  avatar_url: string | null;
  allergies: string[];
  preferences: string[];
  created_at: string;
  updated_at: string;
}

export type UpdateProfileDto = Partial<
  Omit<Profile, "id" | "user_id" | "created_at" | "updated_at">
>;
