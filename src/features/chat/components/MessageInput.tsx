
import React, { useState } from 'react';
import {
  HStack,
  Input,
  Button,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../../../integrations/supabase/client';

interface MessageInputProps {
  spaceId: string;
  userId?: string;
}

const MessageInput: React.FC<MessageInputProps> = ({ spaceId, userId }) => {
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const toast = useToast();

  const sendMessage = async () => {
    if (!userId || !newMessage.trim()) return;
    
    setLoading(true);
    
    try {
      const { error } = await supabase
        .from('space_messages')
        .insert({
          space_id: spaceId,
          user_id: userId,
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
  
  return (
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
  );
};

export default MessageInput;
