import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Heading,
  Input,
  Stack,
  Textarea,
  FormErrorMessage,
  Switch,
  Flex,
  Text,
  Tag,
  TagLabel,
  TagCloseButton,
  useToast,
  InputGroup,
  InputRightElement,
  Alert,
  AlertIcon,
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';
import { AddIcon } from '@chakra-ui/icons';
import { supabase } from '../integrations/supabase/client';
import { useAuth } from '../context/AuthContext';

const CreateSpacePage: React.FC = () => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [tag, setTag] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [errors, setErrors] = useState({
    title: '',
    description: '',
    scheduledDate: '',
    scheduledTime: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  
  const toast = useToast();
  const navigate = useNavigate();
  const { user } = useAuth();

  const validateForm = () => {
    const newErrors = {
      title: '',
      description: '',
      scheduledDate: '',
      scheduledTime: '',
    };
    let isValid = true;

    if (!title.trim()) {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!description.trim()) {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if (isScheduled) {
      if (!scheduledDate) {
        newErrors.scheduledDate = 'Date is required for scheduled spaces';
        isValid = false;
      }
      
      if (!scheduledTime) {
        newErrors.scheduledTime = 'Time is required for scheduled spaces';
        isValid = false;
      }
    }

    setErrors(newErrors);
    return isValid;
  };

  const addTag = () => {
    if (tag.trim() && !tags.includes(tag.trim())) {
      setTags([...tags, tag.trim()]);
      setTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to create a space',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      navigate('/login');
      return;
    }
    
    if (!validateForm()) return;
    
    setIsLoading(true);
    
    try {
      // Build space data object
      const spaceData: any = {
        title,
        description,
        status: isScheduled ? 'scheduled' : 'live',
        host_id: user.id,
        // Only add tags if there are any
        ...(tags.length > 0 && { tags: tags }),
      };
      
      // Add scheduled_for only if it's a scheduled space
      if (isScheduled) {
        spaceData.scheduled_for = `${scheduledDate}T${scheduledTime}:00`;
      }
      
      console.log('Creating space with data:', spaceData);
      
      // Insert the space into the database
      const { data: space, error } = await supabase
        .from('spaces')
        .insert(spaceData)
        .select('id, share_link')
        .single();
      
      if (error) {
        console.error('Error creating space:', error);
        throw error;
      }
      
      if (!space) throw new Error('Failed to create space');
      
      // Add the host as a participant with role 'host'
      const { error: participantError } = await supabase
        .from('space_participants')
        .insert({
          space_id: space.id,
          user_id: user.id,
          role: 'host',
        });
      
      if (participantError) throw participantError;
      
      toast({
        title: isScheduled ? 'Space scheduled' : 'Space created',
        description: isScheduled ? 'Your space has been scheduled successfully' : 'Your space is now live',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
      
      // Redirect to the space detail page
      navigate(`/space/${space.id}`);
    } catch (error: any) {
      console.error('Error creating space:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create space',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Layout>
      <Container maxW="3xl" py={8}>
        <Box mb={8}>
          <Heading size="lg" mb={2}>Create a Space</Heading>
          <Text color="gray.600">
            Set up your audio conversation room
          </Text>
        </Box>
        
        {!user && (
          <Alert status="warning" mb={6}>
            <AlertIcon />
            You must be logged in to create a space
          </Alert>
        )}
        
        <Box as="form" onSubmit={handleSubmit} bg="white" p={6} borderRadius="lg" boxShadow="md">
          <Stack spacing={6}>
            <FormControl isInvalid={!!errors.title}>
              <FormLabel>Title</FormLabel>
              <Input
                placeholder="What's your space about?"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <FormErrorMessage>{errors.title}</FormErrorMessage>
            </FormControl>
            
            <FormControl isInvalid={!!errors.description}>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Tell people what to expect in this space"
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
              <FormErrorMessage>{errors.description}</FormErrorMessage>
            </FormControl>
            
            <FormControl display="flex" alignItems="center">
              <FormLabel htmlFor="is-scheduled" mb="0">
                Schedule for later?
              </FormLabel>
              <Switch
                id="is-scheduled"
                colorScheme="purple"
                isChecked={isScheduled}
                onChange={(e) => setIsScheduled(e.target.checked)}
              />
            </FormControl>
            
            {isScheduled && (
              <Flex gap={4} direction={{ base: 'column', md: 'row' }}>
                <FormControl isInvalid={!!errors.scheduledDate}>
                  <FormLabel>Date</FormLabel>
                  <Input
                    type="date"
                    value={scheduledDate}
                    onChange={(e) => setScheduledDate(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                  />
                  <FormErrorMessage>{errors.scheduledDate}</FormErrorMessage>
                </FormControl>
                
                <FormControl isInvalid={!!errors.scheduledTime}>
                  <FormLabel>Time</FormLabel>
                  <Input
                    type="time"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                  />
                  <FormErrorMessage>{errors.scheduledTime}</FormErrorMessage>
                </FormControl>
              </Flex>
            )}
            
            <FormControl>
              <FormLabel>Tags</FormLabel>
              <InputGroup>
                <Input
                  placeholder="Add tags to help people find your space"
                  value={tag}
                  onChange={(e) => setTag(e.target.value)}
                  onKeyDown={handleKeyDown}
                />
                <InputRightElement>
                  <Button h="1.75rem" size="sm" onClick={addTag}>
                    <AddIcon />
                  </Button>
                </InputRightElement>
              </InputGroup>
              
              <Box mt={2}>
                {tags.map((t, i) => (
                  <Tag
                    key={i}
                    size="md"
                    borderRadius="full"
                    variant="solid"
                    colorScheme="purple"
                    m={1}
                  >
                    <TagLabel>{t}</TagLabel>
                    <TagCloseButton onClick={() => removeTag(t)} />
                  </Tag>
                ))}
              </Box>
            </FormControl>
            
            <Button
              mt={4}
              colorScheme="purple"
              type="submit"
              size="lg"
              isLoading={isLoading}
              isDisabled={!user}
            >
              {isScheduled ? 'Schedule Space' : 'Create Space Now'}
            </Button>
          </Stack>
        </Box>
      </Container>
    </Layout>
  );
};

export default CreateSpacePage;
