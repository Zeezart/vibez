
import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Flex, 
  Avatar, 
  Icon,
  Button,
  Divider,
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AddIcon, CalendarIcon, SearchIcon, StarIcon, SettingsIcon } from '@chakra-ui/icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user, profile } = useAuth();

  const NavItem = ({ path, label, icon }: { path: string; label: string; icon: React.ReactElement }) => (
    <Flex
      align="center"
      p="3"
      mx="2"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={{
        bg: 'purple.50',
        color: 'purple.600',
      }}
      bg={location.pathname === path ? 'purple.50' : 'transparent'}
      color={location.pathname === path ? 'purple.600' : 'gray.600'}
      as={Link}
      to={path}
      width="100%"
      transition="all 0.2s"
      position="relative"
      zIndex={1}
    >
      {React.cloneElement(icon, { 
        size: 18,
        style: { minWidth: '18px' }
      })}
      <Text ml="3" fontWeight="medium" fontSize="sm">{label}</Text>
    </Flex>
  );

  return (
    <Box
      bg="white"
      h="full"
      borderRight="1px"
      borderRightColor="gray.200"
      w="100%"
      pt="3"
      display="flex"
      flexDirection="column"
      position="relative"
      zIndex={1}
    >
      {user && profile && (
        <Link to="/profile">
          <Flex 
            px="4" 
            py="3" 
            align="center" 
            borderRadius="lg" 
            mx="2"
            mb="2"
            _hover={{ bg: 'gray.50' }}
            cursor="pointer"
          >
            <Avatar size="sm" src={profile.avatar_url} name={profile.full_name} />
            <Box ml="3" maxW="70%">
              <Text fontWeight="bold" fontSize="sm" isTruncated>
                {profile.full_name}
              </Text>
              <Text fontSize="xs" color="gray.500" isTruncated>
                @{profile.username}
              </Text>
            </Box>
          </Flex>
        </Link>
      )}

      <Divider my="2" />

      <Button
        leftIcon={<AddIcon />}
        colorScheme="purple"
        size="sm"
        mx="4"
        as={Link}
        to="/create-space"
      >
        Create Space
      </Button>

      <Divider my="3" />

      <VStack spacing="1" align="stretch" flex="1" overflowY="auto">
        <Box px="3" mb="2">
          <Text fontSize="xs" color="gray.500" fontWeight="medium">MAIN NAVIGATION</Text>
        </Box>
        
        <NavItem
          path="/spaces"
          label="Discover Spaces"
          icon={<Icon as={SearchIcon} />}
        />
        <NavItem
          path="/scheduled"
          label="Scheduled"
          icon={<Icon as={CalendarIcon} />}
        />
        <NavItem
          path="/favorites"
          label="Favorites"
          icon={<Icon as={StarIcon} />}
        />
        
        <Box px="3" mb="2" mt="4">
          <Text fontSize="xs" color="gray.500" fontWeight="medium">ACCOUNT</Text>
        </Box>
        
        <NavItem
          path="/profile"
          label="Profile"
          icon={<Icon as={Avatar} boxSize={4} />}
        />
        <NavItem
          path="/settings"
          label="Settings"
          icon={<Icon as={SettingsIcon} />}
        />
      </VStack>
      
      <Box p="4" fontSize="xs" color="gray.500" textAlign="center">
        <Text>Vibez App v1.0</Text>
      </Box>
    </Box>
  );
};

export default Sidebar;
