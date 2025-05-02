import React, { useState, useEffect } from 'react';
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
  Card,
  CardBody,
  Avatar,
  Flex,
  IconButton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalCloseButton,
  ModalFooter,
  Spinner,
  useToast,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { EditIcon } from '@chakra-ui/icons';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
  });
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  useEffect(() => {
    if (profile) {
      setFormData({
        fullName: profile.full_name || '',
        username: profile.username || '',
      });
      
      if (profile.avatar_url) {
        setAvatarUrl(profile.avatar_url);
      }
    }
  }, [profile]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Refresh the profile data
      if (refreshProfile) {
        await refreshProfile();
      }

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

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setUploadLoading(true);

    try {
      // Upload the file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Create avatars bucket if it doesn't exist
      const { data: bucketData, error: bucketError } = await supabase.storage.getBucket('avatars');
      
      if (bucketError && bucketError.message.includes('The resource was not found')) {
        const { error: createError } = await supabase.storage.createBucket('avatars', {
          public: true,
          fileSizeLimit: 2097152, // 2MB
        });
        
        if (createError) throw createError;
      }

      const { error: uploadError, data } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data: publicURL } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      if (!publicURL.publicUrl) throw new Error('Failed to get public URL');

      // Update the avatar URL in the profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          avatar_url: publicURL.publicUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (updateError) throw updateError;

      // Update state
      setAvatarUrl(publicURL.publicUrl);
      
      // Refresh the profile data
      if (refreshProfile) {
        await refreshProfile();
      }

      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

      onClose();
    } catch (error: any) {
      console.error('Error uploading avatar:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update avatar",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setUploadLoading(false);
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
                  <Box position="relative" mb={4}>
                    <Avatar
                      size="2xl"
                      name={formData.fullName || user.email}
                      src={avatarUrl || undefined}
                      mb={2}
                    />
                    <IconButton
                      aria-label="Change avatar"
                      icon={<EditIcon />}
                      size="sm"
                      colorScheme="purple"
                      rounded="full"
                      position="absolute"
                      bottom={0}
                      right={0}
                      onClick={onOpen}
                    />
                  </Box>
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

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Change Profile Picture</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            {uploadLoading ? (
              <Flex justify="center" py={8}>
                <Spinner size="xl" color="purple.500" />
              </Flex>
            ) : (
              <FormControl>
                <FormLabel>Select an image</FormLabel>
                <Input 
                  type="file" 
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  p={1}
                />
                <Text mt={2} fontSize="sm" color="gray.500">
                  Maximum file size: 2 MB
                </Text>
              </FormControl>
            )}
          </ModalBody>
          <ModalFooter>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default ProfilePage;
