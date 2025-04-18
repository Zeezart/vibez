
import React from 'react';
import { Box, Alert, AlertIcon, AlertTitle, AlertDescription, Button, Link } from '@chakra-ui/react';

const SupabaseInitCheck: React.FC = () => {
  const isMissingEnvVars = !import.meta.env.VITE_SUPABASE_URL || !import.meta.env.VITE_SUPABASE_ANON_KEY;
  
  if (!isMissingEnvVars) return null;
  
  return (
    <Box p={4}>
      <Alert 
        status="error" 
        variant="subtle"
        flexDirection="column"
        alignItems="center"
        justifyContent="center"
        textAlign="center"
        height="200px"
        borderRadius="md"
      >
        <AlertIcon boxSize="40px" mr={0} />
        <AlertTitle mt={4} mb={1} fontSize="lg">
          Supabase Configuration Missing
        </AlertTitle>
        <AlertDescription maxWidth="sm">
          Your Supabase environment variables are not properly configured. 
          Make sure to connect to Supabase using the green button in the top right corner.
        </AlertDescription>
      </Alert>
    </Box>
  );
};

export default SupabaseInitCheck;
