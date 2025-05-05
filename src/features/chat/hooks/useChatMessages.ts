
import { useState, useEffect } from 'react';
import { useToast } from '@chakra-ui/react';
import { supabase, fetchSpaceMessages, fetchMessageById } from '../../../lib/supabase';
import { Message } from '../types';

export const useChatMessages = (spaceId: string) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const toast = useToast();
  
  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription for new messages
    const messagesChannel = supabase
      .channel('public:space_messages')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'space_messages',
          filter: `space_id=eq.${spaceId}`
        },
        (payload) => {
          // Fetch the complete message with user data
          fetchMessage(payload.new.id);
        }
      )
      .subscribe();
    
    // Set up real-time subscription for space status changes
    const spacesChannel = supabase
      .channel('public:spaces')
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'spaces',
          filter: `id=eq.${spaceId}`
        },
        (payload) => {
          if (payload.new && payload.new.status === 'ended') {
            toast({
              title: "Space has ended",
              description: "The host has ended this space",
              status: "info",
              duration: 5000,
              isClosable: true,
            });
          }
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesChannel);
      supabase.removeChannel(spacesChannel);
    };
  }, [spaceId, toast]);
  
  const fetchMessages = async () => {
    try {
      const { data, error } = await fetchSpaceMessages(spaceId);
      
      if (error) throw error;
      
      if (data) {
        setMessages(data as unknown as Message[]);
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };
  
  const fetchMessage = async (messageId: string) => {
    try {
      const { data, error } = await fetchMessageById(messageId);
      
      if (error) throw error;
      
      if (data) {
        setMessages(prev => [...prev, data as unknown as Message]);
      }
    } catch (error) {
      console.error('Error fetching single message:', error);
    }
  };
  
  return {
    messages
  };
};
