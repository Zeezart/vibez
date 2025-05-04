
import React from 'react';
import { Button, Box } from '@chakra-ui/react';
import { MessageSquare, X } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerTrigger,
} from "@/components/ui/drawer";
import RealTimeChat from './RealTimeChat';

interface ChatDrawerProps {
  spaceId: string;
}

const ChatDrawer: React.FC<ChatDrawerProps> = ({ spaceId }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
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
          onClick={() => setIsOpen(true)}
          zIndex={5}
          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
        >
          <MessageSquare size={24} />
        </Button>
      )}

      {isOpen && (
        <Box
          position="fixed"
          top={0}
          bottom={0}
          right={0}
          width={{ base: "100%", md: "400px" }}
          bg="white"
          zIndex={10}
          boxShadow="-4px 0 12px rgba(0,0,0,0.1)"
          display="flex"
          flexDirection="column"
        >
          <Box p={4} borderBottom="1px solid" borderColor="gray.200" display="flex" justifyContent="space-between" alignItems="center">
            <Box fontWeight="bold">Space Chat</Box>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setIsOpen(false)}
              p={1}
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
