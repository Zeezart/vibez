import React, { useState, useEffect } from 'react';
import {
  Box,
  Heading,
  Text,
  SimpleGrid,
  Flex,
  Input,
  InputGroup,
  InputLeftElement,
  Select,
  Container,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  Button,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

const SpacesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const [spaces, setSpaces] = useState<SpaceProps[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  
  const toast = useToast();
  const { user } = useAuth();

  // Fetch spaces and user favorites
  useEffect(() => {
    const fetchSpacesAndFavorites = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all spaces
        const { data: spacesData, error: spacesError } = await supabase
          .from('spaces')
          .select(`
            id,
            title,
            description,
            status,
            scheduled_for,
            share_link,
            host_id,
            created_at
          `)
          .order('created_at', { ascending: false });
          
        if (spacesError) throw spacesError;
        
        // Get host info for all spaces
        const hostIds = spacesData?.map(space => space.host_id) || [];
        const { data: hosts, error: hostsError } = await supabase
          .from('profiles')
          .select('id, full_name, avatar_url, username')
          .in('id', hostIds);
          
        if (hostsError) throw hostsError;
        
        // If user is authenticated, fetch their favorites
        let userFavorites: Set<string> = new Set();
        
        if (user) {
          const { data: favData, error: favError } = await supabase
            .from('user_favorites')
            .select('space_id')
            .eq('user_id', user.id);
            
          if (!favError && favData) {
            userFavorites = new Set(favData.map(fav => fav.space_id));
          }
        }
        
        setFavorites(userFavorites);
        
        // Fetch participants for each space
        const spacesWithParticipants = await Promise.all((spacesData || []).map(async (space) => {
          // Get participants count
          const { count: participantCount, error: countError } = await supabase
            .from('space_participants')
            .select('user_id', { count: 'exact', head: true })
            .eq('space_id', space.id);
            
          if (countError) throw countError;
          
          // Get up to 5 participants
          const { data: participants, error: participantsError } = await supabase
            .from('space_participants')
            .select('user_id')
            .eq('space_id', space.id)
            .limit(5);
            
          if (participantsError) throw participantsError;
          
          // Get participant profiles
          const participantIds = participants?.map(p => p.user_id) || [];
          const { data: participantProfiles, error: profilesError } = await supabase
            .from('profiles')
            .select('id, full_name, avatar_url')
            .in('id', participantIds);
            
          if (profilesError) throw profilesError;
          
          // Find the host
          const host = hosts?.find(h => h.id === space.host_id);
          
          return {
            id: space.id,
            title: space.title,
            description: space.description || '',
            status: space.status as 'live' | 'scheduled' | 'ended',
            scheduledFor: space.scheduled_for,
            participantsCount: participantCount || 0,
            participants: participantProfiles?.map(p => ({
              id: p.id,
              name: p.full_name || 'Anonymous',
              image: p.avatar_url,
            })) || [],
            host: {
              id: host?.id || '',
              name: host?.full_name || 'Anonymous',
              image: host?.avatar_url,
            },
            tags: [], // We'll add tags support later
            isFavorite: userFavorites.has(space.id),
            shareLink: space.share_link,
          };
        }));
        
        setSpaces(spacesWithParticipants);
      } catch (err: any) {
        console.error('Error fetching spaces:', err);
        setError(err.message || 'Failed to load spaces');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchSpacesAndFavorites();
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
    
    const isFavorited = favorites.has(spaceId);
    
    try {
      if (isFavorited) {
        // Remove from favorites
        await supabase
          .from('user_favorites')
          .delete()
          .eq('user_id', user.id)
          .eq('space_id', spaceId);
          
        setFavorites(prev => {
          const updated = new Set(prev);
          updated.delete(spaceId);
          return updated;
        });
      } else {
        // Add to favorites
        await supabase
          .from('user_favorites')
          .insert({
            user_id: user.id,
            space_id: spaceId
          });
          
        setFavorites(prev => {
          const updated = new Set(prev);
          updated.add(spaceId);
          return updated;
        });
      }
      
      // Update spaces list
      setSpaces(spaces => spaces.map(space => 
        space.id === spaceId 
          ? { ...space, isFavorite: !isFavorited }
          : space
      ));
      
      toast({
        title: isFavorited ? 'Removed from favorites' : 'Added to favorites',
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

  const filteredSpaces = spaces.filter(space => {
    // Filter by search query
    const matchesSearch = !searchQuery 
      || space.title.toLowerCase().includes(searchQuery.toLowerCase())
      || space.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    // Filter by status
    const matchesFilter = filter === 'all' ||
                        (filter === 'live' && space.status === 'live') ||
                        (filter === 'scheduled' && space.status === 'scheduled') ||
                        (filter === 'ended' && space.status === 'ended');
    
    return matchesSearch && matchesFilter;
  });

  const liveSpaces = filteredSpaces.filter(space => space.status === 'live');
  const scheduledSpaces = filteredSpaces.filter(space => space.status === 'scheduled');
  const endedSpaces = filteredSpaces.filter(space => space.status === 'ended');

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

  if (error) {
    return (
      <Layout>
        <Container maxW="7xl" py={10}>
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="7xl" py={5}>
        <Box mb={8}>
          <Heading mb={2}>Discover Spaces</Heading>
          <Text color="gray.600">
            Join conversations that matter to you or start your own space
          </Text>
        </Box>

        <Flex direction={{ base: 'column', md: 'row' }} gap={4} mb={8}>
          <InputGroup flex={3}>
            <InputLeftElement pointerEvents="none">
              <SearchIcon color="gray.400" />
            </InputLeftElement>
            <Input 
              placeholder="Search spaces by title or description"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </InputGroup>
          
          <Select 
            flex={1} 
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
          >
            <option value="all">All Spaces</option>
            <option value="live">Live Now</option>
            <option value="scheduled">Scheduled</option>
            <option value="ended">Ended</option>
          </Select>
          
          <Button
            as={Link}
            to="/create-space"
            colorScheme="purple"
            flex={{ base: 'auto', md: 1 }}
          >
            Create Space
          </Button>
        </Flex>
        
        <Tabs colorScheme="purple" mb={8}>
          <TabList>
            <Tab>All ({filteredSpaces.length})</Tab>
            <Tab>Live Now ({liveSpaces.length})</Tab>
            <Tab>Scheduled ({scheduledSpaces.length})</Tab>
            <Tab>Ended ({endedSpaces.length})</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={4}>
              {filteredSpaces.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500">No spaces found matching your criteria</Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {filteredSpaces.map(space => (
                    <SpaceCard 
                      key={space.id} 
                      space={space} 
                      onToggleFavorite={() => toggleFavorite(space.id)}
                    />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            
            <TabPanel p={0} pt={4}>
              {liveSpaces.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500">No live spaces available</Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {liveSpaces.map(space => (
                    <SpaceCard 
                      key={space.id} 
                      space={space} 
                      onToggleFavorite={() => toggleFavorite(space.id)}
                    />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            
            <TabPanel p={0} pt={4}>
              {scheduledSpaces.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500">No scheduled spaces</Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {scheduledSpaces.map(space => (
                    <SpaceCard 
                      key={space.id} 
                      space={space} 
                      onToggleFavorite={() => toggleFavorite(space.id)}
                    />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            
            <TabPanel p={0} pt={4}>
              {endedSpaces.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500">No ended spaces</Text>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {endedSpaces.map(space => (
                    <SpaceCard 
                      key={space.id} 
                      space={space} 
                      onToggleFavorite={() => toggleFavorite(space.id)}
                    />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

export default SpacesPage;
