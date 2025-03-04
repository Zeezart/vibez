
import React from 'react';
import { Box, Container, Heading, Text, Button, VStack } from '@chakra-ui/react';
import { Link, useLocation } from 'react-router-dom';
import Layout from '../components/Layout';

const NotFound: React.FC = () => {
  const location = useLocation();

  React.useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <Layout showSidebar={false}>
      <Container maxW="xl" py={20} textAlign="center">
        <VStack spacing={6}>
          <Heading size="4xl" color="brand.300">404</Heading>
          <Heading size="xl" mb={3}>Page Not Found</Heading>
          <Text fontSize="lg" color="gray.600" mb={6}>
            Sorry, the page you are looking for doesn't exist or has been moved.
          </Text>
          <Box>
            <Button as={Link} to="/" colorScheme="purple" size="lg">
              Return to Home
            </Button>
          </Box>
        </VStack>
      </Container>
    </Layout>
  );
};

export default NotFound;
