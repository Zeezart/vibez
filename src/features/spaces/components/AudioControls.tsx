
import React from 'react';
import { Button, useToast } from '@chakra-ui/react';
import { Mic, MicOff } from 'lucide-react';
import { useAudio } from '../../../context/AudioContext';

const AudioControls: React.FC = () => {
  const { isSpeaking, isMuted, enableSpeaking, toggleMute } = useAudio();
  const toast = useToast();

  const handleSpeakingToggle = async () => {
    const result = await enableSpeaking(!isSpeaking);
    if (result && !isSpeaking) {
      toast({
        title: "Microphone activated",
        description: "You can now speak in this space",
        status: "success",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <div className="flex gap-4 mt-6">
      {isSpeaking ? (
        <>
          <Button
            leftIcon={isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            colorScheme={isMuted ? "gray" : "green"}
            onClick={toggleMute}
          >
            {isMuted ? 'Unmute' : 'Mute'}
          </Button>
          <Button
            colorScheme="red"
            variant="outline"
            onClick={() => enableSpeaking(false)}
          >
            Leave Speaker Mode
          </Button>
        </>
      ) : (
        <Button
          colorScheme="purple"
          leftIcon={<Mic size={20} />}
          onClick={handleSpeakingToggle}
        >
          Start Speaking
        </Button>
      )}
    </div>
  );
};

export default AudioControls;
