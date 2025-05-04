import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Avatar,
  Badge,
  Tag,
  Grid,
  GridItem,
  IconButton,
  useToast,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  useClipboard,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Input,
} from '@chakra-ui/react';
import { 
  CalendarIcon, 
  StarIcon, 
  InfoIcon, 
  CopyIcon,
} from '@chakra-ui/icons';
import { Mic, Share2, MoreVertical, MicOff } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UsersList from '../components/UsersList';
import ChatDrawer from '../components/ChatDrawer';
import { SpaceProps } from '../components/SpaceCard';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import { AudioProvider, useAudio } from '../context/AudioContext';
import { Profile } from '../lib/supabase-types';

// Audio controls component that will be used inside the SpaceDetailPage
const AudioControls = () => {
  const { isSpeaking, isMuted, enableSpeaking, toggleMute } = useAudio();
  const toast = useToast();

  const handleSpeakingToggle = async () => {
    const result = await enableSpeaking(!isSpeaking);
    if (result && !isSpeaking) {
      toast({
        title: "Microphone activated",
        description: "You can now speak in this space",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Flex gap={4} mt={6}>
      {isSpeaking ? (
        <>
          <Button
            leftIcon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            colorScheme={isMuted ? "gray" : "green"}
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => enableSpeaking(false)}
          >
            Leave Speaker Mode
          </Button>
        </>
      ) : (
        <Button
          colorScheme="purple"
          leftIcon={<Mic size={20} />}
          onClick={handleSpeakingToggle}
        >
          Start Speaking
        </Button>
      )}
    </Flex>
  );
};

// Main SpaceDetailPage component
const SpaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<SpaceProps | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<'host' | 'speaker' | 'listener' | null>(null);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [joinLink, setJoinLink] = useState('');
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { onCopy } = useClipboard(`${window.location.origin}/space/${id}`);

  useEffect(() => {
    const fetchSpaceDetails = async () => {
      if (!id) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch space details
        const { data: spaceData, error: spaceError } = await supabase
          .from('spaces')
          .select(`
            id,
            title,
            description,
            status,
            scheduled_for,
            host_id,
            share_link,
            created_at
          `)
          .eq('id', id)
          .single();
          
        if (spaceError) throw spaceError;
        if (!spaceData) throw new Error('Space not found');
        
        // Fetch host profile
        const { data: hostProfile, error: hostError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .eq('id', spaceData.host_id)
          .single();
          
        if (hostError) throw hostError;
        
        // Fetch participants
        const { data: participantsData, error: participantsError } = await supabase
          .from('space_participants')
          .select(`
            id,
            role,
            user_id
          `)
          .eq('space_id', id);
          
        if (participantsError) throw participantsError;
        
        // Fetch participant profiles
        const participantIds = participantsData?.map(p => p.user_id) || [];
        const { data: profilesData, error: profilesError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', participantIds);
          
        if (profilesError) throw profilesError;
        
        // Map profiles to participants
        const usersFormatted = participantsData?.map(p => {
          const profile = profilesData?.find(prof => prof.id === p.user_id);
          return {
            id: p.user_id,
            name: profile?.full_name || 'Anonymous',
            username: profile?.username || 'user',
            image: profile?.avatar_url,
            role: p.role,
            isSpeaking: false,
            isMuted: p.role !== 'host',
          };
        }) || [];
        
        // Check if user has favorited this space
        let isFavorited = false;
        if (user) {
          const { data: favorite } = await supabase
            .from('user_favorites')
            .select('id')
            .eq('user_id', user.id)
            .eq('space_id', id)
            .single();
            
          isFavorited = !!favorite;
        }
        
        // Check if current user is a participant and get their role
        if (user) {
          const userParticipant = participantsData?.find(p => p.user_id === user.id);
          if (userParticipant) {
            setUserRole(userParticipant.role as 'host' | 'speaker' | 'listener');
          }
        }
        
        // After fetching the host profile, check if the current user follows the host
        if (user && hostProfile && user.id !== hostProfile.id) {
          const { data: followData } = await supabase
            .from('user_followers')
            .select('id')
            .eq('follower_id', user.id)
            .eq('following_id', hostProfile.id)
            .single();
            
          setIsFollowing(!!followData);
        }
        
        // Get followers count for the host
        if (hostProfile) {
          const { count: followersCountData } = await supabase
            .from('user_followers')
            .select('id', { count: 'exact', head: true })
            .eq('following_id', hostProfile.id);
            
          setFollowersCount(followersCountData || 0);
        }
        
        // Generate join link
        if (spaceData?.share_link) {
          const joinUrl = `${window.location.origin}/join/${spaceData.share_link}`;
          setJoinLink(joinUrl);
        }
        
        // Format the space object
        const formattedSpace: SpaceProps = {
          id: spaceData.id,
          title: spaceData.title,
          description: spaceData.description || '',
          status: spaceData.status as 'live' | 'scheduled' | 'ended',
          scheduledFor: spaceData.scheduled_for,
          host: {
            id: spaceData.host_id,
            name: hostProfile?.full_name || 'Anonymous',
            image: hostProfile?.avatar_url,
          },
          participants: usersFormatted.map(u => ({
            id: u.id,
            name: u.name,
            image: u.image,
          })),
          participantsCount: participantsData?.length || 0,
          tags: [], // We'll add tags support later
          isFavorite: isFavorited,
          shareLink: spaceData.share_link,
        };
        
        setSpace(formattedSpace);
        setUsers(usersFormatted);
      } catch (err: any) {
        console.error('Error fetching space details:', err);
        setError(err.message || 'Failed to load space details');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSpaceDetails();
  }, [id, user]);

  const joinSpace = async (role: 'listener' | 'speaker' = 'listener') => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to join this space',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login', { state: { from: `/space/${id}` } });
      return;
    }
    
    if (!id) return;
    
    setIsJoining(true);
    
    try {
      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('space_participants')
        .select('id, role')
        .eq('space_id', id)
        .eq('user_id', user.id)
        .single();
      
      if (existingParticipant) {
        // User is already a participant, update their role if needed
        if (existingParticipant.role !== role && role === 'speaker') {
          await supabase
            .from('space_participants')
            .update({ role })
            .eq('id', existingParticipant.id);
            
          setUserRole('speaker');
          
          toast({
            title: 'You are now a speaker',
            status: 'success',
            duration: 2000,
            isClosable: true,
          });
        } else {
          toast({
            title: 'Already joined',
            description: 'You are already part of this space',
            status: 'info',
            duration: 2000,
            isClosable: true,
          });
        }
      } else {
        // Add user as a new participant
        const { error } = await supabase
          .from('space_participants')
          .insert({
            space_id: id,
            user_id: user.id,
            role,
          });
          
        if (error) throw error;
        
        // Fetch user profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, avatar_url, username')
          .eq('id', user.id)
          .single();
        
        // Add user to the local users list
        const newUser = {
          id: user.id,
          name: profile?.full_name || 'Anonymous',
          username: profile?.username || 'user',
          image: profile?.avatar_url,
          role,
          isMuted: true,
        };
        
        setUsers(prev => [...prev, newUser]);
        setUserRole(role);
        
        toast({
          title: 'Joined successfully',
          description: `You have joined the space as a ${role}`,
          status: 'success',
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (err: any) {
      console.error('Error joining space:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to join space',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsJoining(false);
    }
  };

  const leaveSpace = async () => {
    if (!user || !id) return;
    
    try {
      const { error } = await supabase
        .from('space_participants')
        .delete()
        .eq('space_id', id)
        .eq('user_id', user.id);
        
      if (error) throw error;
      
      // Remove user from local users list
      setUsers(users.filter(u => u.id !== user.id));
      setUserRole(null);
      
      toast({
        title: 'Left the space',
        status: 'info',
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error leaving space:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to leave space',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? 'Microphone activated' : 'You\'re now muted',
      status: isMuted ? 'success' : 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const toggleFavorite = async () => {
    if (!user || !id || !space) return;
    
    try {
      if (space.isFavorite) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('space_id', id);
      } else {
        // Add to favorites
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            space_id: id
          });
      }
      
      // Update the space object
      setSpace({
        ...space,
        isFavorite: !space.isFavorite
      });
      
      toast({
        title: space.isFavorite ? 'Removed from favorites' : 'Added to favorites',
        status: 'success',
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error updating favorite:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to update favorite',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const toggleFollow = async () => {
    if (!user || !space) return;
    
    try {
      if (isFollowing) {
        // Unfollow user
        const { error } = await supabase
          .from('user_followers')
          .delete()
          .eq('follower_id', user.id)
          .eq('following_id', space.host.id);
          
        if (error) throw error;
        
        setIsFollowing(false);
        setFollowersCount(prev => prev - 1);
        
        toast({
          title: 'Unfollowed',
          description: `You are no longer following ${space.host.name}`,
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
            following_id: space.host.id
          });
          
        if (error) throw error;
        
        setIsFollowing(true);
        setFollowersCount(prev => prev + 1);
        
        toast({
          title: 'Following',
          description: `You are now following ${space.host.name}`,
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
    }
  };

  const shareSpace = () => {
    onCopy();
    toast({
      title: 'Link copied to clipboard',
      description: 'Share this link with your friends',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const copyShareLink = () => {
    if (joinLink) {
      navigator.clipboard.writeText(joinLink);
      
      toast({
        title: "Link copied",
        description: "Invite link has been copied to clipboard",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  const endSpace = async () => {
    if (!user || !id || !space) return;
    
    // Check if user is the host
    if (space.host.id !== user.id) {
      toast({
        title: 'Not authorized',
        description: 'Only the host can end the space',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    try {
      // Update the space status to 'ended'
      const { error } = await supabase
        .from('spaces')
        .update({ status: 'ended' })
        .eq('id', id);
        
      if (error) throw error;
      
      // Update the space object
      setSpace({
        ...space,
        status: 'ended'
      });
      
      toast({
        title: 'Space ended',
        description: 'This space has been marked as ended',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error ending space:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to end space',
        status: 'error',
        duration: 3000,
        isClosable: true,
      });
    }
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

  if (error || !space) {
    return (
      <Layout>
        <Container maxW="7xl" py={10} textAlign="center">
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error || 'Space not found'}
          </Alert>
          <Button onClick={() => navigate('/spaces')}>Back to Spaces</Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <AudioProvider spaceId={id as string}>
        <Container maxW="7xl" py={5}>
          <Box mb={6}>
            <Flex justify="space-between" align="center" mb={3}>
              <Badge colorScheme={space.status === 'live' ? 'green' : space.status === 'scheduled' ? 'blue' : 'gray'} px={2} py={1} borderRadius="full">
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
                  isDisabled={!user}
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
                  onClick={onOpen}
                />
                
                {user && space.host.id === user.id && (
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
              {user && user.id !== space.host.id && (
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
            
            {space.tags && space.tags.length > 0 && (
              <Flex gap={2} flexWrap="wrap" mb={5}>
                {space.tags.map((tag) => (
                  <Tag key={tag} colorScheme="purple" size="md">
                    {tag}
                  </Tag>
                ))}
              </Flex>
            )}
            
            {space.status === 'scheduled' && space.scheduledFor && (
              <Flex align="center" mb={5} color="blue.600">
                <CalendarIcon mr={2} />
                <Text>{new Date(space.scheduledFor).toLocaleString()}</Text>
              </Flex>
            )}
            
            <Box bg="gray.50" p={5} borderRadius="md" mb={6}>
              <Text>{space.description}</Text>
            </Box>
            
            {joinLink && (
              <Box bg="blue.50" p={5} borderRadius="md" mb={6}>
                <Heading size="sm" mb={2}>Share this space</Heading>
                <Flex align="center">
                  <Input value={joinLink} isReadOnly bg="white" />
                  <Button ml={2} colorScheme="blue" onClick={copyShareLink}>
                    Copy
                  </Button>
                </Flex>
              </Box>
            )}
          </Box>
          
          <Grid templateColumns={{ base: '1fr', lg: '3fr 1fr' }} gap={8}>
            <GridItem>
              <Box>
                <Heading size="md" mb={4}>Speakers</Heading>
                <UsersList users={users.filter(u => u.role === 'host' || u.role === 'speaker')} type="speakers" />
              </Box>
            </GridItem>
            
            <GridItem>
              <Box position="sticky" top="100px">
                <Box bg="white" p={5} borderRadius="md" boxShadow="md" mb={6}>
                  <Heading size="sm" mb={4}>Listeners</Heading>
                  <UsersList users={users.filter(u => u.role === 'listener')} type="listeners" />
                </Box>

                <Flex direction="column" gap={4} mt={6}>
                  {!userRole && space.status === 'live' && (
                    <Button
                      colorScheme="purple"
                      onClick={() => joinSpace('listener')}
                      isLoading={isJoining}
                    >
                      Join Space
                    </Button>
                  )}

                  {userRole === 'listener' && space.status === 'live' && (
                    <Button
                      colorScheme="purple"
                      variant="outline"
                      onClick={() => joinSpace('speaker')}
                      isDisabled={isJoining}
                    >
                      Request to Speak
                    </Button>
                  )}

                  {userRole && userRole !== 'listener' && space.status === 'live' && (
                    <AudioControls />
                  )}

                  {userRole && (
                    <Button
                      colorScheme="red"
                      variant="outline"
                      onClick={leaveSpace}
                    >
                      Leave
                    </Button>
                  )}
                </Flex>
              </Box>
            </GridItem>
          </Grid>
        </Container>

        {/* Chat drawer that can be toggled */}
        <ChatDrawer spaceId={id as string} />

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>About this Space</ModalHeader>
            <ModalCloseButton />
            <ModalBody>
              <Text fontWeight="bold" mb={2}>Title</Text>
              <Text mb={4}>{space.title}</Text>
              
              <Text fontWeight="bold" mb={2}>Description</Text>
              <Text mb={4}>{space.description}</Text>
              
              <Text fontWeight="bold" mb={2}>Host</Text>
              <Flex align="center" mb={4}>
                <Avatar size="sm" src={space.host.image} name={space.host.name} mr={2} />
                <Text>{space.host.name}</Text>
              </Flex>
              
              <Text fontWeight="bold" mb={2}>Participants</Text>
              <Text mb={4}>{space.participantsCount} participants</Text>
              
              {space.tags && space.tags.length > 0 && (
                <>
                  <Text fontWeight="bold" mb={2}>Tags</Text>
                  <Flex gap={2} flexWrap="wrap" mb={4}>
                    {space.tags.map((tag) => (
                      <Tag key={tag} colorScheme="purple" size="md">
                        {tag}
                      </Tag>
                    ))}
                  </Flex>
                </>
              )}
              
              {space.shareLink && (
                <>
                  <Text fontWeight="bold" mb={2}>Share Link</Text>
                  <Flex align="center" mb={4}>
                    <Text isTruncated flex="1">
                      {`${window.location.origin}/join/${space.shareLink}`}
                    </Text>
                    <IconButton
                      aria-label="Copy link"
                      icon={<CopyIcon />}
                      size="sm"
                      ml={2}
                      onClick={copyShareLink}
                    />
                  </Flex>
                </>
              )}
            </ModalBody>
            <ModalFooter>
              <Button colorScheme="blue" mr={3} onClick={onClose}>
                Close
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </AudioProvider>
    </Layout>
  );
};

export default SpaceDetailPage;
