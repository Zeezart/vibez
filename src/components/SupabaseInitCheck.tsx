
import React from 'react';
import { 
  Box, 
  ChakraAlert, 
  AlertIcon, 
  AlertTitle, 
  AlertDescription, 
  Center,
  VStack,
  Heading,
  Text,
} from '@chakra-ui/react';
import { supabase } from '../integrations/supabase/client';

const SupabaseInitCheck: React.FC = () => {
  // Instead of checking env vars, check if we can access the Supabase client
  const isSupabaseConnected = Boolean(supabase && supabase.auth);
  
  if (isSupabaseConnected) return null;
  
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
