
import { createClient } from '@supabase/supabase-js';
import { Space, Profile, SpaceParticipant } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Check if necessary environment variables are available
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set.');
}

export const supabase = createClient<{
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
