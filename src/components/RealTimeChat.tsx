
import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Avatar,
  Flex,
  Divider,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

interface Message {
  id: string;
  user_id: string;
  space_id: string;
  text: string;
  created_at: string;
  user: {
    full_name: string;
    username: string;
    avatar_url: string | null;
  };
}

interface RealTimeChatProps {
  spaceId: string;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({ spaceId }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const { user, profile } = useAuth();
  const toast = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Fetch messages on component mount
  useEffect(() => {
    fetchMessages();
    
    // Set up real-time subscription
    const channel = supabase
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
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId]);
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  const fetchMessages = async () => {
    try {
      const { data, error } = await supabase
        .from('space_messages')
        .select(`
          *,
          user:profiles(full_name, username, avatar_url)
        `)
        .eq('space_id', spaceId)
        .order('created_at', { ascending: true })
        .limit(100);
        
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
      const { data, error } = await supabase
        .from('space_messages')
        .select(`
          *,
          user:profiles(full_name, username, avatar_url)
        `)
        .eq('id', messageId)
        .single();
        
      if (error) throw error;
      
      if (data) {
        setMessages(prev => [...prev, data as unknown as Message]);
      }
    } catch (error) {
      console.error('Error fetching single message:', error);
    }
  };
  
  const sendMessage = async () => {
    if (!user || !newMessage.trim()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('space_messages')
        .insert({
          space_id: spaceId,
          user_id: user.id,
          text: newMessage.trim(),
        });
        
      if (error) throw error;
      
      setNewMessage('');
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send message',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Box 
      bg="white" 
      borderRadius="md" 
      boxShadow="sm" 
      height="100%" 
      display="flex" 
      flexDirection="column"
    >
      <Box flex="1" overflowY="auto" p={4}>
        <VStack spacing={4} align="stretch">
          {messages.length > 0 ? (
            messages.map((message) => (
              <Box 
                key={message.id}
                alignSelf={message.user_id === user?.id ? 'flex-end' : 'flex-start'}
                maxWidth="80%"
              >
                <HStack 
                  spacing={2} 
                  align="start"
                  flexDirection={message.user_id === user?.id ? 'row-reverse' : 'row'}
                >
                  <Avatar 
                    size="sm" 
                    name={message.user.full_name} 
                    src={message.user.avatar_url || undefined}
                  />
                  <Box>
                    <HStack 
                      justifyContent={message.user_id === user?.id ? 'flex-end' : 'flex-start'}
                      spacing={1}
                    >
                      <Text fontSize="xs" color="gray.500">
                        {formatMessageTime(message.created_at)}
                      </Text>
                      <Text fontWeight="bold" fontSize="sm">
                        {message.user.full_name}
                      </Text>
                    </HStack>
                    <Box 
                      bg={message.user_id === user?.id ? 'purple.100' : 'gray.100'}
                      p={3}
                      borderRadius="lg"
                    >
                      <Text>{message.text}</Text>
                    </Box>
                  </Box>
                </HStack>
              </Box>
            ))
          ) : (
            <Text color="gray.500" textAlign="center" py={4}>
              No messages yet. Be the first to say something!
            </Text>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      </Box>
      
      <Divider />
      
      <Box p={4}>
        <HStack>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          />
          <Button 
            colorScheme="purple" 
            onClick={sendMessage} 
            isLoading={loading}
            isDisabled={!newMessage.trim()}
          >
            Send
          </Button>
        </HStack>
      </Box>
    </Box>
  );
};

export default RealTimeChat;
