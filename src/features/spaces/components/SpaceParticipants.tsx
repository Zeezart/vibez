
import React from 'react';
import { Box, Heading } from '@chakra-ui/react';
import UsersList from '../../../components/UsersList';

interface SpaceParticipantsProps {
  users: any[];
  type: 'speakers' | 'listeners';
}

const SpaceParticipants: React.FC<SpaceParticipantsProps> = ({ users, type }) => {
  return (
    <Box>
      <Heading size="md" mb={4}>{type === 'speakers' ? 'Speakers' : 'Listeners'}</Heading>
      <UsersList users={users} type={type} />
    </Box>
  );
};

export default SpaceParticipants;
