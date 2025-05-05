
import React from 'react';
import { Button, Box, useDisclosure } from '@chakra-ui/react';
import { MessageSquare, X } from 'lucide-react';
import RealTimeChat from './RealTimeChat';
import { useIsMobile } from '../hooks/use-mobile';

interface ChatDrawerProps {
  spaceId: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ spaceId }) => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const isMobile = useIsMobile();
  
  return (
    <>
      {/* Chat Button - shown when drawer is closed */}
      {!isOpen && (
        <Button
          position="fixed"
          bottom="20px"
          right="20px"
          colorScheme="purple"
          borderRadius="full"
          width="50px"
          height="50px"
          p={0}
          onClick={onOpen}
          zIndex={5}
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
          aria-label="Open chat"
        >
          <MessageSquare size={24} />
        </Button>
      )}

      {/* Chat Drawer - shown when open */}
      {isOpen && (
        <Box
          position="fixed"
          top="4rem"
          bottom={0}
          right={0}
          width={{ base: "100%", md: "400px" }}
          bg="white"
          zIndex={10}
          boxShadow="-4px 0 12px rgba(0,0,0,0.1)"
          display="flex"
          flexDirection="column"
          transition="transform 0.3s ease-in-out"
          className="glass-effect"
        >
          <Box p={4} borderBottom="1px solid" borderColor="gray.200" display="flex" justifyContent="space-between" alignItems="center">
            <Box fontWeight="bold">Space Chat</Box>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              p={1}
              aria-label="Close chat"
            >
              <X size={20} />
            </Button>
          </Box>
          <Box flex="1" display="flex" overflow="hidden" p={0}>
            <RealTimeChat spaceId={spaceId} />
          </Box>
        </Box>
      )}
    </>
  );
};

export default ChatDrawer;
