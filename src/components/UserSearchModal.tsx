
import React, { useState, useEffect, useRef } from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Input,
  InputGroup,
  InputLeftElement,
  VStack,
  Text,
  Button,
  Spinner,
  Divider,
  Box,
  useToast
} from '@chakra-ui/react';
import { Search } from 'lucide-react';
import { supabase } from '../integrations/supabase/client';
import { useNavigate } from 'react-router-dom';

interface UserSearchResult {
  id: string;
  full_name: string;
  username: string;
  avatar_url: string;
}

interface UserSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const UserSearchModal: React.FC<UserSearchModalProps> = ({ isOpen, onClose }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserSearchResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentSearches, setRecentSearches] = useState<UserSearchResult[]>([]);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const navigate = useNavigate();
  const toast = useToast();
  
  useEffect(() => {
    // Load recent searches from local storage
    const loadRecentSearches = () => {
      const stored = localStorage.getItem('recentUserSearches');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setRecentSearches(parsed);
        } catch (e) {
          console.error('Error parsing recent searches:', e);
        }
      }
    };
    
    loadRecentSearches();
  }, []);
  
  // Search function with debounce
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    
    // Set new timeout
    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, username, avatar_url')
          .or(`username.ilike.%${query}%,full_name.ilike.%${query}%`)
          .limit(10);
          
        if (error) throw error;
        
        setResults(data || []);
      } catch (err) {
        console.error('Error searching users:', err);
        toast({
          title: 'Search Error',
          description: 'Failed to search for users',
          status: 'error',
          duration: 3000,
          isClosable: true,
        });
      } finally {
        setIsLoading(false);
      }
    }, 300);
    
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [query, toast]);
  
  const handleUserClick = (user: UserSearchResult) => {
    // Save to recent searches
    const newRecentSearches = [
      user,
      ...recentSearches.filter(item => item.id !== user.id)
    ].slice(0, 5); // Keep only 5 most recent
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('recentUserSearches', JSON.stringify(newRecentSearches));
    
    // Navigate to user profile
    navigate(`/profile/${user.id}`);
    onClose();
  };
  
  const renderUserItem = (user: UserSearchResult) => (
    <Box
      key={user.id}
      p={3}
      borderRadius="md"
      _hover={{ bg: 'gray.100' }}
      cursor="pointer"
      onClick={() => handleUserClick(user)}
      display="flex"
      alignItems="center"
    >
      <Box 
        w="40px" 
        h="40px" 
        borderRadius="full" 
        bg="purple.100" 
        mr={3} 
        backgroundImage={user.avatar_url ? `url(${user.avatar_url})` : undefined}
        backgroundSize="cover"
        backgroundPosition="center"
        display="flex"
        alignItems="center"
        justifyContent="center"
      >
        {!user.avatar_url && user.full_name.charAt(0)}
      </Box>
      <Box>
        <Text fontWeight="bold">{user.full_name}</Text>
        <Text fontSize="sm" color="gray.500">@{user.username}</Text>
      </Box>
    </Box>
  );
  
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md">
      <ModalOverlay />
      <ModalContent>
        <ModalHeader pb={2}>Search Users</ModalHeader>
        <ModalCloseButton />
        
        <ModalBody>
          <InputGroup mb={4}>
            <InputLeftElement>
              <Search size={18} />
            </InputLeftElement>
            <Input
              placeholder="Search by name or username"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoFocus
            />
          </InputGroup>
          
          {isLoading && (
            <Box textAlign="center" py={4}>
              <Spinner color="purple.500" />
            </Box>
          )}
          
          {!isLoading && query && results.length === 0 && (
            <Box textAlign="center" py={4}>
              <Text color="gray.500">No users found</Text>
            </Box>
          )}
          
          {!isLoading && results.length > 0 && (
            <VStack spacing={2} align="stretch">
              {results.map(user => renderUserItem(user))}
            </VStack>
          )}
          
          {!query && recentSearches.length > 0 && (
            <>
              <Text fontWeight="medium" mb={2}>Recent Searches</Text>
              <VStack spacing={2} align="stretch">
                {recentSearches.map(user => renderUserItem(user))}
              </VStack>
            </>
          )}
          
          {!query && recentSearches.length === 0 && (
            <Box textAlign="center" py={4}>
              <Text color="gray.500">Search for users by name or username</Text>
            </Box>
          )}
        </ModalBody>
        
        <ModalFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default UserSearchModal;
