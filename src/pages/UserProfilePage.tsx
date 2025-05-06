
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Container, 
  Box, 
  Spinner, 
  Center, 
  Alert, 
  AlertIcon, 
  Button,
  VStack,
  Heading,
  Grid,
  GridItem,
  Tab,
  Tabs,
  TabList,
  TabPanel,
  TabPanels,
  Text,
  useToast
} from '@chakra-ui/react';
import Layout from '../components/Layout';
import ProfileDetails from '../components/ProfileDetails';
import SpaceCard from '../components/SpaceCard';
import UserProfileCard from '../components/UserProfileCard';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [userSpaces, setUserSpaces] = useState<any[]>([]);
  const [followers, setFollowers] = useState<any[]>([]);
  const [following, setFollowing] = useState<any[]>([]);
  const [isOwnProfile, setIsOwnProfile] = useState(false);

  useEffect(() => {
    if (!id) {
      setError('User ID not provided');
      setIsLoading(false);
      return;
    }

    // Check if this is the current user's profile
    if (user && id === user.id) {
      setIsOwnProfile(true);
      // Redirect to the main profile page
      navigate('/profile');
      return;
    }

    const fetchUserData = async () => {
      setIsLoading(true);
      
      try {
        // Check if the user exists
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', id)
          .single();

        if (profileError) {
          throw new Error('User not found');
        }
        
        // Fetch spaces hosted by the user
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select(`
            id,
            title,
            description,
            status,
            scheduled_for,
            host_id,
            created_at,
            profiles (
              full_name,
              avatar_url
            ),
            space_participants (
              user_id
            )
          `)
          .eq('host_id', id)
          .order('created_at', { ascending: false });

        if (spacesError) throw spacesError;

        // Format spaces data
        const formattedSpaces = spacesData.map((space: any) => ({
          id: space.id,
          title: space.title,
          description: space.description || '',
          status: space.status,
          scheduledFor: space.scheduled_for,
          host: {
            id: space.host_id,
            name: space.profiles?.full_name || 'Unknown',
            image: space.profiles?.avatar_url,
          },
          participantsCount: space.space_participants?.length || 0,
          participants: [],
          tags: [],
        }));

        setUserSpaces(formattedSpaces);

        // Get followers
        const { data: followersData, error: followersError } = await supabase
          .from('user_followers')
          .select(`
            follower_id,
            profiles!user_followers_follower_id_fkey (
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('following_id', id);

        if (followersError) throw followersError;

        const formattedFollowers = followersData.map((item: any) => ({
          userId: item.profiles.id,
          name: item.profiles.full_name,
          username: item.profiles.username,
          avatarUrl: item.profiles.avatar_url,
          isFollowing: user ? item.profiles.id === user.id : false, // Set initial value
        }));
        
        setFollowers(formattedFollowers);

        // Get following
        const { data: followingData, error: followingError } = await supabase
          .from('user_followers')
          .select(`
            following_id,
            following:profiles!user_followers_following_id_fkey (
              id,
              full_name,
              username,
              avatar_url
            )
          `)
          .eq('follower_id', id);

        if (followingError) throw followingError;

        const formattedFollowing = followingData.map((item: any) => ({
          userId: item.following.id,
          name: item.following.full_name,
          username: item.following.username,
          avatarUrl: item.following.avatar_url,
          isFollowing: false, // Default value, will check later
        }));

        // Check which users are being followed by the current user
        if (user && formattedFollowers.length > 0) {
          const { data: userFollowingData } = await supabase
            .from('user_followers')
            .select('following_id')
            .eq('follower_id', user.id);
            
          const followingIds = new Set((userFollowingData || []).map((f: any) => f.following_id));
          
          // Update followers list with actual following state
          setFollowers(formattedFollowers.map(f => ({
            ...f,
            isFollowing: followingIds.has(f.userId)
          })));
          
          // Update following list with actual following state
          setFollowing(formattedFollowing.map(f => ({
            ...f,
            isFollowing: followingIds.has(f.userId)
          })));
        } else {
          setFollowing(formattedFollowing);
        }
        
      } catch (err: any) {
        console.error('Error loading user profile:', err);
        setError(err.message || 'Failed to load user profile');
        toast({
          title: 'Error',
          description: err.message || 'Failed to load user profile',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchUserData();
  }, [id, navigate, user, toast]);

  const handleFollowChange = (userId: string, isNowFollowing: boolean) => {
    // Update followers list
    setFollowers(prev => 
      prev.map(f => f.userId === userId ? { ...f, isFollowing: isNowFollowing } : f)
    );
    
    // Update following list
    setFollowing(prev => 
      prev.map(f => f.userId === userId ? { ...f, isFollowing: isNowFollowing } : f)
    );
  };

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="7xl" py={10} textAlign="center">
          <Center h="400px">
            <Spinner size="xl" color="purple.500" />
          </Center>
        </Container>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <Container maxW="7xl" py={10} textAlign="center">
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
          <Button onClick={() => navigate('/spaces')}>Back to Spaces</Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="7xl" py={8}>
        <Grid templateColumns={{ base: "1fr", md: "350px 1fr" }} gap={8}>
          <GridItem>
            <Box position="sticky" top="100px">
              <ProfileDetails userId={id as string} isOwnProfile={isOwnProfile} />
            </Box>
          </GridItem>
          
          <GridItem>
            <Tabs colorScheme="purple" isLazy>
              <TabList mb={6}>
                <Tab>Spaces</Tab>
                <Tab>Followers</Tab>
                <Tab>Following</Tab>
              </TabList>
              
              <TabPanels>
                {/* Spaces Tab */}
                <TabPanel p={0}>
                  {userSpaces.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {userSpaces.map(space => (
                        <SpaceCard key={space.id} {...space} />
                      ))}
                    </VStack>
                  ) : (
                    <Center py={10} borderWidth="1px" borderRadius="lg">
                      <Text color="gray.500">No spaces yet</Text>
                    </Center>
                  )}
                </TabPanel>
                
                {/* Followers Tab */}
                <TabPanel p={0}>
                  {followers.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {followers.map(follower => (
                        <UserProfileCard 
                          key={follower.userId}
                          userId={follower.userId}
                          name={follower.name}
                          username={follower.username}
                          avatarUrl={follower.avatarUrl}
                          isFollowing={follower.isFollowing}
                          onFollowChange={(isNowFollowing) => handleFollowChange(follower.userId, isNowFollowing)}
                        />
                      ))}
                    </VStack>
                  ) : (
                    <Center py={10} borderWidth="1px" borderRadius="lg">
                      <Text color="gray.500">No followers yet</Text>
                    </Center>
                  )}
                </TabPanel>
                
                {/* Following Tab */}
                <TabPanel p={0}>
                  {following.length > 0 ? (
                    <VStack spacing={4} align="stretch">
                      {following.map(follow => (
                        <UserProfileCard 
                          key={follow.userId}
                          userId={follow.userId}
                          name={follow.name}
                          username={follow.username}
                          avatarUrl={follow.avatarUrl}
                          isFollowing={follow.isFollowing}
                          onFollowChange={(isNowFollowing) => handleFollowChange(follow.userId, isNowFollowing)}
                        />
                      ))}
                    </VStack>
                  ) : (
                    <Center py={10} borderWidth="1px" borderRadius="lg">
                      <Text color="gray.500">Not following anyone yet</Text>
                    </Center>
                  )}
                </TabPanel>
              </TabPanels>
            </Tabs>
          </GridItem>
        </Grid>
      </Container>
    </Layout>
  );
};

export default UserProfilePage;
