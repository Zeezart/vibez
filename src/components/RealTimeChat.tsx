
import React from 'react';
import {
  Box,
  Divider,
} from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import { useChatMessages } from '../features/chat/hooks/useChatMessages';
import MessagesList from '../features/chat/components/MessagesList';
import MessageInput from '../features/chat/components/MessageInput';

interface RealTimeChatProps {
  spaceId: string;
}

const RealTimeChat: React.FC<RealTimeChatProps> = ({ spaceId }) => {
  const { user } = useAuth();
  const { messages } = useChatMessages(spaceId);
  
  return (
    <Box 
      bg="white" 
      borderRadius="md" 
      boxShadow="sm" 
      height="100%" 
      display="flex" 
      flexDirection="column"
    >
      {/* Messages List */}
      <MessagesList 
        messages={messages} 
        currentUserId={user?.id} 
      />
      
      <Divider />
      
      {/* Message Input */}
      <Box p={4} bg="gray.50">
        <MessageInput 
          spaceId={spaceId} 
          userId={user?.id} 
        />
      </Box>
    </Box>
  );
};

export default RealTimeChat;
