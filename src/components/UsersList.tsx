
import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Avatar, 
  Flex, 
  Badge,
  Tooltip
} from '@chakra-ui/react';
import { MicrophoneIcon } from '@chakra-ui/icons';

interface User {
  id: string;
  name: string;
  username: string;
  image?: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
  role: 'host' | 'speaker' | 'listener';
}

interface UsersListProps {
  users: User[];
  type: 'speakers' | 'listeners';
}

const UsersList: React.FC<UsersListProps> = ({ users, type }) => {
  const filteredUsers = users.filter(user => 
    type === 'speakers' 
      ? (user.role === 'host' || user.role === 'speaker')
      : user.role === 'listener'
  );

  return (
    <Box>
      <Text fontWeight="medium" mb={4} color="gray.700">
        {type === 'speakers' ? 'Speakers' : 'Listeners'}
        <Badge ml={2} colorScheme="purple" borderRadius="full">
          {filteredUsers.length}
        </Badge>
      </Text>
      
      <VStack spacing={4} align="stretch">
        {filteredUsers.map(user => (
          <HStack key={user.id} spacing={3} p={2} borderRadius="md" _hover={{ bg: 'gray.50' }}>
            <Tooltip label={user.isMuted ? 'Muted' : 'Speaking'} placement="top">
              <Box position="relative">
                <Avatar 
                  size="md" 
                  name={user.name} 
                  src={user.image} 
                  borderWidth={user.isSpeaking ? 2 : 0}
                  borderColor="green.400"
                />
                {(user.role === 'host' || user.role === 'speaker') && (
                  <Flex 
                    position="absolute" 
                    bottom="-2px" 
                    right="-2px" 
                    bg={user.isMuted ? "red.500" : "green.500"} 
                    p={1} 
                    borderRadius="full"
                    boxSize={6}
                    align="center"
                    justify="center"
                  >
                    <MicrophoneIcon boxSize={3} color="white" />
                  </Flex>
                )}
              </Box>
            </Tooltip>
            
            <Flex direction="column">
              <HStack>
                <Text fontWeight="medium">{user.name}</Text>
                {user.role === 'host' && (
                  <Badge colorScheme="purple" variant="solid" fontSize="2xs">
                    HOST
                  </Badge>
                )}
              </HStack>
              <Text fontSize="sm" color="gray.500">@{user.username}</Text>
            </Flex>
          </HStack>
        ))}
      </VStack>
    </Box>
  );
};

export default UsersList;
