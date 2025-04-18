
import { createClient } from '@supabase/supabase-js';
import { Space, Profile, SpaceParticipant } from './supabase-types';

// Get Supabase environment variables or use empty strings as fallbacks
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if necessary environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

// Create a dummy client if environment variables are missing
// This prevents the app from crashing but won't actually connect to Supabase
const createSupabaseClient = () => {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Missing Supabase configuration');
    }
    
    return createClient<{
      public: {
        Tables: {
          spaces: {
            Row: Space;
          };
          profiles: {
            Row: Profile;
          };
          space_participants: {
            Row: SpaceParticipant;
          };
        };
      };
    }>(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    console.error('Failed to create Supabase client:', error);
    
    // Return a mock client that won't throw errors but won't work
    // This allows the app to render without crashing
    return {
      auth: {
        getSession: async () => ({ data: { session: null } }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: async () => ({ error: new Error('Supabase not configured') }),
        signUp: async () => ({ data: { user: null }, error: new Error('Supabase not configured') }),
        signOut: async () => ({ error: null }),
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            single: async () => ({ data: null, error: new Error('Supabase not configured') }),
          }),
        }),
        insert: () => ({ error: new Error('Supabase not configured') }),
      }),
    } as any;
  }
};

export const supabase = createSupabaseClient();
