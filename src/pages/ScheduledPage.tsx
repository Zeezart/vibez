
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
import { CalendarIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';

// Mock data for scheduled spaces
const SCHEDULED_SPACES: SpaceProps[] = [
  {
    id: '2',
    title: 'Marketing in 2023: Trends and Predictions',
    description: 'Explore the latest marketing trends and what to expect in the coming year.',
    status: 'scheduled',
    scheduledFor: '2023-05-15T15:00:00Z',
    participantsCount: 45,
    participants: [
      { id: '2', name: 'Sarah Miller', image: 'https://bit.ly/ryan-florence' },
      { id: '4', name: 'Emma Wilson', image: 'https://bit.ly/kent-c-dodds' },
    ],
    host: { id: '2', name: 'Sarah Miller', image: 'https://bit.ly/ryan-florence' },
    tags: ['Marketing', 'Trends'],
    isFavorite: false,
  },
  {
    id: '5',
    title: 'Web3 and the Future of Finance',
    description: 'Discussing cryptocurrencies, blockchain and decentralized finance.',
    status: 'scheduled',
    scheduledFor: '2023-05-20T18:00:00Z',
    participantsCount: 32,
    participants: [
      { id: '1', name: 'Alex Johnson', image: 'https://bit.ly/dan-abramov' },
      { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
    ],
    host: { id: '1', name: 'Alex Johnson', image: 'https://bit.ly/dan-abramov' },
    tags: ['Crypto', 'Web3', 'Finance'],
    isFavorite: true,
  },
];

const ScheduledPage: React.FC = () => {
  const toast = useToast();
  
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

        {SCHEDULED_SPACES.length === 0 ? (
          <VStack spacing={6} py={10} textAlign="center">
            <Text fontSize="lg" color="gray.500">No scheduled spaces available</Text>
            <Button as={Link} to="/create-space" colorScheme="purple">
              Schedule a Space
            </Button>
          </VStack>
        ) : (
          <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
            {SCHEDULED_SPACES.map((space) => (
              <SpaceCard key={space.id} space={space} />
            ))}
          </SimpleGrid>
        )}
      </Container>
    </Layout>
  );
};

export default ScheduledPage;
