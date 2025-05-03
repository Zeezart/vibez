
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
  
  // Detect audio activity to update active speakers
  const handleAudioActivity = useCallback((peerId: string, stream: MediaStream) => {
    if (!stream) return;
    
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      
      analyser.fftSize = 256;
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let silenceCounter = 0;
      
      const detectSound = () => {
        if (!stream.active) {
          console.log(`Stream for ${peerId} is no longer active`);
          return;
        }
        
        analyser.getByteFrequencyData(dataArray);
        
        // Calculate volume level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i];
        }
        const average = sum / bufferLength;
        
        // Threshold for speaking detection
        const threshold = 15;
        
        if (average > threshold) {
          silenceCounter = 0;
          
          // Add to active speakers if not already there
          setActiveSpeakers(prev => {
            if (!prev.includes(peerId)) {
              return [...prev, peerId];
            }
            return prev;
          });
        } else {
          silenceCounter++;
          
          // If silent for more than 1.5 seconds, remove from active speakers
          if (silenceCounter > 60) {
            silenceCounter = 0;
            setActiveSpeakers(prev => prev.filter(id => id !== peerId));
          }
        }
        
        requestAnimationFrame(detectSound);
      };
      
      detectSound();
      
      return () => {
        try {
          source.disconnect();
          audioContext.close();
        } catch (err) {
          console.error("Error cleaning up audio context:", err);
        }
      };
    } catch (error) {
      console.error("Error setting up audio activity detection:", error);
      return () => {};
    }
  }, []);
  
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
          
          // Set up audio activity detection for this stream
          handleAudioActivity(peerId, stream);
          
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
            if ((newRole === 'listener' && isSpeaking) || 
                ((newRole === 'host' || newRole === 'speaker') && !isSpeaking)) {
              console.log(`Role changed to ${newRole}, updating speaking capability`);
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
          document.body.removeChild(element);
        });
        
        setActiveSpeakers([]);
      };
    }
  }, [user?.id, spaceId, handleAudioActivity]);
  
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
      } else if (!enable) {
        // Remove self from active speakers when disabling speaking
        if (user?.id) {
          setActiveSpeakers(prev => prev.filter(id => id !== user.id));
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
