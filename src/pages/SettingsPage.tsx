
import React, { useState } from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  Avatar,
  Switch,
  Divider,
  useToast,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { SettingsIcon } from '@chakra-ui/icons';
import Layout from '../components/Layout';
import { useAuth } from '../context/AuthContext';

const SettingsPage: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  
  // Form state would typically be managed with a form library like react-hook-form
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [bio, setBio] = useState('Tech enthusiast, coffee lover, and audio space host.');
  
  // Notification settings
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [spaceReminders, setSpaceReminders] = useState(true);
  const [mentionAlerts, setMentionAlerts] = useState(true);
  
  const handleSaveProfile = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Profile updated",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };
  
  const handleSaveNotifications = () => {
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Notification preferences saved",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }, 1000);
  };
  
  return (
    <Layout>
      <Container maxW="4xl" py={6}>
        <Box mb={8}>
          <Heading mb={3} display="flex" alignItems="center">
            <SettingsIcon mr={3} /> Settings
          </Heading>
          <Text color="gray.600">
            Manage your account and preferences
          </Text>
        </Box>
        
        <Tabs colorScheme="purple">
          <TabList mb={6}>
            <Tab>Profile</Tab>
            <Tab>Notifications</Tab>
            <Tab>Privacy</Tab>
            <Tab>Account</Tab>
          </TabList>
          
          <TabPanels>
            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                <VStack spacing={6} align="stretch">
                  <HStack spacing={8} align="start">
                    <VStack>
                      <Avatar 
                        size="2xl" 
                        name={user?.name} 
                        src={user?.profileImage} 
                      />
                      <Button size="sm" colorScheme="purple" variant="outline">
                        Change Photo
                      </Button>
                    </VStack>
                    
                    <VStack spacing={4} align="stretch" flex={1}>
                      <FormControl>
                        <FormLabel>Name</FormLabel>
                        <Input 
                          value={name} 
                          onChange={(e) => setName(e.target.value)}
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Email</FormLabel>
                        <Input 
                          value={email} 
                          onChange={(e) => setEmail(e.target.value)}
                          type="email"
                        />
                      </FormControl>
                      
                      <FormControl>
                        <FormLabel>Bio</FormLabel>
                        <Input 
                          value={bio} 
                          onChange={(e) => setBio(e.target.value)}
                        />
                      </FormControl>
                    </VStack>
                  </HStack>
                  
                  <Divider />
                  
                  <Box>
                    <Button 
                      colorScheme="purple" 
                      onClick={handleSaveProfile}
                      isLoading={isLoading}
                    >
                      Save Changes
                    </Button>
                  </Box>
                </VStack>
              </Box>
            </TabPanel>
            
            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                <VStack spacing={6} align="stretch">
                  <FormControl display="flex" alignItems="center">
                    <Switch 
                      colorScheme="purple" 
                      id="email-notifications" 
                      isChecked={emailNotifications}
                      onChange={() => setEmailNotifications(!emailNotifications)}
                      mr={3}
                    />
                    <FormLabel htmlFor="email-notifications" mb={0}>
                      Email Notifications
                    </FormLabel>
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <Switch 
                      colorScheme="purple" 
                      id="space-reminders" 
                      isChecked={spaceReminders}
                      onChange={() => setSpaceReminders(!spaceReminders)}
                      mr={3}
                    />
                    <FormLabel htmlFor="space-reminders" mb={0}>
                      Space Reminders
                    </FormLabel>
                  </FormControl>
                  
                  <FormControl display="flex" alignItems="center">
                    <Switch 
                      colorScheme="purple" 
                      id="mention-alerts" 
                      isChecked={mentionAlerts}
                      onChange={() => setMentionAlerts(!mentionAlerts)}
                      mr={3}
                    />
                    <FormLabel htmlFor="mention-alerts" mb={0}>
                      Mention Alerts
                    </FormLabel>
                  </FormControl>
                  
                  <Divider />
                  
                  <Box>
                    <Button 
                      colorScheme="purple" 
                      onClick={handleSaveNotifications}
                      isLoading={isLoading}
                    >
                      Save Preferences
                    </Button>
                  </Box>
                </VStack>
              </Box>
            </TabPanel>
            
            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                <Text>Privacy settings coming soon...</Text>
              </Box>
            </TabPanel>
            
            <TabPanel p={0}>
              <Box bg="white" p={6} borderRadius="lg" boxShadow="md">
                <Text>Account settings coming soon...</Text>
              </Box>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </Container>
    </Layout>
  );
};

export default SettingsPage;
