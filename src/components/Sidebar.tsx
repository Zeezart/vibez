
import React from 'react';
import { 
  Box, 
  VStack, 
  Text, 
  Flex, 
  Avatar, 
  Icon,
  Button
} from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AddIcon, CalendarIcon, SearchIcon, StarIcon, SettingsIcon } from '@chakra-ui/icons';

const Sidebar: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();

  const NavItem = ({ path, label, icon }: { path: string; label: string; icon: React.ReactElement }) => (
    <Flex
      align="center"
      p="4"
      mx="4"
      borderRadius="lg"
      role="group"
      cursor="pointer"
      _hover={{
        bg: 'brand.50',
        color: 'brand.600',
      }}
      bg={location.pathname === path ? 'brand.50' : 'transparent'}
      color={location.pathname === path ? 'brand.600' : 'gray.600'}
      as={Link}
      to={path}
      w="full"
    >
      {icon}
      <Text ml="4" fontWeight="medium">{label}</Text>
    </Flex>
  );

  return (
    <Box
      bg="white"
      w="full"
      h="full"
      borderRight="1px"
      borderRightColor="gray.200"
      pos="fixed"
      pt="4"
    >
      {user && (
        <Flex px="6" py="4" align="center">
          <Avatar size="sm" src={user.profileImage} name={user.name} />
          <Box ml="3">
            <Text fontWeight="bold" isTruncated maxW="160px">
              {user.name}
            </Text>
            <Text fontSize="sm" color="gray.500" isTruncated maxW="160px">
              @{user.username}
            </Text>
          </Box>
        </Flex>
      )}

      <Button
        leftIcon={<AddIcon />}
        colorScheme="purple"
        variant="solid"
        size="md"
        mx="6"
        my="4"
        as={Link}
        to="/create-space"
      >
        Create Space
      </Button>

      <VStack spacing="0" align="stretch" mt="6">
        <NavItem
          path="/spaces"
          label="Discover Spaces"
          icon={<Icon as={SearchIcon} w={5} h={5} />}
        />
        <NavItem
          path="/scheduled"
          label="Scheduled"
          icon={<Icon as={CalendarIcon} w={5} h={5} />}
        />
        <NavItem
          path="/favorites"
          label="Favorites"
          icon={<Icon as={StarIcon} w={5} h={5} />}
        />
        <NavItem
          path="/settings"
          label="Settings"
          icon={<Icon as={SettingsIcon} w={5} h={5} />}
        />
      </VStack>
    </Box>
  );
};

export default Sidebar;
