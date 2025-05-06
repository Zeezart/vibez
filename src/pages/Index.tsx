
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Flex, Heading, Text, Button, Box, Image, Stack } from '@chakra-ui/react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If user is logged in, redirect them to the spaces page
    if (user) {
      navigate('/spaces');
    }
  }, [user, navigate]);

  // If user is logged in, this component will redirect, but we'll return content
  // in case there's a delay in the redirect
  return (
    <Layout showSidebar={false}>
      <Flex 
        direction="column" 
        align="center" 
        justify="center" 
        minH="calc(100vh - 64px)"
        textAlign="center"
        px={6}
      >
        <Heading 
          as="h1" 
          size="2xl" 
          mb={4} 
          bgGradient="linear(to-r, purple.500, purple.300)"
          bgClip="text"
        >
          Welcome to Vibez
        </Heading>
        
        <Text fontSize="xl" mb={8} maxW="xl">
          Connect with friends in real-time audio spaces, chat, and share moments together.
        </Text>
        
        <Stack direction={{ base: 'column', md: 'row' }} spacing={4}>
          <Button 
            size="lg" 
            colorScheme="purple" 
            onClick={() => navigate('/signup')}
          >
            Get Started
          </Button>
          
          <Button 
            size="lg" 
            variant="outline" 
            colorScheme="purple" 
            onClick={() => navigate('/login')}
          >
            Log In
          </Button>
        </Stack>
        
        <Box mt={12} maxW="800px">
          <Image 
            src="/placeholder.svg" 
            alt="Vibez App Preview" 
            borderRadius="xl" 
            shadow="xl"
          />
        </Box>
      </Flex>
    </Layout>
  );
};

export default Index;
