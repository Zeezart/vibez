
import React from 'react';
import { Box, Text, Flex, SimpleGrid, Avatar, Badge } from '@chakra-ui/react';
import ClickableUserAvatar from '../../../components/ClickableUserAvatar';

interface ParticipantProps {
  id: string;
  name: string;
  username?: string;
  image?: string;
  role: string;
  isSpeaking?: boolean;
  isMuted?: boolean;
}

interface SpaceParticipantsProps {
  users: ParticipantProps[];
  type: 'speakers' | 'listeners';
}

const SpaceParticipants: React.FC<SpaceParticipantsProps> = ({ users, type }) => {
  if (!users || users.length === 0) {
    return (
      <Box mb={6}>
        <Text fontWeight="medium" mb={3} color="gray.600">
          {type === 'speakers' ? 'Speakers' : 'Listeners'} (0)
        </Text>
        <Flex justifyContent="center" alignItems="center" h="100px">
          <Text color="gray.500">
            No {type} yet
          </Text>
        </Flex>
      </Box>
    );
  }

  return (
    <Box mb={6}>
      <Text fontWeight="medium" mb={3} color="gray.600">
        {type === 'speakers' ? 'Speakers' : 'Listeners'} ({users.length})
      </Text>
      
      <SimpleGrid columns={{ base: 4, md: 5, lg: 4, xl: 5 }} spacing={4}>
        {users.map((user) => (
          <Box 
            key={user.id} 
            textAlign="center"
            position="relative"
          >
            <Box 
              position="relative" 
              display="inline-block"
              borderRadius="full" 
              borderWidth={user.isSpeaking ? 3 : 0}
              borderColor="green.400"
              p={user.isSpeaking ? 1 : 0}
            >
              <ClickableUserAvatar 
                userId={user.id}
                name={user.name}
                image={user.image}
                size="md"
                tooltipLabel={`${user.name} (${user.role})`}
              />
              
              {user.role === 'host' && (
                <Badge 
                  colorScheme="purple" 
                  position="absolute" 
                  bottom="-2px" 
                  right="-2px"
                  borderRadius="full"
                  fontSize="xs"
                >
                  Host
                </Badge>
              )}
              
              {user.isMuted && (
                <Box 
                  position="absolute"
                  bottom="0"
                  right="0"
                  bg="red.500"
                  borderRadius="full"
                  w="12px"
                  h="12px"
                  border="2px solid white"
                />
              )}
            </Box>
            <Text 
              fontSize="sm" 
              fontWeight={user.role === 'host' ? "bold" : "normal"}
              mt={1}
              noOfLines={1}
            >
              {user.name}
            </Text>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
};

export default SpaceParticipants;
