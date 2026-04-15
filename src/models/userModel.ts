export interface User {
  user_id: number;
  last_name?: string | null;
  first_name?: string | null;
  email: string;
  phone?: string | null;
  password: string;
  language?: string | null;
  created_at?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  isAdmin?: boolean;
}
