
import React from 'react';
import { Avatar, Box, Tooltip } from '@chakra-ui/react';
import { Link } from 'react-router-dom';

interface ClickableUserAvatarProps {
  userId: string;
  name: string;
  image?: string;
  size?: string;
  tooltipLabel?: string;
}

const ClickableUserAvatar: React.FC<ClickableUserAvatarProps> = ({
  userId,
  name,
  image,
  size = "md",
  tooltipLabel
}) => {
  return (
    <Tooltip label={tooltipLabel || `View ${name}'s profile`} hasArrow placement="top">
      <Box as={Link} to={`/profile/${userId}`} display="inline-block">
        <Avatar
          name={name}
          src={image}
          size={size}
          cursor="pointer"
          _hover={{ transform: 'scale(1.05)', transition: 'transform 0.2s' }}
        />
      </Box>
    </Tooltip>
  );
};

export default ClickableUserAvatar;
