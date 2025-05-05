
import React from 'react';
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  Text,
  Flex,
  Avatar,
  Tag,
  IconButton
} from '@chakra-ui/react';
import { CopyIcon } from '@chakra-ui/icons';
import { SpaceProps } from '../../../components/SpaceCard';

interface SpaceDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  space: SpaceProps;
  copyShareLink: () => void;
}

const SpaceDetailsModal: React.FC<SpaceDetailsModalProps> = ({
  isOpen,
  onClose,
  space,
  copyShareLink
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent>
        <ModalHeader>About this Space</ModalHeader>
        <ModalCloseButton />
        <ModalBody>
          <Text fontWeight="bold" mb={2}>Title</Text>
          <Text mb={4}>{space.title}</Text>
          
          <Text fontWeight="bold" mb={2}>Description</Text>
          <Text mb={4}>{space.description}</Text>
          
          <Text fontWeight="bold" mb={2}>Host</Text>
          <Flex align="center" mb={4}>
            <Avatar size="sm" src={space.host.image} name={space.host.name} mr={2} />
            <Text>{space.host.name}</Text>
          </Flex>
          
          <Text fontWeight="bold" mb={2}>Participants</Text>
          <Text mb={4}>{space.participantsCount} participants</Text>
          
          {space.tags && space.tags.length > 0 && (
            <>
              <Text fontWeight="bold" mb={2}>Tags</Text>
              <Flex gap={2} flexWrap="wrap" mb={4}>
                {space.tags.map((tag) => (
                  <Tag key={tag} colorScheme="purple" size="md">
                    {tag}
                  </Tag>
                ))}
              </Flex>
            </>
          )}
          
          {space.shareLink && (
            <>
              <Text fontWeight="bold" mb={2}>Share Link</Text>
              <Flex align="center" mb={4}>
                <Text isTruncated flex="1">
                  {`${window.location.origin}/join/${space.shareLink}`}
                </Text>
                <IconButton
                  aria-label="Copy link"
                  icon={<CopyIcon />}
                  size="sm"
                  ml={2}
                  onClick={copyShareLink}
                />
              </Flex>
            </>
          )}
        </ModalBody>
        <ModalFooter>
          <Button colorScheme="blue" mr={3} onClick={onClose}>
            Close
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default SpaceDetailsModal;
