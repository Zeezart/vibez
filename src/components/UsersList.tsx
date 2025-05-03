
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
import { Mic, MicOff } from 'lucide-react';
import { useAudio } from '../context/AudioContext';

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
  const { activeSpeakers } = useAudio();
  
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
        {filteredUsers.map(user => {
          const isActive = activeSpeakers.includes(user.id);
          
          return (
            <HStack key={user.id} spacing={3} p={2} borderRadius="md" _hover={{ bg: 'gray.50' }}>
              <Tooltip label={user.isMuted ? 'Muted' : (isActive ? 'Speaking' : 'Not Speaking')} placement="top">
                <Box position="relative">
                  <Avatar 
                    size="md" 
                    name={user.name} 
                    src={user.image} 
                    borderWidth={isActive ? 2 : 0}
                    borderColor="green.400"
                  />
                  {(user.role === 'host' || user.role === 'speaker') && (
                    <Flex 
                      position="absolute" 
                      bottom="-2px" 
                      right="-2px" 
                      bg={user.isMuted || !isActive ? "red.500" : "green.500"} 
                      p={1} 
                      borderRadius="full"
                      boxSize={6}
                      align="center"
                      justify="center"
                    >
                      {user.isMuted || !isActive ? <MicOff size={12} color="white" /> : <Mic size={12} color="white" />}
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
                  {isActive && (
                    <Badge colorScheme="green" variant="solid" fontSize="2xs">
                      LIVE
                    </Badge>
                  )}
                </HStack>
                <Text fontSize="sm" color="gray.500">@{user.username}</Text>
              </Flex>
            </HStack>
          );
        })}
      </VStack>
    </Box>
  );
};

export default UsersList;
