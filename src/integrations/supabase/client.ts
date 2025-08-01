
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://yefnkgnkzakzthzlinta.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InllZm5rZ25remFrenRoemxpbnRhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ5ODQ5NzgsImV4cCI6MjA2MDU2MDk3OH0.mwny9yuA3s9Ti5l1JkrlcMlU1UXHKeChZseRZsPiNu0";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);
