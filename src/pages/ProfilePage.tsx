
import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Flex,
  Button,
  Avatar,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Stat,
  StatLabel,
  StatNumber,
  useToast,
} from '@chakra-ui/react';
import { EditIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';
import SpaceCard, { SpaceProps } from '../components/SpaceCard';
import { useAuth } from '../context/AuthContext';

// Mock data for hosted spaces
const HOSTED_SPACES: SpaceProps[] = [
  {
    id: '1',
    title: 'Tech Talk: AI and the Future of Work',
    description: 'Join us for a discussion on how AI is transforming the workplace and what skills will be valuable in the future.',
    status: 'live',
    participantsCount: 120,
    participants: [
      { id: '1', name: 'John Doe', image: 'https://bit.ly/dan-abramov' },
      { id: '2', name: 'Sarah Miller', image: 'https://bit.ly/ryan-florence' },
    ],
    host: { id: '1', name: 'John Doe', image: 'https://bit.ly/dan-abramov' },
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
      { id: '1', name: 'John Doe', image: 'https://bit.ly/dan-abramov' },
      { id: '4', name: 'Emma Wilson', image: 'https://bit.ly/kent-c-dodds' },
    ],
    host: { id: '1', name: 'John Doe', image: 'https://bit.ly/dan-abramov' },
    tags: ['Marketing', 'Trends'],
    isFavorite: false,
  },
];

// Mock data for participated spaces
const PARTICIPATED_SPACES: SpaceProps[] = [
  {
    id: '3',
    title: 'Mental Health and Remote Work',
    description: 'Discussing strategies for maintaining good mental health while working remotely.',
    status: 'ended',
    participantsCount: 75,
    participants: [
      { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
      { id: '1', name: 'John Doe', image: 'https://bit.ly/dan-abramov' },
    ],
    host: { id: '3', name: 'Michael Brown', image: 'https://bit.ly/prosper-baba' },
    tags: ['Mental Health', 'Remote Work'],
    isFavorite: true,
  },
];

const ProfilePage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();

  if (!user) {
    return (
      <Layout>
        <Container maxW="4xl" py={10} textAlign="center">
          <Heading mb={4}>Please log in to view your profile</Heading>
          <Button colorScheme="purple" as="a" href="/login">
            Log In
          </Button>
        </Container>
      </Layout>
    );
  }

  return (
    <Layout>
      <Container maxW="4xl" py={8}>
        <Box mb={10}>
          <Flex
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'center', md: 'start' }}
            justify="space-between"
          >
            <Flex
              direction={{ base: 'column', md: 'row' }}
              align="center"
              mb={{ base: 6, md: 0 }}
            >
              <Avatar
                size="2xl"
                name={user.name}
                src={user.profileImage}
                mb={{ base: 4, md: 0 }}
                mr={{ md: 6 }}
              />
              <Box textAlign={{ base: 'center', md: 'left' }}>
                <Heading size="xl" mb={1}>
                  {user.name}
                </Heading>
                <Text color="gray.600" fontSize="lg" mb={3}>
                  @{user.username}
                </Text>
                <Text maxW="md" mb={4}>
                  Tech enthusiast, coffee lover, and audio space host. Join my weekly discussions about the latest in technology and innovation.
                </Text>
              </Box>
            </Flex>
            
            <Button
              leftIcon={<EditIcon />}
              colorScheme="purple"
              variant="outline"
              alignSelf={{ base: 'center', md: 'start' }}
            >
              Edit Profile
            </Button>
          </Flex>
        </Box>
        
        <SimpleGrid columns={{ base: 1, md: 3 }} spacing={6} mb={10}>
          <Stat
            px={4}
            py={3}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            textAlign="center"
          >
            <StatLabel color="gray.500" fontSize="sm">Spaces Hosted</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="purple.600">
              {HOSTED_SPACES.length}
            </StatNumber>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            textAlign="center"
          >
            <StatLabel color="gray.500" fontSize="sm">Spaces Participated</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="purple.600">
              {PARTICIPATED_SPACES.length}
            </StatNumber>
          </Stat>
          
          <Stat
            px={4}
            py={3}
            bg="white"
            borderRadius="lg"
            boxShadow="sm"
            textAlign="center"
          >
            <StatLabel color="gray.500" fontSize="sm">Followers</StatLabel>
            <StatNumber fontSize="3xl" fontWeight="bold" color="purple.600">
              25
            </StatNumber>
          </Stat>
        </SimpleGrid>
        
        <Tabs colorScheme="purple" mb={8}>
          <TabList>
            <Tab>Hosted Spaces</Tab>
            <Tab>Participated Spaces</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0} pt={4}>
              {HOSTED_SPACES.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500">You haven't hosted any spaces yet</Text>
                  <Button
                    colorScheme="purple"
                    mt={4}
                    as="a"
                    href="/create-space"
                  >
                    Create Your First Space
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {HOSTED_SPACES.map(space => (
                    <SpaceCard key={space.id} space={space} />
                  ))}
                </SimpleGrid>
              )}
            </TabPanel>
            
            <TabPanel p={0} pt={4}>
              {PARTICIPATED_SPACES.length === 0 ? (
                <Box textAlign="center" py={10}>
                  <Text fontSize="lg" color="gray.500">You haven't participated in any spaces yet</Text>
                  <Button
                    colorScheme="purple"
                    mt={4}
                    as="a"
                    href="/spaces"
                  >
                    Discover Spaces
                  </Button>
                </Box>
              ) : (
                <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6}>
                  {PARTICIPATED_SPACES.map(space => (
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

export default ProfilePage;
