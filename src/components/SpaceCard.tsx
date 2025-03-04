
import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Flex, 
  Badge, 
  Avatar, 
  AvatarGroup, 
  IconButton,
  useColorModeValue 
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { StarIcon } from '@chakra-ui/icons';

export interface SpaceProps {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'scheduled' | 'ended';
  scheduledFor?: string;
  participantsCount: number;
  participants: {
    id: string;
    name: string;
    image?: string;
  }[];
  host: {
    id: string;
    name: string;
    image?: string;
  };
  tags?: string[];
  isFavorite?: boolean;
}

const SpaceCard: React.FC<{ space: SpaceProps }> = ({ space }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const statusColor = {
    live: 'green',
    scheduled: 'blue',
    ended: 'gray',
  }[space.status];

  return (
    <Box
      as={Link}
      to={`/space/${space.id}`}
      bg={bgColor}
      p={5}
      borderRadius="lg"
      boxShadow="md"
      _hover={{
        transform: 'translateY(-2px)',
        boxShadow: 'lg',
        textDecoration: 'none',
      }}
      transition="all 0.2s"
      position="relative"
    >
      <Flex justify="space-between" align="center" mb={3}>
        <Badge colorScheme={statusColor} px={2} py={1} borderRadius="full">
          {space.status === 'live' 
            ? 'LIVE NOW' 
            : space.status === 'scheduled' 
              ? 'SCHEDULED'
              : 'ENDED'}
        </Badge>
        <IconButton
          aria-label="Favorite"
          icon={<StarIcon />}
          variant="ghost"
          color={space.isFavorite ? 'yellow.500' : 'gray.400'}
          size="sm"
          onClick={(e) => {
            e.preventDefault();
            // Toggle favorite logic would go here
          }}
        />
      </Flex>

      <Heading size="md" mb={2} noOfLines={1}>
        {space.title}
      </Heading>
      
      <Text color="gray.600" fontSize="sm" mb={4} noOfLines={2}>
        {space.description}
      </Text>
      
      {space.status === 'scheduled' && space.scheduledFor && (
        <Text fontSize="sm" color="gray.500" mb={2}>
          {new Date(space.scheduledFor).toLocaleString()}
        </Text>
      )}

      <Flex align="center" mt={4}>
        <Avatar size="sm" src={space.host.image} name={space.host.name} mr={2} />
        <Text fontWeight="medium" fontSize="sm">
          {space.host.name}
        </Text>
      </Flex>

      <Flex justify="space-between" align="center" mt={4}>
        <AvatarGroup size="sm" max={3}>
          {space.participants.map((participant) => (
            <Avatar 
              key={participant.id}
              name={participant.name}
              src={participant.image}
            />
          ))}
        </AvatarGroup>
        
        <Text fontSize="sm" color="gray.500">
          {space.participantsCount} {space.participantsCount === 1 ? 'listener' : 'listeners'}
        </Text>
      </Flex>

      {space.tags && space.tags.length > 0 && (
        <Flex mt={4} flexWrap="wrap" gap={2}>
          {space.tags.map((tag) => (
            <Badge key={tag} colorScheme="purple" variant="subtle" px={2} py={1}>
              {tag}
            </Badge>
          ))}
        </Flex>
      )}
    </Box>
  );
};

export default SpaceCard;
