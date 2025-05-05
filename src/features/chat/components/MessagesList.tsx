
import React, { useRef, useEffect } from 'react';
import {
  Box,
  VStack,
  Text,
} from '@chakra-ui/react';
import { Message } from '../types';
import MessageItem from './MessageItem';

interface MessagesListProps {
  messages: Message[];
  currentUserId?: string;
}

const MessagesList: React.FC<MessagesListProps> = ({ messages, currentUserId }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  return (
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
            <MessageItem 
              key={message.id} 
              message={message} 
              currentUserId={currentUserId} 
            />
          ))
        ) : (
          <Text color="gray.500" textAlign="center" py={4}>
            No messages yet. Be the first to say something!
          </Text>
        )}
        <div ref={messagesEndRef} />
      </VStack>
    </Box>
  );
};

export default MessagesList;
