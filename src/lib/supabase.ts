
import { createClient } from '@supabase/supabase-js';
import { Space, Profile, SpaceParticipant } from './supabase-types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

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
