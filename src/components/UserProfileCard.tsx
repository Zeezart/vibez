
import React, { useState, memo } from 'react';
import {
  Box,
  Avatar,
  Text,
  Button,
  HStack,
  VStack,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

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
  const [loading, setLoading] = useState(false);
  const [following, setFollowing] = useState(isFollowing);
  const { user } = useAuth();
  const toast = useToast();

  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to follow users',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (user.id === userId) {
      toast({
        title: 'Action not allowed',
        description: 'You cannot follow yourself',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setLoading(true);
    
    try {
      if (following) {
        // Unfollow user
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setFollowing(false);
        if (onFollowChange) onFollowChange(false);
        
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Follow user
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        setFollowing(true);
        if (onFollowChange) onFollowChange(true);
        
        toast({
          title: 'Following',
          description: `You are now following ${name}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      console.error('Error toggling follow status:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update follow status',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <HStack spacing={4} p={3} borderWidth="1px" borderRadius="md">
      <Avatar name={name} src={avatarUrl} size="md" />
      <VStack align="start" spacing={0} flex={1}>
        <Text fontWeight="bold">{name}</Text>
        {username && <Text color="gray.500">@{username}</Text>}
      </VStack>
      {user && user.id !== userId && (
        <Button
          size="sm"
          colorScheme={following ? "gray" : "purple"}
          variant={following ? "outline" : "solid"}
          onClick={toggleFollow}
          isLoading={loading}
        >
          {following ? 'Following' : 'Follow'}
        </Button>
      )}
    </HStack>
  );
});

export default UserProfileCard;
