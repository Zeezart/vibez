
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  VStack,
  Button,
  useToast,
} from '@chakra-ui/react';
import { StarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';

// Mock data for favorite spaces
const FAVORITE_SPACES: SpaceProps[] = [
  {
    id: '1',
    title: 'Tech Talk: AI and the Future of Work',
    description: 'Join us for a discussion on how AI is transforming the workplace and what skills will be valuable in the future.',
    status: 'live',
    participantsCount: 120,
    participants: [
      { id: '1', name: 'Alex Johnson', image: 'https://bit.ly/dan-abramov' },
      { id: '2', name: 'Sarah Miller', image: 'https://bit.ly/ryan-florence' },
      { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
    ],
    host: { id: '1', name: 'Alex Johnson', image: 'https://bit.ly/dan-abramov' },
    tags: ['Tech', 'AI', 'Future'],
    isFavorite: true,
  },
  {
    id: '3',
    title: 'Mental Health and Remote Work',
    description: 'Discussing strategies for maintaining good mental health while working remotely.',
    status: 'live',
    participantsCount: 75,
    participants: [
      { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
      { id: '5', name: 'David Clark', image: 'https://bit.ly/code-beast' },
    ],
    host: { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
    tags: ['Mental Health', 'Remote Work'],
    isFavorite: true,
  },
];

const FavoritesPage: React.FC = () => {
  const toast = useToast();
  
  const removeFromFavorites = (spaceId: string) => {
    toast({
      title: "Removed from favorites",
      status: "success",
      duration: 2000,
      isClosable: true,
    });
  };
  
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

        {FAVORITE_SPACES.length === 0 ? (
          <VStack spacing={6} py={10} textAlign="center">
            <Text fontSize="lg" color="gray.500">You haven't favorited any spaces yet</Text>
            <Button as={Link} to="/spaces" colorScheme="purple">
              Browse Spaces
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {FAVORITE_SPACES.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Layout>
  );
};

export default FavoritesPage;
