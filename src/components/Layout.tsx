
import React from 'react';
import { Box, Flex } from '@chakra-ui/react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';
import { useAuth } from '../context/AuthContext';

interface LayoutProps {
  children: React.ReactNode;
  showSidebar?: boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, showSidebar = true }) => {
  const { user } = useAuth();

  return (
    <Box minH="100vh" bg="gray.50">
      <Navbar />
      <Flex>
        {showSidebar && user && (
          <Box w="250px" display={{ base: 'none', md: 'block' }}>
            <Sidebar />
          </Box>
        )}
        <Box flex="1" p={4} className="fade-in">
          {children}
        </Box>
      </Flex>
    </Box>
  );
};

export default Layout;
