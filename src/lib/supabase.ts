import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string;
          email: string;
          google_refresh_token: string | null;
          created_at: string;
        };
        Insert: {
          id: string;
          email: string;
          google_refresh_token?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          google_refresh_token?: string | null;
          created_at?: string;
        };
      };
      email_reminders: {
        Row: {
          id: string;
          user_id: string;
          email_id: string;
          email_subject: string;
          email_sender: string;
          email_snippet: string | null;
          summary: string | null;
          action_items: string[];
          remind_at: string;
          priority_level: number;
          is_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          email_id: string;
          email_subject: string;
          email_sender: string;
          email_snippet?: string | null;
          summary?: string | null;
          action_items?: string[];
          remind_at: string;
          priority_level?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          email_id?: string;
          email_subject?: string;
          email_sender?: string;
          email_snippet?: string | null;
          summary?: string | null;
          action_items?: string[];
          remind_at?: string;
          priority_level?: number;
          is_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
}