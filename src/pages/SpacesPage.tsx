
import React, { useState } from 'react';
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
} from '@chakra-ui/react';
import { SearchIcon } from '@chakra-ui/icons';
import { Link } from 'react-router-dom';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';

// Mock data for spaces
const MOCK_SPACES: SpaceProps[] = [
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
  {
    id: '4',
    title: 'Startup Fundraising Strategies',
    description: 'Learn about different approaches to raising capital for your startup.',
    status: 'ended',
    participantsCount: 200,
    participants: [
      { id: '4', name: 'Emma Wilson', image: 'https://bit.ly/kent-c-dodds' },
      { id: '6', name: 'John Taylor', image: 'https://bit.ly/sage-adebayo' },
    ],
    host: { id: '4', name: 'Emma Wilson', image: 'https://bit.ly/kent-c-dodds' },
    tags: ['Startup', 'Fundraising', 'Business'],
    isFavorite: false,
  },
];

const SpacesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState('all');
  const toast = useToast();

  const filteredSpaces = MOCK_SPACES.filter(space => {
    // Filter by search query
    const matchesSearch = space.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        space.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                        space.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
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
              placeholder="Search spaces by title, description, or tags"
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
                    <SpaceCard key={space.id} space={space} />
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
                    <SpaceCard key={space.id} space={space} />
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
                    <SpaceCard key={space.id} space={space} />
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
                    <SpaceCard key={space.id} space={space} />
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
