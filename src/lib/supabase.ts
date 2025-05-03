
// Re-export the supabase client from integrations for backward compatibility
import { supabase } from '../integrations/supabase/client';

// Create stored procedures in Supabase to handle space messages queries
const setupMessageFunctions = async () => {
  const { error: createGetMessagesError } = await supabase.rpc('create_get_messages_function');
  if (createGetMessagesError) {
    console.error('Error creating get_space_messages function:', createGetMessagesError);
  }

  const { error: createGetMessageError } = await supabase.rpc('create_get_message_function');
  if (createGetMessageError) {
    console.error('Error creating get_message_by_id function:', createGetMessageError);
  }
};

// Initialize functions when imported (will only run once)
setupMessageFunctions().catch(console.error);

export { supabase };
