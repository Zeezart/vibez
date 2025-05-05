
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
  MenuDivider
} from '@chakra-ui/react';
import { MessageSquare } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';

const Navbar: React.FC = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, profile, signOut } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id?: string }>();

  const handleLogout = () => {
    signOut();
    navigate('/');
  };

  return (
    <Box bg="white" px={4} boxShadow="sm" position="sticky" top="0" zIndex="sticky">
      <Flex h={16} alignItems="center" justifyContent="space-between">
        {/* Mobile Chat Icon - replaces hamburger icon */}
        <IconButton
          display={{ base: 'flex', md: 'none' }}
          onClick={onOpen}
          colorScheme="purple"
          aria-label="open chat"
          icon={<MessageSquare size={20} />}
        />

        <Link to="/">
          <Heading size="md" color="brand.600">SpaceChat</Heading>
        </Link>

        <Flex alignItems="center">
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

      {/* Mobile Chat Drawer */}
      <Drawer isOpen={isOpen} placement="right" onClose={onClose} size="full">
        <DrawerOverlay />
        <DrawerContent>
          <DrawerCloseButton />
          <DrawerHeader borderBottomWidth="1px">Space Chat</DrawerHeader>
          <DrawerBody p={0}>
            {id && <Box height="100%"><ChatDrawerContent spaceId={id} isMobile={true} /></Box>}
            {!id && <Sidebar />}
          </DrawerBody>
        </DrawerContent>
      </Drawer>
    </Box>
  );
};

export default Navbar;
