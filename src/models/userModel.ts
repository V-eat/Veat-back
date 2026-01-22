export interface User {
  user_id: number;
  last_name?: string;
  first_name?: string;
  email: string;
  birthdate: Date;
  password: string;
  created_at?: string;
  email_notifications?: boolean;
  sms_notifications?: boolean;
  isAdmin?: boolean;
}
