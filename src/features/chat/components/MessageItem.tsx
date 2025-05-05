
import React from 'react';
import {
  Box,
  HStack,
  Text,
  Avatar,
} from '@chakra-ui/react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  currentUserId?: string;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, currentUserId }) => {
  const isCurrentUser = message.user_id === currentUserId;
  
  const formatMessageTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };
  
  return (
    <Box 
      key={message.id}
      alignSelf={isCurrentUser ? 'flex-end' : 'flex-start'}
      maxWidth="80%"
      className="fade-in"
    >
      <HStack 
        spacing={2} 
        align="start"
        flexDirection={isCurrentUser ? 'row-reverse' : 'row'}
      >
        <Avatar 
          size="sm" 
          name={message.user.full_name} 
          src={message.user.avatar_url || undefined}
          bg="purple.400"
        />
        <Box>
          <HStack 
            justifyContent={isCurrentUser ? 'flex-end' : 'flex-start'}
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
            bg={isCurrentUser ? 'purple.100' : 'gray.100'}
            p={3}
            borderRadius="lg"
            boxShadow="0 1px 2px rgba(0,0,0,0.05)"
          >
            <Text>{message.text}</Text>
          </Box>
        </Box>
      </HStack>
    </Box>
  );
};

export default MessageItem;
