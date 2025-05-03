
// Re-export the supabase client from integrations for backward compatibility
import { supabase } from '../integrations/supabase/client';

// Export any helper functions for space messages here if needed
export const fetchSpaceMessages = async (spaceId: string) => {
  return supabase
    .from('space_messages')
    .select(`
      *,
      user:profiles(full_name, username, avatar_url)
    `)
    .eq('space_id', spaceId)
    .order('created_at', { ascending: true });
};

export const fetchMessageById = async (messageId: string) => {
  return supabase
    .from('space_messages')
    .select(`
      *,
      user:profiles(full_name, username, avatar_url)
    `)
    .eq('id', messageId)
    .single();
};

export { supabase };
