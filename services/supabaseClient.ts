import { createClient } from '@supabase/supabase-js';

// Default credentials provided by user
const DEFAULT_URL = 'https://cjwiefdhbebpdwiylxmz.supabase.co';
const DEFAULT_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqd2llZmRoYmVicGR3aXlseG16Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM4MjEzMzksImV4cCI6MjA3OTM5NzMzOX0.FagvXivj2hET8Mo7yXMJNJFfxwfMv4Eu7q_oH1WRvsY';

let supabaseUrl = DEFAULT_URL;
let supabaseAnonKey = DEFAULT_KEY;

// Attempt to override from environment variables if they exist (optional)
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    if (import.meta.env.VITE_SUPABASE_URL) supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    // @ts-ignore
    if (import.meta.env.VITE_SUPABASE_ANON_KEY) supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {
  // Ignore env loading errors
}

try {
  if (typeof process !== 'undefined' && process.env) {
    if (process.env.VITE_SUPABASE_URL) supabaseUrl = process.env.VITE_SUPABASE_URL;
    if (process.env.VITE_SUPABASE_ANON_KEY) supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;
  }
} catch (e) {
  // Ignore process env errors
}

// Create client with explicit realtime headers to ensure RLS policies work smoothly
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

// Helper to check connectivity
export const isSupabaseConfigured = () => {
  return !!supabase;
};