
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
} from '@chakra-ui/react';
import { 
  MicrophoneIcon, 
  CalendarIcon, 
  StarIcon, 
  ShareIcon,
  InfoIcon
} from '@chakra-ui/icons';
import { useParams, useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import UsersList from '../components/UsersList';
import { SpaceProps } from '../components/SpaceCard';

// Mock data for a specific space
const MOCK_SPACE: SpaceProps = {
  id: '1',
  title: 'Tech Talk: AI and the Future of Work',
  description: 'Join us for a discussion on how AI is transforming the workplace and what skills will be valuable in the future. We\'ll cover the latest developments in artificial intelligence, machine learning, and how these technologies are reshaping industries from healthcare to finance.',
  status: 'live',
  participantsCount: 120,
  participants: [
    { id: '1', name: 'Alex Johnson', image: 'https://bit.ly/dan-abramov' },
    { id: '2', name: 'Sarah Miller', image: 'https://bit.ly/ryan-florence' },
    { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
    { id: '4', name: 'Emma Wilson', image: 'https://bit.ly/kent-c-dodds' },
    { id: '5', name: 'David Clark', image: 'https://bit.ly/code-beast' },
    { id: '6', name: 'John Taylor', image: 'https://bit.ly/sage-adebayo' },
  ],
  host: { id: '1', name: 'Alex Johnson', image: 'https://bit.ly/dan-abramov' },
  tags: ['Tech', 'AI', 'Future', 'Careers', 'Innovation'],
  isFavorite: true,
};

// Mock users data for the room
const MOCK_USERS = [
  { id: '1', name: 'Alex Johnson', username: 'alexj', image: 'https://bit.ly/dan-abramov', role: 'host' as const, isSpeaking: true, isMuted: false },
  { id: '2', name: 'Sarah Miller', username: 'sarahm', image: 'https://bit.ly/ryan-florence', role: 'speaker' as const, isSpeaking: false, isMuted: false },
  { id: '3', name: 'Michael Brown', username: 'mikeb', image: 'https://bit.ly/prosper-baba', role: 'speaker' as const, isSpeaking: false, isMuted: true },
  { id: '4', name: 'Emma Wilson', username: 'emmaw', image: 'https://bit.ly/kent-c-dodds', role: 'listener' as const },
  { id: '5', name: 'David Clark', username: 'davidc', image: 'https://bit.ly/code-beast', role: 'listener' as const },
  { id: '6', name: 'John Taylor', username: 'johnt', image: 'https://bit.ly/sage-adebayo', role: 'listener' as const },
  { id: '7', name: 'Lisa Wang', username: 'lisaw', role: 'listener' as const },
  { id: '8', name: 'Robert Jones', username: 'robertj', role: 'listener' as const },
  { id: '9', name: 'Amanda Lee', username: 'amandal', role: 'listener' as const },
];

const SpaceDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [space, setSpace] = useState<SpaceProps | null>(null);
  const [users, setUsers] = useState<typeof MOCK_USERS>([]);
  const [isMuted, setIsMuted] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    // In a real app, this would be an API call
    // For now, we'll simulate a delay and use mock data
    const timer = setTimeout(() => {
      setSpace(MOCK_SPACE);
      setUsers(MOCK_USERS);
      setIsLoading(false);
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [id]);

  const toggleMute = () => {
    setIsMuted(!isMuted);
    toast({
      title: isMuted ? 'Microphone activated' : 'You\'re now muted',
      status: isMuted ? 'success' : 'info',
      duration: 2000,
      isClosable: true,
    });
  };

  const leaveSpace = () => {
    toast({
      title: 'Left the space',
      status: 'info',
      duration: 2000,
      isClosable: true,
    });
    navigate('/spaces');
  };

  const toggleFavorite = () => {
    if (!space) return;
    setSpace({ ...space, isFavorite: !space.isFavorite });
    toast({
      title: space.isFavorite ? 'Removed from favorites' : 'Added to favorites',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  const shareSpace = () => {
    // In a real app, this would open a share dialog
    navigator.clipboard.writeText(window.location.href);
    toast({
      title: 'Link copied to clipboard',
      description: 'Share this link with your friends',
      status: 'success',
      duration: 2000,
      isClosable: true,
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <Container maxW="7xl" py={10} textAlign="center">
          <Text>Loading space...</Text>
        </Container>
      </Layout>
    );
  }

  if (!space) {
    return (
      <Layout>
        <Container maxW="7xl" py={10} textAlign="center">
          <Heading size="lg" mb={4}>Space not found</Heading>
          <Button onClick={() => navigate('/spaces')}>Back to Spaces</Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="7xl" py={5}>
        <Grid templateColumns={{ base: '1fr', lg: '3fr 1fr' }} gap={8}>
          <GridItem>
            <Box mb={6}>
              <Flex justify="space-between" align="center" mb={3}>
                <Badge colorScheme={space.status === 'live' ? 'green' : 'blue'} px={2} py={1} borderRadius="full">
                  {space.status === 'live' ? 'LIVE NOW' : 'SCHEDULED'}
                </Badge>
                <Flex>
                  <IconButton
                    aria-label="Favorite"
                    icon={<StarIcon />}
                    variant="ghost"
                    color={space.isFavorite ? 'yellow.500' : 'gray.400'}
                    mr={2}
                    onClick={toggleFavorite}
                  />
                  <IconButton
                    aria-label="Share"
                    icon={<ShareIcon />}
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
                </Flex>
              </Flex>
              
              <Heading mb={4}>{space.title}</Heading>
              
              <Flex align="center" mb={4}>
                <Avatar size="sm" src={space.host.image} name={space.host.name} mr={2} />
                <Text>Hosted by <Text as="span" fontWeight="bold">{space.host.name}</Text></Text>
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
            </Box>
            
            <Box>
              <UsersList users={users.filter(u => u.role === 'host' || u.role === 'speaker')} type="speakers" />
            </Box>
          </GridItem>
          
          <GridItem>
            <Box position="sticky" top="100px">
              <Box bg="white" p={5} borderRadius="md" boxShadow="md" mb={6}>
                <UsersList users={users.filter(u => u.role === 'listener')} type="listeners" />
              </Box>

              <Flex gap={4} justifyContent="center" mt={6}>
                <Button
                  colorScheme={isMuted ? 'gray' : 'green'}
                  leftIcon={<MicrophoneIcon />}
                  onClick={toggleMute}
                >
                  {isMuted ? 'Unmute' : 'Mute'}
                </Button>
                <Button
                  colorScheme="red"
                  variant="outline"
                  onClick={leaveSpace}
                >
                  Leave
                </Button>
              </Flex>
            </Box>
          </GridItem>
        </Grid>
      </Container>

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
          </ModalBody>
          <ModalFooter>
            <Button colorScheme="blue" mr={3} onClick={onClose}>
              Close
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default SpaceDetailPage;
