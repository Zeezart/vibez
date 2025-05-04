
import React, { memo } from 'react';
import { Box, Text, HStack, VStack } from '@chakra-ui/react';
import ProfileFollowButton from './ProfileFollowButton';
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";

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
  // Get first letter of name for avatar fallback
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <HStack spacing={4} p={3} borderWidth="1px" borderRadius="md">
      <div className="h-12 w-12">
        <Avatar className="h-12 w-12 bg-blue-500">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} />
          ) : (
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          )}
        </Avatar>
      </div>
      
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
