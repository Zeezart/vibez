
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
  useColorModeValue,
  useToast,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Tooltip,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { StarIcon, CopyIcon, ExternalLinkIcon } from '@chakra-ui/icons';
import { MoreVertical } from 'lucide-react';

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
  shareLink?: string;
}

interface SpaceCardProps {
  space: SpaceProps;
  onToggleFavorite?: (id: string) => void;
}

const SpaceCard: React.FC<SpaceCardProps> = ({ space, onToggleFavorite }) => {
  const bgColor = useColorModeValue('white', 'gray.700');
  const statusColor = {
    live: 'green',
    scheduled: 'blue',
    ended: 'gray',
  }[space.status];
  const toast = useToast();
  const navigate = useNavigate();

  const handleToggleFavorite = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (onToggleFavorite) {
      onToggleFavorite(space.id);
    }
  };

  const copyShareLink = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (space.shareLink) {
      const shareUrl = `${window.location.origin}/join/${space.shareLink}`;
      navigator.clipboard.writeText(shareUrl);
      
      toast({
        title: "Link copied",
        description: "Share link has been copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const openInNewTab = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(`/space/${space.id}`, '_blank');
  };

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
        <Flex>
          <Tooltip label={space.isFavorite ? 'Remove from favorites' : 'Add to favorites'}>
            <IconButton
              aria-label="Favorite"
              icon={<StarIcon />}
              variant="ghost"
              color={space.isFavorite ? 'yellow.500' : 'gray.400'}
              size="sm"
              onClick={handleToggleFavorite}
              mr={1}
            />
          </Tooltip>
          
          <Menu>
            <MenuButton
              as={IconButton}
              aria-label="More options"
              icon={<MoreVertical size={16} />}
              variant="ghost"
              size="sm"
              onClick={e => e.stopPropagation()}
            />
            <MenuList onClick={e => e.stopPropagation()}>
              <MenuItem icon={<CopyIcon />} onClick={copyShareLink}>
                Copy share link
              </MenuItem>
              <MenuItem icon={<ExternalLinkIcon />} onClick={openInNewTab}>
                Open in new tab
              </MenuItem>
            </MenuList>
          </Menu>
        </Flex>
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
