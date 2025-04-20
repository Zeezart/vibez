
import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
  Box, 
  Button, 
  FormControl, 
  FormLabel, 
  Input, 
  Heading, 
  Text, 
  Container, 
  Stack, 
  Card, 
  CardBody, 
  CardHeader, 
  CardFooter,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton
} from '@chakra-ui/react';
import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
import { supabase } from "@/integrations/supabase/client";

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You've been logged in successfully",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
      
      navigate('/');
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to login",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      console.error("Login error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box 
      minH="100vh" 
      bgGradient="linear(to-br, purple.50, blue.50)" 
      display="flex" 
      alignItems="center" 
      justifyContent="center"
      p={4}
    >
      <Container maxW="md">
        <Card
          bg="white"
          borderRadius="xl"
          boxShadow="xl"
          overflow="hidden"
          border="none"
          p={2}
        >
          <CardHeader textAlign="center" pb={6} pt={8}>
            <Heading
              as="h1"
              size="xl"
              bgGradient="linear(to-r, purple.600, indigo.600)"
              backgroundClip="text"
              mb={2}
            >
              Welcome Back
            </Heading>
            <Text color="gray.500" fontSize="lg">
              Sign in to your account
            </Text>
          </CardHeader>
          <CardBody pt={0} pb={6} px={8}>
            <form onSubmit={handleSubmit}>
              <Stack spacing={6}>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium" fontSize="sm" color="gray.700">Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="hello@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    size="lg"
                    focusBorderColor="purple.400"
                  />
                </FormControl>
                <FormControl isRequired>
                  <FormLabel fontWeight="medium" fontSize="sm" color="gray.700">Password</FormLabel>
                  <InputGroup size="lg">
                    <Input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      focusBorderColor="purple.400"
                    />
                    <InputRightElement>
                      <IconButton
                        size="sm"
                        variant="ghost"
                        aria-label={showPassword ? 'Hide password' : 'Show password'}
                        icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Button
                  type="submit"
                  isLoading={isLoading}
                  loadingText="Signing in..."
                  bgGradient="linear(to-r, purple.600, indigo.600)"
                  color="white"
                  _hover={{ bgGradient: "linear(to-r, purple.700, indigo.700)" }}
                  _active={{ bgGradient: "linear(to-r, purple.800, indigo.800)" }}
                  size="lg"
                  fontSize="md"
                  height="50px"
                  shadow="md"
                  transition="all 0.2s"
                >
                  Sign In
                </Button>
              </Stack>
            </form>
          </CardBody>
          <CardFooter 
            borderTop="1px" 
            borderColor="gray.100" 
            textAlign="center" 
            pt={6} 
            pb={6}
          >
            <Text w="full" fontSize="sm" color="gray.600">
              Don't have an account?{" "}
              <Link to="/signup">
                <Text as="span" color="purple.600" fontWeight="semibold" _hover={{ color: "purple.700" }}>
                  Create one now
                </Text>
              </Link>
            </Text>
          </CardFooter>
        </Card>
      </Container>
    </Box>
  );
};

export default LoginPage;
