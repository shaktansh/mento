import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          name: string;
          mode: 'solo' | 'team';
          daily_reminder_time: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          name: string;
          mode?: 'solo' | 'team';
          daily_reminder_time?: string;
        };
        Update: {
          name?: string;
          mode?: 'solo' | 'team';
          daily_reminder_time?: string;
        };
      };
      mood_entries: {
        Row: {
          id: string;
          user_id: string;
          mood: number;
          date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          mood: number;
          date?: string;
        };
        Update: {
          mood?: number;
          date?: string;
        };
      };
      energy_entries: {
        Row: {
          id: string;
          user_id: string;
          energy: number;
          date: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          energy: number;
          date?: string;
        };
        Update: {
          energy?: number;
          date?: string;
        };
      };
      check_ins: {
        Row: {
          id: string;
          user_id: string;
          mood: number;
          energy: number;
          notes: string | null;
          tags: string[];
          created_at: string;
        };
        Insert: {
          user_id: string;
          mood: number;
          energy: number;
          notes?: string;
          tags?: string[];
        };
        Update: {
          mood?: number;
          energy?: number;
          notes?: string;
          tags?: string[];
        };
      };
      journal_entries: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          content: string;
          mood: number;
          tags: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          content: string;
          mood: number;
          tags?: string[];
        };
        Update: {
          title?: string;
          content?: string;
          mood?: number;
          tags?: string[];
        };
      };
    };
  };
};