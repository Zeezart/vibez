
import React, { createContext, useContext, useState, useEffect } from 'react';
import { webRTCService } from '../utils/WebRTCService';
import { useAuth } from './AuthContext';
import { useToast } from '@chakra-ui/react';

interface AudioContextType {
  isSpeaking: boolean;
  isMuted: boolean;
  activeSpeakers: string[];
  enableSpeaking: (enable: boolean) => Promise<boolean>;
  toggleMute: () => void;
  disconnectFromSpace: () => void;
}

const AudioContext = createContext<AudioContextType | undefined>(undefined);

export const AudioProvider: React.FC<{ children: React.ReactNode, spaceId: string }> = ({ children, spaceId }) => {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [activeSpeakers, setActiveSpeakers] = useState<string[]>([]);
  const { user } = useAuth();
  const toast = useToast();
  
  useEffect(() => {
    // Initialize the WebRTC service when the component mounts
    if (user?.id && spaceId) {
      console.log("AudioProvider: Initializing WebRTC service");
      webRTCService.initialize(spaceId, user.id);
      
      // Set up callbacks for peer connections
      webRTCService.setCallbacks(
        (peerId, stream) => {
          console.log(`AudioProvider: Peer ${peerId} connected with stream`);
          // Add peer to active speakers
          setActiveSpeakers(prev => {
            if (!prev.includes(peerId)) {
              return [...prev, peerId];
            }
            return prev;
          });
          
          // Create an audio element to play the peer's audio
          const audioElement = new Audio();
          audioElement.srcObject = stream;
          audioElement.id = `audio-${peerId}`;
          audioElement.autoplay = true;
          document.body.appendChild(audioElement);
          
          // Log to verify the audio is playing
          audioElement.onplay = () => console.log(`Audio from peer ${peerId} is playing`);
          audioElement.onerror = (e) => console.error(`Audio error for peer ${peerId}:`, e);
        },
        (peerId) => {
          console.log(`AudioProvider: Peer ${peerId} disconnected`);
          // Remove peer from active speakers
          setActiveSpeakers(prev => prev.filter(id => id !== peerId));
          
          // Remove the audio element
          const audioElement = document.getElementById(`audio-${peerId}`);
          if (audioElement) {
            document.body.removeChild(audioElement);
          }
        }
      );
    }
    
    return () => {
      console.log("AudioProvider: Cleaning up");
      webRTCService.cleanup();
      
      // Remove any remaining audio elements
      document.querySelectorAll('[id^="audio-"]').forEach(element => {
        document.body.removeChild(element);
      });
    };
  }, [user?.id, spaceId]);
  
  const enableSpeaking = async (enable: boolean) => {
    if (!user?.id) {
      toast({
        title: "Authentication required",
        description: "You must be signed in to speak",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return false;
    }
    
    try {
      console.log(`AudioProvider: Enabling speaking mode: ${enable}`);
      const result = await webRTCService.enableSpeaking(enable);
      setIsSpeaking(enable && result);
      
      if (enable && result) {
        setIsMuted(false); // Automatically unmute when enabling speaking
      }
      
      return result;
    } catch (error) {
      console.error('Error enabling speaking:', error);
      toast({
        title: "Error",
        description: "Failed to access microphone. Please check your permissions.",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      return false;
    }
  };
  
  const toggleMute = () => {
    const newMutedState = !isMuted;
    setIsMuted(newMutedState);
    webRTCService.setMuted(newMutedState);
    
    toast({
      title: newMutedState ? "Muted" : "Unmuted",
      status: "info",
      duration: 2000,
      isClosable: true,
    });
  };
  
  const disconnectFromSpace = () => {
    webRTCService.cleanup();
    setIsSpeaking(false);
    setIsMuted(true);
    setActiveSpeakers([]);
  };
  
  return (
    <AudioContext.Provider value={{
      isSpeaking,
      isMuted,
      activeSpeakers,
      enableSpeaking,
      toggleMute,
      disconnectFromSpace
    }}>
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => {
  const context = useContext(AudioContext);
  if (context === undefined) {
    throw new Error('useAudio must be used within an AudioProvider');
  }
  return context;
};
