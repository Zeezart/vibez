
import React from 'react';
import { Box, Text, Flex, Tag, Input, Button } from '@chakra-ui/react';
import { CalendarIcon } from '@chakra-ui/icons';
import { SpaceProps } from '../../../components/SpaceCard';

interface SpaceDescriptionProps {
  space: SpaceProps;
  joinLink?: string;
  copyShareLink: () => void;
}

const SpaceDescription: React.FC<SpaceDescriptionProps> = ({ 
  space, 
  joinLink,
  copyShareLink 
}) => {
  return (
    <>
      {space.tags && space.tags.length > 0 && (
        <Flex gap={2} flexWrap="wrap" mb={5}>
          {space.tags.map((tag) => (
            <Tag key={tag} colorScheme="purple" size="md">
              {tag}
            </Tag>
          ))}
        </Flex>
      )}
      
      {space.status === 'scheduled' && space.scheduledFor && (
        <Flex align="center" mb={5} color="blue.600">
          <CalendarIcon mr={2} />
          <Text>{new Date(space.scheduledFor).toLocaleString()}</Text>
        </Flex>
      )}
      
      <Box bg="gray.50" p={5} borderRadius="md" mb={6}>
        <Text>{space.description}</Text>
      </Box>
      
      {joinLink && (
        <Box bg="blue.50" p={5} borderRadius="md" mb={6}>
          <Text fontSize="sm" fontWeight="bold" mb={2}>Share this space</Text>
          <Flex align="center">
            <Input value={joinLink} isReadOnly bg="white" />
            <Button ml={2} colorScheme="blue" onClick={copyShareLink}>
              Copy
            </Button>
          </Flex>
        </Box>
      )}
    </>
  );
};

export default SpaceDescription;
