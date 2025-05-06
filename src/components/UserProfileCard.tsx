
import React, { memo } from 'react';
import { Box, Text, HStack, VStack, Link as ChakraLink } from '@chakra-ui/react';
import { Link } from 'react-router-dom';
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
    <HStack spacing={4} p={3} borderWidth="1px" borderRadius="md" bg="white" shadow="sm">
      <ChakraLink as={Link} to={`/profile/${userId}`} className="h-12 w-12">
        <Avatar className="h-12 w-12 bg-purple-500 cursor-pointer">
          {avatarUrl ? (
            <AvatarImage src={avatarUrl} alt={name} />
          ) : (
            <AvatarFallback>{getInitials(name)}</AvatarFallback>
          )}
        </Avatar>
      </ChakraLink>
      
      <VStack align="start" spacing={0} flex={1}>
        <ChakraLink as={Link} to={`/profile/${userId}`}>
          <Text fontWeight="bold">{name}</Text>
        </ChakraLink>
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
