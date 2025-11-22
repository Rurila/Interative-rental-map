import { createClient } from '@supabase/supabase-js';

let supabaseUrl = '';
let supabaseAnonKey = '';

// 1. Safely try import.meta.env (Vite standard)
try {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    // @ts-ignore
    supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
  }
} catch (e) {
  console.warn('import.meta.env access failed', e);
}

// 2. Fallback to process.env (Node/Vite define plugin)
// This handles cases where import.meta.env is missing or we are in a different build context
if (!supabaseUrl) {
  try {
    // Check if process exists to avoid ReferenceError
    if (typeof process !== 'undefined' && process.env) {
      supabaseUrl = process.env.VITE_SUPABASE_URL || '';
      supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || '';
    }
  } catch (e) {
    console.warn('process.env access failed', e);
  }
}

// Only export the client if keys exist, otherwise export null.
// This allows the App to fallback to LocalStorage if not configured.
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Helper to check connectivity
export const isSupabaseConfigured = () => {
  return !!supabase;
};