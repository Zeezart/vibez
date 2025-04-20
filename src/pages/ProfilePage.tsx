
import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
  useToast,
  Card,
  CardBody,
  Avatar,
  Flex,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const ProfilePage = () => {
  const { user, profile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || '',
    username: profile?.username || '',
    avatarUrl: profile?.avatar_url || '',
  });
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          avatar_url: formData.avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      toast({
        title: "Profile updated",
        description: "Your profile has been successfully updated",
        status: "success",
        duration: 5000,
        isClosable: true,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to update profile",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <Box 
        minH="calc(100vh - 64px)"
        bg="gray.50"
        py={8}
      >
        <Container maxW="xl">
          <Card
            bg="white"
            shadow="xl"
            borderRadius="xl"
            overflow="hidden"
          >
            <CardBody p={8}>
              <VStack spacing={6} align="stretch">
                <Flex direction="column" align="center" mb={6}>
                  <Avatar
                    size="2xl"
                    name={formData.fullName || user.email}
                    src={formData.avatarUrl}
                    mb={4}
                  />
                  <Heading
                    size="lg"
                    bgGradient="linear(to-r, purple.600, indigo.600)"
                    backgroundClip="text"
                  >
                    Edit Profile
                  </Heading>
                  <Text color="gray.600" mt={2}>
                    Update your personal information
                  </Text>
                </Flex>

                <form onSubmit={handleSubmit}>
                  <VStack spacing={6}>
                    <FormControl>
                      <FormLabel>Full Name</FormLabel>
                      <Input
                        value={formData.fullName}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          fullName: e.target.value
                        }))}
                        placeholder="Enter your full name"
                        size="lg"
                        focusBorderColor="purple.400"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Username</FormLabel>
                      <Input
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          username: e.target.value
                        }))}
                        placeholder="Choose a username"
                        size="lg"
                        focusBorderColor="purple.400"
                      />
                    </FormControl>

                    <FormControl>
                      <FormLabel>Avatar URL</FormLabel>
                      <Input
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          avatarUrl: e.target.value
                        }))}
                        placeholder="Enter avatar URL"
                        size="lg"
                        focusBorderColor="purple.400"
                      />
                    </FormControl>

                    <Button
                      type="submit"
                      isLoading={isLoading}
                      loadingText="Updating..."
                      bgGradient="linear(to-r, purple.600, indigo.600)"
                      color="white"
                      _hover={{
                        bgGradient: "linear(to-r, purple.700, indigo.700)"
                      }}
                      size="lg"
                      width="full"
                      fontSize="md"
                      height="50px"
                    >
                      Save Changes
                    </Button>
                  </VStack>
                </form>
              </VStack>
            </CardBody>
          </Card>
        </Container>
      </Box>
    </Layout>
  );
};

export default ProfilePage;
