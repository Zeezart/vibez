
import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { webRTCService } from '../utils/WebRTCService';
import { useAuth } from './AuthContext';
import { useToast } from '@chakra-ui/react';
import { supabase } from '../integrations/supabase/client';

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
  const userInitiatedAudio = useRef(false);
  
  // Handle user-initiated audio playback
  useEffect(() => {
    const handleUserInteraction = () => {
      userInitiatedAudio.current = true;
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
    
    document.addEventListener('click', handleUserInteraction);
    document.addEventListener('touchstart', handleUserInteraction);
    
    return () => {
      document.removeEventListener('click', handleUserInteraction);
      document.removeEventListener('touchstart', handleUserInteraction);
    };
  }, []);
  
  // Monitor speaking status via realtime
  useEffect(() => {
    if (!spaceId) return;
    
    const channel = supabase
      .channel(`space-${spaceId}-speaking-status`)
      .on('broadcast', { event: 'user-speaking' }, (payload) => {
        const { userId, isSpeaking: isUserSpeaking } = payload.payload;
        
        if (isUserSpeaking) {
          console.log(`User ${userId} is speaking`);
          setActiveSpeakers(prev => {
            if (!prev.includes(userId)) {
              return [...prev, userId];
            }
            return prev;
          });
        } else {
          console.log(`User ${userId} stopped speaking`);
          setActiveSpeakers(prev => prev.filter(id => id !== userId));
        }
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, [spaceId]);
  
  // Initialize the WebRTC service when the component mounts
  useEffect(() => {
    // Initialize the WebRTC service when the component mounts
    if (user?.id && spaceId) {
      console.log("AudioProvider: Initializing WebRTC service");
      webRTCService.initialize(spaceId, user.id);
      
      // Set up callbacks for peer connections
      webRTCService.setCallbacks(
        (peerId, stream) => {
          console.log(`AudioProvider: Peer ${peerId} connected with stream`);
          
          // Add peer to active speakers initially, will be managed by audio detection
          setActiveSpeakers(prev => {
            if (!prev.includes(peerId)) {
              return [...prev, peerId];
            }
            return prev;
          });
          
          // Create an audio element to play the peer's audio
          const audioElement = document.getElementById(`audio-${peerId}`) as HTMLAudioElement || new Audio();
          audioElement.srcObject = stream;
          audioElement.id = `audio-${peerId}`;
          audioElement.autoplay = true;
          
          // Ensure audio element is in the DOM if newly created
          if (!document.getElementById(`audio-${peerId}`)) {
            audioElement.style.display = 'none';
            document.body.appendChild(audioElement);
          }
          
          // Try to play audio
          const playAudio = async () => {
            try {
              await audioElement.play();
              console.log(`Audio from peer ${peerId} is playing`);
            } catch (error) {
              console.warn(`Failed to play audio from peer ${peerId} automatically:`, error);
              
              // If user interaction has happened, try again
              if (userInitiatedAudio.current) {
                try {
                  await audioElement.play();
                  console.log(`Audio from peer ${peerId} now playing after user interaction`);
                } catch (err) {
                  console.error(`Still failed to play audio from peer ${peerId}:`, err);
                }
              }
            }
          };
          
          playAudio();
          
          // Also try to play when user interacts next
          const handleUserInteractionForPlay = async () => {
            try {
              await audioElement.play();
              console.log(`Audio from peer ${peerId} playing after interaction`);
              document.removeEventListener('click', handleUserInteractionForPlay);
            } catch (err) {
              console.error(`Error playing audio after interaction for peer ${peerId}:`, err);
            }
          };
          
          document.addEventListener('click', handleUserInteractionForPlay, { once: true });
        },
        (peerId) => {
          console.log(`AudioProvider: Peer ${peerId} disconnected`);
          // Remove peer from active speakers
          setActiveSpeakers(prev => prev.filter(id => id !== peerId));
          
          // Remove the audio element
          const audioElement = document.getElementById(`audio-${peerId}`);
          if (audioElement) {
            try {
              document.body.removeChild(audioElement);
            } catch (err) {
              console.warn(`Error removing audio element for peer ${peerId}:`, err);
            }
          }
        }
      );
      
      // Set up realtime channel to listen for role changes that might affect speaking ability
      const channel = supabase.channel(`space-participants-${spaceId}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'space_participants',
          filter: `space_id=eq.${spaceId}`
        }, (payload) => {
          console.log('Space participant updated:', payload);
          // If role changed for current user, update speaking state
          if (payload.new.user_id === user.id) {
            const newRole = payload.new.role;
            if ((newRole === 'listener' && isSpeaking)) {
              console.log(`Role changed to listener, disabling speaking`);
              enableSpeaking(false);
            }
          }
        })
        .subscribe();
      
      // Check if user is already a speaker/host in this space
      const checkParticipantRole = async () => {
        try {
          const { data } = await supabase
            .from('space_participants')
            .select('role')
            .eq('space_id', spaceId)
            .eq('user_id', user.id)
            .single();
            
          if (data && (data.role === 'host' || data.role === 'speaker')) {
            console.log(`User is already a ${data.role}, enabling speaking mode`);
            // Automatically enable speaking for hosts
            if (data.role === 'host') {
              enableSpeaking(true);
            }
          }
        } catch (error) {
          console.error('Error checking participant role:', error);
        }
      };
      
      checkParticipantRole();
      
      return () => {
        console.log("AudioProvider: Cleaning up");
        webRTCService.cleanup();
        supabase.removeChannel(channel);
        
        // Remove any remaining audio elements
        document.querySelectorAll('[id^="audio-"]').forEach(element => {
          try {
            document.body.removeChild(element);
          } catch (err) {
            console.warn(`Error removing audio element:`, err);
          }
        });
        
        setActiveSpeakers([]);
      };
    }
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
        
        // If user enabled speaking and is a speaker or host, add self to active speakers
        if (user?.id) {
          setActiveSpeakers(prev => {
            if (!prev.includes(user.id)) {
              return [...prev, user.id];
            }
            return prev;
          });
        }
        
        // Update participant role in database
        if (spaceId) {
          const { data: participant } = await supabase
            .from('space_participants')
            .select('id, role')
            .eq('space_id', spaceId)
            .eq('user_id', user.id)
            .single();
            
          if (participant && participant.role === 'listener') {
            const { error } = await supabase
              .from('space_participants')
              .update({ role: 'speaker' })
              .eq('id', participant.id);
              
            if (error) {
              console.error('Error updating participant role:', error);
            }
          }
        }
      } else if (!enable) {
        // Remove self from active speakers when disabling speaking
        if (user?.id) {
          setActiveSpeakers(prev => prev.filter(id => id !== user.id));
        }
        
        // Update participant role in database if not host
        if (spaceId) {
          const { data: participant } = await supabase
            .from('space_participants')
            .select('id, role')
            .eq('space_id', spaceId)
            .eq('user_id', user.id)
            .single();
            
          if (participant && participant.role === 'speaker') {
            const { error } = await supabase
              .from('space_participants')
              .update({ role: 'listener' })
              .eq('id', participant.id);
              
            if (error) {
              console.error('Error updating participant role:', error);
            }
          }
        }
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
    
    // Update active speakers when mute state changes
    if (user?.id) {
      if (newMutedState) {
        setActiveSpeakers(prev => prev.filter(id => id !== user.id));
      } else if (isSpeaking) {
        setActiveSpeakers(prev => {
          if (!prev.includes(user.id)) {
            return [...prev, user.id];
          }
          return prev;
        });
      }
    }
    
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
