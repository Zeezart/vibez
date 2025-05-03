
import React from 'react';
import { 
  Box, 
  VStack, 
  HStack, 
  Text, 
  Avatar, 
  Flex, 
  Badge,
  Tooltip,
  AvatarGroup,
  keyframes
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

const pulseAnimation = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(72, 187, 120, 0.7);
  }
  70% {
    box-shadow: 0 0 0 10px rgba(72, 187, 120, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(72, 187, 120, 0);
  }
`;

const UsersList: React.FC<UsersListProps> = ({ users, type }) => {
  const { activeSpeakers } = useAudio();
  
  const filteredUsers = users.filter(user => 
    type === 'speakers' 
      ? (user.role === 'host' || user.role === 'speaker')
      : user.role === 'listener'
  );

  return (
    <Box>
      <HStack mb={4} justify="space-between">
        <Text fontWeight="medium" color="gray.700">
          {type === 'speakers' ? 'Speakers' : 'Listeners'}
          <Badge ml={2} colorScheme="purple" borderRadius="full">
            {filteredUsers.length}
          </Badge>
        </Text>
        
        {type === 'speakers' && activeSpeakers.length > 0 && (
          <AvatarGroup size="xs" max={3} spacing="-0.75rem">
            {activeSpeakers.map(id => {
              const user = filteredUsers.find(u => u.id === id);
              if (!user) return null;
              
              return (
                <Tooltip key={id} label={`${user.name} is speaking`}>
                  <Avatar 
                    name={user.name} 
                    src={user.image}
                    borderColor="green.400"
                    borderWidth="2px"
                  />
                </Tooltip>
              );
            })}
          </AvatarGroup>
        )}
      </HStack>
      
      <VStack spacing={4} align="stretch" maxHeight="400px" overflowY="auto" pr={2}
        sx={{
          '&::-webkit-scrollbar': {
            width: '8px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.05)',
          },
          '&::-webkit-scrollbar-thumb': {
            backgroundColor: 'rgba(0, 0, 0, 0.1)',
            borderRadius: '8px',
          },
        }}
      >
        {filteredUsers.map(user => {
          const isActive = activeSpeakers.includes(user.id);
          
          return (
            <HStack 
              key={user.id} 
              spacing={3} 
              p={3} 
              borderRadius="md" 
              bg={isActive ? 'green.50' : 'gray.50'} 
              borderLeftWidth="4px"
              borderLeftColor={isActive ? 'green.400' : 'transparent'}
              transition="all 0.3s ease"
              _hover={{ bg: isActive ? 'green.50' : 'gray.100' }}
            >
              <Tooltip label={user.isMuted ? 'Muted' : (isActive ? 'Speaking' : 'Not Speaking')} placement="top">
                <Box position="relative">
                  <Avatar 
                    size="md" 
                    name={user.name} 
                    src={user.image} 
                    borderWidth={isActive ? 2 : 0}
                    borderColor="green.400"
                    animation={isActive ? `${pulseAnimation} 2s infinite` : 'none'}
                  />
                  {(user.role === 'host' || user.role === 'speaker') && (
                    <Flex 
                      position="absolute" 
                      bottom="-2px" 
                      right="-2px" 
                      bg={user.isMuted ? "red.500" : (isActive ? "green.500" : "gray.400")} 
                      p={1} 
                      borderRadius="full"
                      boxSize={6}
                      align="center"
                      justify="center"
                    >
                      {user.isMuted ? <MicOff size={12} color="white" /> : <Mic size={12} color="white" />}
                    </Flex>
                  )}
                </Box>
              </Tooltip>
              
              <Flex direction="column" flex={1} overflow="hidden">
                <HStack>
                  <Text fontWeight="medium" isTruncated maxWidth="150px">{user.name}</Text>
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
                <Text fontSize="sm" color="gray.500" isTruncated>@{user.username}</Text>
              </Flex>
            </HStack>
          );
        })}
        
        {filteredUsers.length === 0 && (
          <Box p={4} textAlign="center" color="gray.500" bg="gray.50" borderRadius="md">
            No {type === 'speakers' ? 'speakers' : 'listeners'} yet
          </Box>
        )}
      </VStack>
    </Box>
  );
};

export default UsersList;
