
import React from 'react';
import { Button, Flex } from '@chakra-ui/react';
import AudioControls from './AudioControls';

interface SpaceControlsProps {
  userRole: 'host' | 'speaker' | 'listener' | null;
  status: 'live' | 'scheduled' | 'ended';
  isJoining: boolean;
  joinSpace: (role?: 'listener' | 'speaker') => Promise<void>;
  leaveSpace: () => Promise<void>;
}

const SpaceControls: React.FC<SpaceControlsProps> = ({
  userRole,
  status,
  isJoining,
  joinSpace,
  leaveSpace
}) => {
  return (
    <Flex direction="column" gap={4} mt={6}>
      {!userRole && status === 'live' && (
        <Button
          colorScheme="purple"
          onClick={() => joinSpace('listener')}
          isLoading={isJoining}
        >
          Join Space
        </Button>
      )}

      {userRole === 'listener' && status === 'live' && (
        <Button
          colorScheme="purple"
          variant="outline"
          onClick={() => joinSpace('speaker')}
          isDisabled={isJoining}
        >
          Request to Speak
        </Button>
      )}

      {userRole && userRole !== 'listener' && status === 'live' && (
        <AudioControls />
      )}

      {userRole && (
        <Button
          colorScheme="red"
          variant="outline"
          onClick={leaveSpace}
        >
          Leave
        </Button>
      )}
    </Flex>
  );
};

export default SpaceControls;
