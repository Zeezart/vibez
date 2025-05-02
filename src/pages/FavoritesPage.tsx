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
import { StarIcon } from '@chakra-ui/icons';
import { Link, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

const FavoritesPage: React.FC = () => {
  const [favoriteSpaces, setFavoriteSpaces] = useState<SpaceProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      setError(null);
      
      try {
        // Get the user's favorites
        const { data: favorites, error: favoritesError } = await supabase
          .from('user_favorites')
          .select('space_id')
          .eq('user_id', user.id);
          
        if (favoritesError) throw favoritesError;
        
        if (!favorites || favorites.length === 0) {
          setFavoriteSpaces([]);
          setIsLoading(false);
          return;
        }
        
        const spaceIds = favorites.map(fav => fav.space_id);
        
        // Get details for each favorited space
        const { data: spaces, error: spacesError } = await supabase
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
          .in('id', spaceIds);
          
        if (spacesError) throw spacesError;
        
        // Get hosts info
        const hostIds = spaces?.map(space => space.host_id) || [];
        const { data: hosts, error: hostsError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url')
          .in('id', hostIds);
          
        if (hostsError) throw hostsError;
        
        // Get participants for each space
        const spacesWithParticipants = await Promise.all((spaces || []).map(async (space) => {
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
            isFavorite: true,
            shareLink: space.share_link,
          };
        }));
        
        setFavoriteSpaces(spacesWithParticipants);
      } catch (err: any) {
        console.error('Error fetching favorites:', err);
        setError(err.message || 'Failed to load favorites');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchFavorites();
  }, [user]);
  
  const removeFromFavorites = async (spaceId: string) => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to manage favorites',
        status: 'info',
        duration: 3000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }
    
    try {
      const { error } = await supabase
        .from('user_favorites')
        .delete()
        .eq('user_id', user.id)
        .eq('space_id', spaceId);
        
      if (error) throw error;
      
      // Remove the space from the local state
      setFavoriteSpaces(favoriteSpaces.filter(space => space.id !== spaceId));
      
      toast({
        title: "Removed from favorites",
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } catch (err: any) {
      console.error('Error removing from favorites:', err);
      toast({
        title: 'Error',
        description: err.message || 'Failed to remove from favorites',
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
  
  if (!user) {
    return (
      <Layout>
        <Container maxW="7xl" py={10}>
          <Alert status="warning" mb={6}>
            <AlertIcon />
            Please sign in to view your favorite spaces
          </Alert>
          <Button as={Link} to="/login" colorScheme="purple">
            Sign In
          </Button>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxW="7xl" py={6}>
        <Box mb={8}>
          <Heading mb={3} display="flex" alignItems="center">
            <StarIcon mr={3} color="yellow.400" /> Favorite Spaces
          </Heading>
          <Text color="gray.600">
            Your saved spaces for quick access
          </Text>
        </Box>

        {error && (
          <Alert status="error" mb={6}>
            <AlertIcon />
            {error}
          </Alert>
        )}

        {favoriteSpaces.length === 0 ? (
          <VStack spacing={6} py={10} textAlign="center">
            <Text fontSize="lg" color="gray.500">You haven't favorited any spaces yet</Text>
            <Button as={Link} to="/spaces" colorScheme="purple">
              Browse Spaces
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {favoriteSpaces.map((space) => (
              <SpaceCard 
                key={space.id} 
                space={space} 
                onToggleFavorite={() => removeFromFavorites(space.id)}
              />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Layout>
  );
};

export default FavoritesPage;
