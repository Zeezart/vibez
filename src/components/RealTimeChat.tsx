
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
import { supabase, fetchSpaceMessages, fetchMessageById } from '../lib/supabase';
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
  
  // Scroll to bottom whenever messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
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
      <Box 
        flex="1" 
        overflowY="auto" 
        p={4} 
        className="custom-scrollbar"
        css={{
          '&::-webkit-scrollbar': {
            width: '4px',
          },
          '&::-webkit-scrollbar-track': {
            width: '6px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#9b87f5',
            borderRadius: '24px',
          },
        }}
      >
        <VStack spacing={4} align="stretch">
          {messages.length > 0 ? (
            messages.map((message) => (
              <Box 
                key={message.id}
                alignSelf={message.user_id === user?.id ? 'flex-end' : 'flex-start'}
                maxWidth="80%"
                className="fade-in"
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
                    bg="purple.400"
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
                      boxShadow="0 1px 2px rgba(0,0,0,0.05)"
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
      
      <Box p={4} bg="gray.50">
        <HStack>
          <Input
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            bg="white"
            borderColor="gray.300"
            _focus={{ borderColor: 'purple.400', boxShadow: '0 0 0 1px #9b87f5' }}
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
