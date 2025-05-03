
import React, { useState, useEffect } from 'react';
import {
  Box,
  VStack,
  HStack,
  Text,
  Avatar,
  Flex,
  Divider,
  Stat,
  StatLabel,
  StatNumber,
  Button,
  Badge,
  Icon,
  useToast,
  Skeleton,
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { Users, Calendar, Mic } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ProfileDetailsProps {
  userId: string;
  isOwnProfile?: boolean;
}

const ProfileDetails: React.FC<ProfileDetailsProps> = ({ userId, isOwnProfile = false }) => {
  const [profile, setProfile] = useState<any>(null);
  const [followers, setFollowers] = useState<number>(0);
  const [following, setFollowing] = useState<number>(0);
  const [isFollowing, setIsFollowing] = useState<boolean>(false);
  const [hostingSpaces, setHostingSpaces] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [loadingFollow, setLoadingFollow] = useState<boolean>(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    const fetchProfileData = async () => {
      setIsLoading(true);
      try {
        // Fetch profile details
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .single();
          
        if (profileError) throw profileError;
        setProfile(profileData);
        
        // Fetch followers count
        const { count: followersCount, error: followersError } = await supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('following_id', userId);
          
        if (followersError) throw followersError;
        setFollowers(followersCount || 0);
        
        // Fetch following count
        const { count: followingCount, error: followingError } = await supabase
          .from('user_followers')
          .select('*', { count: 'exact', head: true })
          .eq('follower_id', userId);
          
        if (followingError) throw followingError;
        setFollowing(followingCount || 0);
        
        // Check if current user is following this profile
        if (user && user.id !== userId) {
          const { data: isFollowingData, error: followingCheckError } = await supabase
            .from('user_followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', userId)
            .single();
            
          if (!followingCheckError) {
            setIsFollowing(!!isFollowingData);
          }
        }
        
        // Fetch spaces hosted count
        const { count: spacesCount, error: spacesError } = await supabase
          .from('spaces')
          .select('*', { count: 'exact', head: true })
          .eq('host_id', userId);
          
        if (spacesError) throw spacesError;
        setHostingSpaces(spacesCount || 0);
        
      } catch (error) {
        console.error('Error fetching profile data:', error);
        
      } finally {
        setIsLoading(false);
      }
    };
    
    if (userId) {
      fetchProfileData();
    }
  }, [userId, user]);
  
  const toggleFollow = async () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to follow users",
        status: "info",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    setLoadingFollow(true);
    
    try {
      if (isFollowing) {
        // Unfollow
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', userId);
          
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowers(prev => Math.max(0, prev - 1));
        
        toast({
          title: "Unfollowed",
          description: `You are no longer following ${profile?.full_name}`,
          status: "info",
          duration: 3000,
          isClosable: true,
        });
      } else {
        // Follow
        const { error } = await supabase
          .from('user_followers')
          .insert({
            follower_id: user.id,
            following_id: userId
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowers(prev => prev + 1);
        
        toast({
          title: "Following",
          description: `You are now following ${profile?.full_name}`,
          status: "success",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update follow status",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setLoadingFollow(false);
    }
  };

  if (isLoading) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" shadow="md">
        <Flex direction="column" align="center" p={6}>
          <Skeleton height="100px" width="100px" borderRadius="full" />
          <Skeleton height="24px" width="150px" mt={4} />
          <Skeleton height="20px" width="120px" mt={2} />
          <Skeleton height="40px" width="120px" mt={4} />
        </Flex>
        <Divider />
        <Flex p={4} justify="space-around">
          <Skeleton height="60px" width="80px" />
          <Skeleton height="60px" width="80px" />
          <Skeleton height="60px" width="80px" />
        </Flex>
      </Box>
    );
  }

  if (!profile) {
    return (
      <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" p={6} textAlign="center" shadow="md">
        <Text>Profile not found</Text>
      </Box>
    );
  }

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" shadow="md">
      {/* Cover Photo Area */}
      <Box bg="purple.100" h="80px" position="relative" />
      
      {/* Profile Info Section */}
      <Flex direction="column" align="center" position="relative" px={6} pb={6}>
        <Avatar 
          size="xl" 
          name={profile.full_name} 
          src={profile.avatar_url}
          mt="-40px"
          borderWidth={4}
          borderColor="white"
          bg="white"
        />
        
        <VStack spacing={1} mt={3}>
          <Text fontWeight="bold" fontSize="xl">{profile.full_name}</Text>
          <Text color="gray.500">@{profile.username}</Text>
          
          {isOwnProfile ? (
            <Button
              as={Link}
              to="/profile/edit"
              size="sm"
              colorScheme="purple"
              variant="outline"
              mt={2}
            >
              Edit Profile
            </Button>
          ) : user && (
            <Button
              size="sm"
              colorScheme={isFollowing ? "gray" : "purple"}
              variant={isFollowing ? "outline" : "solid"}
              mt={2}
              onClick={toggleFollow}
              isLoading={loadingFollow}
            >
              {isFollowing ? "Following" : "Follow"}
            </Button>
          )}
          
          {hostingSpaces > 0 && (
            <Badge colorScheme="purple" mt={2}>
              Active Host
            </Badge>
          )}
        </VStack>
      </Flex>
      
      <Divider />
      
      {/* Stats Section */}
      <Flex p={4} justify="space-around" textAlign="center">
        <Stat>
          <StatLabel fontSize="xs" color="gray.500">Followers</StatLabel>
          <HStack justify="center" spacing={1}>
            <Icon as={Users} size={14} color="gray.500" />
            <StatNumber fontSize="lg">{followers}</StatNumber>
          </HStack>
        </Stat>
        
        <Stat>
          <StatLabel fontSize="xs" color="gray.500">Following</StatLabel>
          <HStack justify="center" spacing={1}>
            <Icon as={Users} size={14} color="gray.500" />
            <StatNumber fontSize="lg">{following}</StatNumber>
          </HStack>
        </Stat>
        
        <Stat>
          <StatLabel fontSize="xs" color="gray.500">Spaces</StatLabel>
          <HStack justify="center" spacing={1}>
            <Icon as={Mic} size={14} color="gray.500" />
            <StatNumber fontSize="lg">{hostingSpaces}</StatNumber>
          </HStack>
        </Stat>
      </Flex>
    </Box>
  );
};

export default ProfileDetails;
