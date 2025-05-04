
import React, { useState } from 'react';
import {
  Button,
  useToast,
} from '@chakra-ui/react';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

interface ProfileFollowButtonProps {
  userId: string;
  name: string;
  isFollowing: boolean;
  onFollowChange?: (isNowFollowing: boolean) => void;
}

const ProfileFollowButton: React.FC<ProfileFollowButtonProps> = ({
  userId,
  name,
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
    user && user.id !== userId ? (
      <Button
        size="sm"
        colorScheme={following ? "gray" : "purple"}
        variant={following ? "outline" : "solid"}
        onClick={toggleFollow}
        isLoading={loading}
      >
        {following ? 'Following' : 'Follow'}
      </Button>
    ) : null
  );
};

export default ProfileFollowButton;
