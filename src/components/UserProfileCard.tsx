
import React, { memo } from 'react';
import {
  Box,
  Avatar,
  Text,
  HStack,
  VStack,
} from '@chakra-ui/react';
import ProfileFollowButton from './ProfileFollowButton';

interface UserProfileCardProps {
  userId: string;
  name: string;
  username?: string;
  avatarUrl?: string;
  isFollowing: boolean;
  onFollowChange?: (isNowFollowing: boolean) => void;
}

const UserProfileCard: React.FC<UserProfileCardProps> = memo(({
  userId,
  name,
  username,
  avatarUrl,
  isFollowing,
  onFollowChange,
}) => {
  return (
    <HStack spacing={4} p={3} borderWidth="1px" borderRadius="md">
      <Avatar 
        name={name} 
        src={avatarUrl || undefined} 
        size="md"
        bgColor="blue.500"
      />
      <VStack align="start" spacing={0} flex={1}>
        <Text fontWeight="bold">{name}</Text>
        {username && <Text color="gray.500">@{username}</Text>}
      </VStack>
      <ProfileFollowButton
        userId={userId}
        name={name}
        isFollowing={isFollowing}
        onFollowChange={onFollowChange}
      />
    </HStack>
  );
});

export default UserProfileCard;
