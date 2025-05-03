
import React from 'react';
import { Box, Flex, useDisclosure, Drawer, DrawerOverlay, DrawerContent, DrawerCloseButton, IconButton } from '@chakra-ui/react';
import { Menu } from 'lucide-react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Flex position="relative">
        {showSidebar && user && (
          <>
            {/* Desktop Sidebar */}
            <Box 
              w="250px" 
              display={{ base: 'none', md: 'block' }}
              position="fixed"
              top="64px"
              bottom="0"
              left="0"
              zIndex="10"
            >
              <Sidebar />
            </Box>
            
            {/* Mobile Sidebar Trigger */}
            <IconButton
              aria-label="Open menu"
              icon={<Menu size={24} />}
              display={{ base: 'flex', md: 'none' }}
              position="fixed"
              bottom="20px"
              left="20px"
              zIndex="20"
              colorScheme="purple"
              borderRadius="full"
              boxShadow="lg"
              onClick={onOpen}
            />
            
            {/* Mobile Sidebar Drawer */}
            <Drawer isOpen={isOpen} placement="left" onClose={onClose}>
              <DrawerOverlay />
              <DrawerContent>
                <DrawerCloseButton />
                <Box pt="40px">
                  <Sidebar />
                </Box>
              </DrawerContent>
            </Drawer>
          </>
        )}
        
        {/* Main Content */}
        <Box 
          flex="1" 
          p={4} 
          className="fade-in"
          ml={{ base: 0, md: showSidebar && user ? '250px' : 0 }}
          w={{ base: "100%", md: showSidebar && user ? "calc(100% - 250px)" : "100%" }}
          transition="margin-left 0.3s, width 0.3s"
        >
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
