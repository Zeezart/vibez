
import React from 'react';
import {
  Box, 
  Badge, 
  Heading, 
  Text, 
  Flex, 
  Avatar, 
  Button, 
  IconButton,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useToast
} from '@chakra-ui/react';
import { StarIcon, InfoIcon, CopyIcon } from '@chakra-ui/icons';
import { Share2, MoreVertical } from 'lucide-react';
import { SpaceProps } from '../../../components/SpaceCard';

interface SpaceHeaderProps {
  space: SpaceProps;
  isFollowing: boolean;
  followersCount: number;
  toggleFollow: () => Promise<void>;
  toggleFavorite: () => Promise<void>;
  shareSpace: () => void;
  copyShareLink: () => void;
  endSpace: () => Promise<void>;
  onOpenDetails: () => void;
  userId?: string | null;
}

const SpaceHeader: React.FC<SpaceHeaderProps> = ({
  space,
  isFollowing,
  followersCount,
  toggleFollow,
  toggleFavorite,
  shareSpace,
  copyShareLink,
  endSpace,
  onOpenDetails,
  userId
}) => {
  
  return (
    <Box mb={6}>
      <Flex justify="space-between" align="center" mb={3}>
        <Badge 
          colorScheme={space.status === 'live' ? 'green' : space.status === 'scheduled' ? 'blue' : 'gray'} 
          px={2} 
          py={1} 
          borderRadius="full"
        >
          {space.status === 'live' ? 'LIVE NOW' : space.status === 'scheduled' ? 'SCHEDULED' : 'ENDED'}
        </Badge>
        <Flex>
          <IconButton
            aria-label="Favorite"
            icon={<StarIcon />}
            variant="ghost"
            color={space.isFavorite ? 'yellow.500' : 'gray.400'}
            mr={2}
            onClick={toggleFavorite}
            isDisabled={!userId}
          />
          <IconButton
            aria-label="Share"
            icon={<Share2 size={20} />}
            variant="ghost"
            mr={2}
            onClick={shareSpace}
          />
          <IconButton
            aria-label="Info"
            icon={<InfoIcon />}
            variant="ghost"
            onClick={onOpenDetails}
          />
          
          {userId && space.host.id === userId && (
            <Menu>
              <MenuButton
                as={IconButton}
                aria-label="More options"
                icon={<MoreVertical size={16} />}
                variant="ghost"
                ml={2}
              />
              <MenuList>
                <MenuItem icon={<CopyIcon />} onClick={copyShareLink}>
                  Copy invite link
                </MenuItem>
                {space.status === 'live' && (
                  <MenuItem
                    color="red.500"
                    onClick={endSpace}
                  >
                    End space
                  </MenuItem>
                )}
              </MenuList>
            </Menu>
          )}
        </Flex>
      </Flex>
      
      <Heading mb={4}>{space.title}</Heading>
      
      <Flex align="center" mb={4}>
        <Avatar size="sm" src={space.host.image} name={space.host.name} mr={2} />
        <Box flex="1">
          <Text>Hosted by <Text as="span" fontWeight="bold">{space.host.name}</Text></Text>
          <Text fontSize="xs" color="gray.500">{followersCount} followers</Text>
        </Box>
        {userId && userId !== space.host.id && (
          <Button
            size="sm"
            colorScheme={isFollowing ? "gray" : "purple"}
            variant={isFollowing ? "outline" : "solid"}
            onClick={toggleFollow}
          >
            {isFollowing ? 'Following' : 'Follow'}
          </Button>
        )}
      </Flex>
    </Box>
  );
};

export default SpaceHeader;
