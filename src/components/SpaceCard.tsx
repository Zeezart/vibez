
import React, { memo } from 'react';
import { Link } from 'react-router-dom';
import {
  Box,
  Heading,
  Text,
  Badge,
  Flex,
  Avatar,
  AvatarGroup,
  Button,
  IconButton,
  HStack,
  useColorModeValue,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';

export interface ParticipantProps {
  id: string;
  name: string;
  image?: string;
}

export interface HostProps {
  id: string;
  name: string;
  image?: string;
}

export interface SpaceProps {
  id: string;
  title: string;
  description: string;
  status: 'live' | 'scheduled' | 'ended';
  scheduledFor?: string;
  participantsCount: number;
  participants: ParticipantProps[];
  host: HostProps;
  tags?: string[];
  isFavorite?: boolean;
  shareLink?: string;
}

interface SpaceCardProps {
  space: SpaceProps;
  onToggleFavorite?: () => void;
}

const SpaceCard: React.FC<SpaceCardProps> = memo(({ space, onToggleFavorite }) => {
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');
  
  // Determine status color
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'live': return 'green';
      case 'scheduled': return 'blue';
      case 'ended': return 'gray';
      default: return 'gray';
    }
  };
  
  const formatScheduledDate = (dateString?: string) => {
    if (!dateString) return '';
    
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', { 
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    }).format(date);
  };
  
  return (
    <Box
      borderWidth="1px"
      borderRadius="lg"
      overflow="hidden"
      boxShadow="md"
      bg={bgColor}
      borderColor={borderColor}
      position="relative"
      height="100%"
      display="flex"
      flexDirection="column"
    >
      {/* Use Link component instead of anchor tag */}
      <Box as={Link} to={`/space/${space.id}`} flex="1" p={5} _hover={{ textDecoration: 'none' }}>
        <Flex justify="space-between" align="start" mb={2}>
          <Badge colorScheme={getStatusColor(space.status)} fontSize="sm" px={2} py={1} borderRadius="md">
            {space.status === 'live' ? 'Live Now' : 
             space.status === 'scheduled' ? `Scheduled for ${formatScheduledDate(space.scheduledFor)}` : 
             'Ended'}
          </Badge>
          
          {onToggleFavorite && (
            <IconButton
              aria-label="Favorite"
              icon={<StarIcon />}
              size="sm"
              variant={space.isFavorite ? "solid" : "outline"}
              colorScheme={space.isFavorite ? "yellow" : "gray"}
              onClick={(e) => {
                e.preventDefault(); // Prevent navigation
                onToggleFavorite();
              }}
            />
          )}
        </Flex>
        
        <Heading size="md" mb={2} noOfLines={2}>
          {space.title}
        </Heading>
        
        <Text fontSize="sm" color="gray.500" mb={4} noOfLines={3}>
          {space.description || 'No description provided.'}
        </Text>
        
        <Flex justifyContent="space-between" alignItems="center" mt="auto">
          <HStack spacing={2}>
            <Avatar size="sm" src={space.host.image} name={space.host.name} />
            <Text fontSize="sm" fontWeight="medium">
              {space.host.name}
            </Text>
          </HStack>
          
          <HStack>
            <AvatarGroup size="xs" max={3}>
              {space.participants.map(participant => (
                <Avatar key={participant.id} src={participant.image} name={participant.name} />
              ))}
            </AvatarGroup>
            <Text fontSize="xs" color="gray.500">
              {space.participantsCount} {space.participantsCount === 1 ? 'participant' : 'participants'}
            </Text>
          </HStack>
        </Flex>
        
        {space.tags && space.tags.length > 0 && (
          <Flex mt={4} flexWrap="wrap" gap={2}>
            {space.tags.map((tag, index) => (
              <Badge key={index} colorScheme="purple" variant="outline" fontSize="xs">
                {tag}
              </Badge>
            ))}
          </Flex>
        )}
      </Box>
      
      {space.shareLink && (
        <Flex p={3} borderTopWidth="1px" borderColor={borderColor} justify="center">
          <Button 
            as={Link}
            to={`/join/${space.shareLink}`}
            size="sm" 
            colorScheme="purple" 
            variant="outline" 
            width="100%"
            onClick={(e) => e.stopPropagation()}
          >
            Share Space
          </Button>
        </Flex>
      )}
    </Box>
  );
});

export default SpaceCard;
