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
  Image,
  Grid,
  GridItem,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { EditIcon } from '@chakra-ui/icons';
import ProfileDetails from '../components/ProfileDetails';

const ProfilePage = () => {
  const { user, profile, refreshProfile } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [formData, setFormData] = useState({
    fullName: '',
    username: '',
  });
  const [hostedSpaces, setHostedSpaces] = useState<any[]>([]);
  const [loadingSpaces, setLoadingSpaces] = useState(false);
  
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
    
    if (user) {
      fetchUserSpaces();
    }
  }, [profile, user]);
  
  const fetchUserSpaces = async () => {
    if (!user) return;
    
    setLoadingSpaces(true);
    try {
      // Fetch spaces hosted by the user
      const { data: spaces, error } = await supabase
        .from('spaces')
        .select(`
          id,
          title,
          description,
          status,
          scheduled_for,
          created_at,
          host_id
        `)
        .eq('host_id', user.id)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      setHostedSpaces(spaces || []);
    } catch (error) {
      console.error('Error fetching user spaces:', error);
    } finally {
      setLoadingSpaces(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Update profile info
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.fullName,
          username: formData.username,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user?.id);

      if (error) throw error;

      // Process file upload if there's a selected file
      if (selectedFile) {
        await handleFileUpload();
      }

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

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    setSelectedFile(file);
    
    // Create a preview
    const objectUrl = URL.createObjectURL(file);
    setPreviewImage(objectUrl);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !user) return;
    
    setUploadLoading(true);

    try {
      // Upload the file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
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
        .upload(filePath, selectedFile, { upsert: true });

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
        .eq('id', user.id);

      if (updateError) throw updateError;

      // Update state
      setAvatarUrl(publicURL.publicUrl);
      
      toast({
        title: "Avatar updated",
        description: "Your profile picture has been updated",
        status: "success",
        duration: 5000,
        isClosable: true,
      });

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
      onClose();
    }
  };

  if (!user) {
    navigate('/login');
    return null;
  }

  return (
    <Layout>
      <Container maxW="6xl" py={6}>
        <Grid templateColumns={{ base: '1fr', md: '300px 1fr' }} gap={6}>
          {/* Profile Details Sidebar */}
          <GridItem>
            <ProfileDetails userId={user.id} isOwnProfile={true} />
          </GridItem>
          
          {/* Main Content Area */}
          <GridItem>
            <Card bg="white" shadow="md" borderRadius="lg" overflow="hidden">
              <CardBody p={0}>
                <Tabs>
                  <TabList px={6} pt={4}>
                    <Tab fontWeight="medium">Edit Profile</Tab>
                    <Tab fontWeight="medium">My Spaces</Tab>
                  </TabList>
                  
                  <TabPanels>
                    {/* Edit Profile Tab */}
                    <TabPanel p={6}>
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
                          <Text color="gray.600" fontSize="sm">
                            Click the edit icon to change your profile picture
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
                              colorScheme="purple"
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
                    </TabPanel>
                    
                    {/* My Spaces Tab */}
                    <TabPanel p={6}>
                      <VStack spacing={4} align="stretch">
                        <Heading size="md" mb={2}>My Hosted Spaces</Heading>
                        
                        {loadingSpaces ? (
                          <Flex justify="center" p={8}>
                            <Spinner size="lg" color="purple.500" />
                          </Flex>
                        ) : hostedSpaces.length > 0 ? (
                          hostedSpaces.map(space => (
                            <Box 
                              key={space.id} 
                              p={4} 
                              borderWidth="1px" 
                              borderRadius="md"
                              _hover={{ borderColor: 'purple.300', shadow: 'sm' }}
                              transition="all 0.2s"
                              cursor="pointer"
                              onClick={() => navigate(`/space/${space.id}`)}
                            >
                              <Flex justify="space-between" align="center">
                                <Box>
                                  <Heading size="sm">{space.title}</Heading>
                                  <Text color="gray.600" mt={1} noOfLines={2}>
                                    {space.description || 'No description'}
                                  </Text>
                                </Box>
                                <Box>
                                  <Text fontSize="sm" color="gray.500">
                                    {new Date(space.created_at).toLocaleDateString()}
                                  </Text>
                                  <Text 
                                    fontSize="xs" 
                                    mt={1}
                                    px={2}
                                    py={1}
                                    borderRadius="full"
                                    bg={space.status === 'live' ? 'green.100' : space.status === 'scheduled' ? 'blue.100' : 'gray.100'}
                                    color={space.status === 'live' ? 'green.700' : space.status === 'scheduled' ? 'blue.700' : 'gray.700'}
                                    textAlign="center"
                                  >
                                    {space.status.toUpperCase()}
                                  </Text>
                                </Box>
                              </Flex>
                            </Box>
                          ))
                        ) : (
                          <Box p={8} textAlign="center" bg="gray.50" borderRadius="md">
                            <Text color="gray.500">You haven't hosted any spaces yet.</Text>
                            <Button 
                              mt={4} 
                              colorScheme="purple" 
                              as={Link} 
                              to="/create-space"
                              size="sm"
                            >
                              Create Your First Space
                            </Button>
                          </Box>
                        )}
                      </VStack>
                    </TabPanel>
                  </TabPanels>
                </Tabs>
              </CardBody>
            </Card>
          </GridItem>
        </Grid>
      </Container>

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
              <VStack spacing={4}>
                <FormControl>
                  <FormLabel>Select an image</FormLabel>
                  <Input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileSelect}
                    p={1}
                  />
                  <Text mt={2} fontSize="sm" color="gray.500">
                    Maximum file size: 2 MB
                  </Text>
                </FormControl>
                
                {previewImage && (
                  <Box mt={4} textAlign="center">
                    <Text mb={2} fontWeight="bold">Preview:</Text>
                    <Image 
                      src={previewImage} 
                      alt="Preview" 
                      maxH="200px" 
                      borderRadius="md"
                      mx="auto"
                    />
                  </Box>
                )}
              </VStack>
            )}
          </ModalBody>
          <ModalFooter>
            <Button 
              variant="ghost" 
              mr={3} 
              onClick={onClose}
              isDisabled={uploadLoading}
            >
              Cancel
            </Button>
            <Button 
              colorScheme="purple" 
              onClick={handleFileUpload}
              isLoading={uploadLoading}
              isDisabled={!selectedFile || uploadLoading}
            >
              Upload
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Layout>
  );
};

export default ProfilePage;
