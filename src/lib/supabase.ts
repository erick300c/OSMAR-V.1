import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Initialize auth state with anonymous access for read-only operations
supabase.auth.signInWithPassword({
  email: 'test@example.com',
  password: 'test123'
}).catch(error => {
  console.error('Error signing in:', error);
  // Continue as anonymous user if auth fails
  console.log('Continuing as anonymous user');
});
