
import React from 'react';
import { 
  Box, 
  Alert as ChakraAlert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription, 
  Center,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react';

const SupabaseInitCheck: React.FC = () => {
  const isMissingEnvVars = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!isMissingEnvVars) return null;
  
  return (
    <Center minH="100vh" p={4} position="fixed" top="0" left="0" right="0" bottom="0" zIndex="9999" bg="rgba(0, 0, 0, 0.5)">
      <VStack 
        spacing={6} 
        p={8} 
        bg="white" 
        boxShadow="xl" 
        borderRadius="md" 
        maxW="md" 
        w="full"
        align="center"
      >
        <Box color="red.500" fontSize="4xl">
          ⚠️
        </Box>
        <Heading size="lg" textAlign="center" color="red.500">
          Supabase Connection Required
        </Heading>
        
        <Text textAlign="center">
          This app requires a connection to Supabase to function properly. Please connect to Supabase using the green button in the top right corner of the page.
        </Text>
        
        <Box mt={4} width="100%">
          <ChakraAlert 
            status="info" 
            variant="subtle"
            borderRadius="md"
          >
            <AlertIcon />
            <Box>
              <AlertTitle>How to connect:</AlertTitle>
              <AlertDescription display="block">
                1. Click the green Supabase button in the top right corner<br />
                2. Follow the connection instructions<br />
                3. Refresh the page after connecting
              </AlertDescription>
            </Box>
          </ChakraAlert>
        </Box>
      </VStack>
    </Center>
  );
};

export default SupabaseInitCheck;
