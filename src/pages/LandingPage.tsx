
import React from 'react';
import { 
  Box, 
  Heading, 
  Text, 
  Button, 
  Container, 
  Stack, 
  Image, 
  SimpleGrid,
  Icon,
  Flex,
  useColorModeValue
} from '@chakra-ui/react';
import { Link } from 'react-router-dom';
import { ArrowForwardIcon, CheckIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';

const Feature = ({ title, text, icon }: { title: string; text: string; icon: React.ReactElement }) => {
  return (
    <Stack>
      <Flex
        w={16}
        h={16}
        align={'center'}
        justify={'center'}
        color={'white'}
        rounded={'full'}
        bg={'purple.500'}
        mb={1}>
        {icon}
      </Flex>
      <Text fontWeight={600}>{title}</Text>
      <Text color={'gray.600'}>{text}</Text>
    </Stack>
  );
};

const LandingPage: React.FC = () => {
  return (
    <Layout showSidebar={false}>
      <Box bg={useColorModeValue('gray.50', 'gray.900')}>
        <Container maxW={'7xl'}>
          <Stack
            align={'center'}
            spacing={{ base: 8, md: 10 }}
            py={{ base: 20, md: 28 }}
            direction={{ base: 'column', md: 'row' }}>
            <Stack flex={1} spacing={{ base: 5, md: 10 }}>
              <Heading
                lineHeight={1.1}
                fontWeight={600}
                fontSize={{ base: '3xl', sm: '4xl', lg: '6xl' }}>
                <Text
                  as={'span'}
                  position={'relative'}
                  _after={{
                    content: "''",
                    width: 'full',
                    height: '30%',
                    position: 'absolute',
                    bottom: 1,
                    left: 0,
                    bg: 'purple.400',
                    zIndex: -1,
                  }}>
                  Live Audio Conversations,
                </Text>
                <br />
                <Text as={'span'} color={'purple.600'}>
                  Anytime, Anywhere!
                </Text>
              </Heading>
              <Text color={'gray.500'}>
                Join Vibez, where you can host and participate in live audio conversations.
                Discuss topics that matter to you, network with like-minded individuals, and
                build your community through the power of voice.
              </Text>
              <Stack
                spacing={{ base: 4, sm: 6 }}
                direction={{ base: 'column', sm: 'row' }}>
                <Button
                  as={Link}
                  to="/signup"
                  rounded={'full'}
                  size={'lg'}
                  fontWeight={'normal'}
                  px={6}
                  colorScheme={'purple'}
                  rightIcon={<ArrowForwardIcon />}>
                  Get Started
                </Button>
                <Button
                  as={Link}
                  to="/spaces"
                  rounded={'full'}
                  size={'lg'}
                  fontWeight={'normal'}
                  px={6}
                  variant="outline"
                  colorScheme="purple">
                  Explore Spaces
                </Button>
              </Stack>
            </Stack>
            <Flex
              flex={1}
              justify={'center'}
              align={'center'}
              position={'relative'}
              w={'full'}>
              <Box
                position={'relative'}
                height={'300px'}
                rounded={'2xl'}
                boxShadow={'2xl'}
                width={'full'}
                overflow={'hidden'}>
                <Image
                  alt={'Hero Image'}
                  fit={'cover'}
                  align={'center'}
                  w={'100%'}
                  h={'100%'}
                  src={'https://images.unsplash.com/photo-1603138597975-8b1dd178295d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&w=1470&q=80'}
                />
              </Box>
            </Flex>
          </Stack>

          <Box p={4}>
            <SimpleGrid columns={{ base: 1, md: 3 }} spacing={10} py={10}>
              <Feature
                icon={<Icon as={CheckIcon} w={10} h={10} />}
                title={'Live Audio Rooms'}
                text={'Create or join audio rooms and engage in real-time conversations on topics that interest you.'}
              />
              <Feature
                icon={<Icon as={CheckIcon} w={10} h={10} />}
                title={'Schedule Spaces'}
                text={'Plan ahead by scheduling your audio spaces and invite others to join at the designated time.'}
              />
              <Feature
                icon={<Icon as={CheckIcon} w={10} h={10} />}
                title={'Connect & Network'}
                text={'Build your community, find like-minded individuals, and expand your network.'}
              />
            </SimpleGrid>
          </Box>
        </Container>
      </Box>
    </Layout>
  );
};

export default LandingPage;
