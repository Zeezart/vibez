
import React, { useState, useCallback } from 'react';
import {
  Box,
  Container,
  Grid,
  GridItem,
  Spinner,
  Center,
  Alert,
  AlertIcon,
  Button,
  useDisclosure,
  useClipboard,
  useToast,
} from '@chakra-ui/react';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import ChatDrawer from '../components/ChatDrawer';
import { useAuth } from '../context/AuthContext';
import { AudioProvider } from '../context/AudioContext';
import { useSpaceDetail } from '../features/spaces/hooks/useSpaceDetail';

// Import refactored components
import SpaceHeader from '../features/spaces/components/SpaceHeader';
import SpaceDescription from '../features/spaces/components/SpaceDescription';
import SpaceParticipants from '../features/spaces/components/SpaceParticipants';
import SpaceControls from '../features/spaces/components/SpaceControls';
import SpaceDetailsModal from '../features/spaces/components/SpaceDetailsModal';

const SpaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const toast = useToast();
  const { user } = useAuth();
  
  const {
    space,
    users,
    isLoading,
    isJoining,
    error,
    userRole,
    isFollowing,
    followersCount,
    joinLink,
    joinSpace,
    leaveSpace,
    toggleFollow,
    toggleFavorite,
    endSpace
  } = useSpaceDetail(id);

  // Use clipboard for share functionality
  const { onCopy } = useClipboard(`${window.location.origin}/space/${id}`);

  const shareSpace = useCallback(() => {
    onCopy();
    toast({
      title: 'Link copied to clipboard',
      description: 'Share this link with your friends',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  }, [onCopy, toast]);

  const copyShareLink = useCallback(() => {
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
  }, [joinLink, toast]);

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
          {/* Space Header */}
          <SpaceHeader 
            space={space}
            isFollowing={isFollowing}
            followersCount={followersCount}
            toggleFollow={toggleFollow}
            toggleFavorite={toggleFavorite}
            shareSpace={shareSpace}
            copyShareLink={copyShareLink}
            endSpace={endSpace}
            onOpenDetails={onOpen}
            userId={user?.id}
          />
          
          {/* Space Description */}
          <SpaceDescription 
            space={space} 
            joinLink={joinLink} 
            copyShareLink={copyShareLink} 
          />
          
          <Grid templateColumns={{ base: '1fr', lg: '3fr 1fr' }} gap={8}>
            <GridItem>
              {/* Speakers Section */}
              <SpaceParticipants 
                users={users.filter(u => u.role === 'host' || u.role === 'speaker')} 
                type="speakers" 
              />
            </GridItem>
            
            <GridItem>
              <Box position="sticky" top="100px">
                {/* Listeners Section */}
                <Box bg="white" p={5} borderRadius="md" boxShadow="md" mb={6}>
                  <SpaceParticipants 
                    users={users.filter(u => u.role === 'listener')} 
                    type="listeners" 
                  />
                </Box>

                {/* Space Controls */}
                <SpaceControls 
                  userRole={userRole}
                  status={space.status}
                  isJoining={isJoining}
                  joinSpace={joinSpace}
                  leaveSpace={leaveSpace}
                />
              </Box>
            </GridItem>
          </Grid>
        </Container>

        {/* Chat drawer that can be toggled */}
        <ChatDrawer spaceId={id as string} />

        {/* Space Details Modal */}
        <SpaceDetailsModal 
          isOpen={isOpen}
          onClose={onClose}
          space={space}
          copyShareLink={copyShareLink}
        />
      </AudioProvider>
    </Layout>
  );
};

export default SpaceDetailPage;
