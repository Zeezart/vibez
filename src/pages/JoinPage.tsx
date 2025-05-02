
import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  VStack,
  useToast,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Card,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

const JoinPage: React.FC = () => {
  const { shareLink } = useParams<{ shareLink: string }>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [spaceId, setSpaceId] = useState<string | null>(null);
  const [spaceTitle, setSpaceTitle] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  useEffect(() => {
    const findSpaceByShareLink = async () => {
      if (!shareLink) return;
      
      setIsLoading(true);
      setError(null);
      
      try {
        const { data: space, error: spaceError } = await supabase
          .from('spaces')
          .select('id, title, status')
          .eq('share_link', shareLink)
          .single();
          
        if (spaceError) throw spaceError;
        if (!space) throw new Error('Space not found');
        
        if (space.status === 'ended') {
          setError('This space has ended and is no longer available to join.');
          return;
        }
        
        setSpaceId(space.id);
        setSpaceTitle(space.title);
      } catch (err: any) {
        console.error('Error finding space:', err);
        setError(err.message || 'Failed to find space');
      } finally {
        setIsLoading(false);
      }
    };
    
    findSpaceByShareLink();
  }, [shareLink]);
  
  const handleJoinSpace = async () => {
    if (!user) {
      // Save the current location to redirect back after login
      navigate('/login', { state: { from: `/join/${shareLink}` } });
      return;
    }
    
    if (!spaceId) return;
    
    setIsJoining(true);
    
    try {
      // Check if user is already a participant
      const { data: existingParticipant } = await supabase
        .from('space_participants')
        .select('id')
        .eq('space_id', spaceId)
        .eq('user_id', user.id)
        .single();
      
      if (!existingParticipant) {
        // Add user as a new participant
        const { error } = await supabase
          .from('space_participants')
          .insert({
            space_id: spaceId,
            user_id: user.id,
            role: 'listener',
          });
          
        if (error) throw error;
      }
      
      // Navigate to the space
      navigate(`/space/${spaceId}`);
      
      toast({
        title: 'Joined successfully',
        description: 'You have joined the space',
        status: 'success',
        duration: 3000,
        isClosable: true,
      });
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
  
  if (isLoading) {
    return (
      <Layout>
        <Container maxW="xl" py={10}>
          <Center h="400px">
            <Spinner size="xl" color="purple.500" />
          </Center>
        </Container>
      </Layout>
    );
  }
  
  if (error || !spaceId) {
    return (
      <Layout>
        <Container maxW="xl" py={10}>
          <Card p={8} textAlign="center">
            <Alert status="error" mb={6}>
              <AlertIcon />
              {error || 'Invalid share link'}
            </Alert>
            <Button onClick={() => navigate('/spaces')} colorScheme="purple">
              Browse Spaces
            </Button>
          </Card>
        </Container>
      </Layout>
    );
  }
  
  return (
    <Layout>
      <Container maxW="xl" py={10}>
        <Card p={8}>
          <VStack spacing={6} align="stretch" textAlign="center">
            <Heading size="lg">Join Space</Heading>
            
            <Text fontSize="xl" fontWeight="medium">
              {spaceTitle}
            </Text>
            
            {!user && (
              <Alert status="info" mb={2}>
                <AlertIcon />
                Please sign in to join this space
              </Alert>
            )}
            
            <Text color="gray.600">
              You've been invited to join this audio conversation space.
            </Text>
            
            <Button
              colorScheme="purple"
              size="lg"
              onClick={handleJoinSpace}
              isLoading={isJoining}
            >
              {user ? 'Join Now' : 'Sign in to Join'}
            </Button>
            
            <Button variant="ghost" onClick={() => navigate('/spaces')}>
              Go to Spaces
            </Button>
          </VStack>
        </Card>
      </Container>
    </Layout>
  );
};

export default JoinPage;
