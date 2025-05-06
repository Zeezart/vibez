
import React from 'react';
import { 
  Box, 
  Flex, 
  Button, 
  Heading, 
  IconButton, 
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
  DrawerHeader,
  DrawerBody,
  Avatar,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuDivider,
  Tooltip
} from '@chakra-ui/react';
import { HamburgerIcon, SearchIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import UserSearchModal from './UserSearchModal';

const Navbar: React.FC = () => {
  const { isOpen: isSidebarOpen, onOpen: onSidebarOpen, onClose: onSidebarClose } = useDisclosure();
  const { isOpen: isSearchOpen, onOpen: onSearchOpen, onClose: onSearchClose } = useDisclosure();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <Box bg="white" px={4} boxShadow="sm" position="sticky" top="0" zIndex="sticky">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onSidebarOpen}
          variant="outline"
          aria-label="open menu"
          icon={<HamburgerIcon />}
        />

        <Link to="/">
          <Heading size="md" color="brand.600">Vibez</Heading>
        </Link>

        <Flex alignItems="center">
          {user && (
            <Tooltip label="Search Users" hasArrow placement="bottom">
              <IconButton
                variant="ghost"
                mr={3}
                icon={<SearchIcon />}
                aria-label="Search users"
                onClick={onSearchOpen}
              />
            </Tooltip>
          )}
          
          {user && profile ? (
            <Menu>
              <MenuButton
                as={Button}
                rounded="full"
                variant="link"
                cursor="pointer"
                minW={0}
              >
                <Avatar size="sm" src={profile.avatar_url} name={profile.full_name} />
              </MenuButton>
              <MenuList>
                <MenuItem as={Link} to="/profile">Profile</MenuItem>
                <MenuItem as={Link} to="/spaces">Spaces</MenuItem>
                <MenuDivider />
                <MenuItem onClick={handleLogout}>Log Out</MenuItem>
              </MenuList>
            </Menu>
          ) : (
            <Flex>
              <Button as={Link} to="/login" variant="ghost" mr={3}>
                Log In
              </Button>
              <Button as={Link} to="/signup" colorScheme="purple">
                Sign Up
              </Button>
            </Flex>
          )}
        </Flex>
      </Flex>

      <Drawer isOpen={isSidebarOpen} placement="left" onClose={onSidebarClose}>
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Menu</DrawerHeader>
          <DrawerBody p={0}>
            <Sidebar />
          </DrawerBody>
        </DrawerContent>
      </Drawer>
      
      {/* User Search Modal */}
      <UserSearchModal isOpen={isSearchOpen} onClose={onSearchClose} />
    </Box>
  );
};

export default Navbar;
