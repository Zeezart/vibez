import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Button,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

const ScheduledPage: React.FC = () => {
  const [scheduledSpaces, setScheduledSpaces] = useState<SpaceProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchScheduledSpaces = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch spaces with status = scheduled
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select(`
            id,
            title,
            description,
            status,
            scheduled_for,
            host_id,
            share_link
          `)
          .eq('status', 'scheduled')
          .order('scheduled_for', { ascending: true });
          
        if (spacesError) throw spacesError;
        
        // Get hosts info
        const hostIds = spacesData?.map(space => space.host_id) || [];
        const { data: hosts, error: hostsError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', hostIds);
          
        if (hostsError) throw hostsError;

        // Determine which spaces are favorited by current user
        let userFavorites = new Set<string>();
        if (user) {
          const { data: favData } = await supabase
            .from('user_favorites')
            .select('space_id')
            .eq('user_id', user.id);
            
          if (favData) {
            userFavorites = new Set(favData.map(fav => fav.space_id));
          }
        }
        
        // Get participants for each space
        const spacesWithParticipants = await Promise.all((spacesData || []).map(async (space) => {
          // Get participants count
          const { count, error: countError } = await supabase
            .from('space_participants')
            .select('user_id', { count: 'exact', head: true })
            .eq('space_id', space.id);
            
          if (countError) throw countError;
          
          // Get participants details (limited to 5)
          const { data: participants, error: participantsError } = await supabase
            .from('space_participants')
            .select('user_id')
            .eq('space_id', space.id)
            .limit(5);
            
          if (participantsError) throw participantsError;
          
          // Get participants profiles
          const participantIds = participants?.map(p => p.user_id) || [];
          const { data: participantProfiles } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', participantIds);
            
          // Find the host
          const host = hosts?.find(h => h.id === space.host_id);
            
          return {
            id: space.id,
            title: space.title,
            description: space.description || '',
            status: space.status as 'live' | 'scheduled' | 'ended',
            scheduledFor: space.scheduled_for,
            participantsCount: count || 0,
            participants: participantProfiles?.map(p => ({
              id: p.id,
              name: p.full_name || 'Anonymous',
              image: p.avatar_url,
            })) || [],
            host: {
              id: space.host_id,
              name: host?.full_name || 'Anonymous',
              image: host?.avatar_url,
            },
            tags: [], // We'll add tags support later
            isFavorite: userFavorites.has(space.id),
            shareLink: space.share_link,
          };
        }));
        
        setScheduledSpaces(spacesWithParticipants);
      } catch (err: any) {
        console.error('Error fetching scheduled spaces:', err);
        setError(err.message || 'Failed to load scheduled spaces');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchScheduledSpaces();
  }, [user]);
  
  const toggleFavorite = async (spaceId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to favorite spaces',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    
    const space = scheduledSpaces.find(s => s.id === spaceId);
    if (!space) return;
    
    try {
      if (space.isFavorite) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('space_id', spaceId);
      } else {
        // Add to favorites
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            space_id: spaceId
          });
      }
      
      // Update the local state
      setScheduledSpaces(scheduledSpaces.map(s => 
        s.id === spaceId 
          ? { ...s, isFavorite: !s.isFavorite }
          : s
      ));
      
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
  
  if (isLoading) {
    return (
      <Layout>
        <Container maxW="7xl" py={10}>
          <Center h="400px">
            <Spinner size="xl" color="purple.500" />
          </Center>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxW="7xl" py={6}>
        <Box mb={8}>
          <Heading mb={3} display="flex" alignItems="center">
            <CalendarIcon mr={3} /> Scheduled Spaces
          </Heading>
          <Text color="gray.600">
            Join upcoming conversations and add them to your calendar
          </Text>
        </Box>

        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {scheduledSpaces.length === 0 ? (
          <VStack spacing={6} py={10} textAlign="center">
            <Text fontSize="lg" color="gray.500">No scheduled spaces available</Text>
            <Button as={Link} to="/create-space" colorScheme="purple">
              Schedule a Space
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {scheduledSpaces.map((space) => (
              <SpaceCard 
                key={space.id} 
                space={space} 
                onToggleFavorite={() => toggleFavorite(space.id)}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Layout>
  );
};

export default ScheduledPage;
