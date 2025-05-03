
import { supabase } from '../integrations/supabase/client';

export interface Peer {
  id: string;
  stream?: MediaStream;
  connection?: RTCPeerConnection;
}

class WebRTCService {
  private localStream: MediaStream | null = null;
  private peers: Map<string, Peer> = new Map();
  private localUserId: string | null = null;
  private onPeerConnectedCallback: ((peerId: string, stream: MediaStream) => void) | null = null;
  private onPeerDisconnectedCallback: ((peerId: string) => void) | null = null;
  private spaceId: string | null = null;
  private speakingEnabled = false;
  private realtimeChannel: any = null;
  private isInitialized = false;
  
  constructor() {
    console.log("WebRTCService constructor called");
    // Setup will be done in initialize method
  }

  private setupRealtimeListeners() {
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    
    // We'll listen for signaling messages to establish WebRTC connections
    this.realtimeChannel = supabase
      .channel('rtc-signaling')
      .on('broadcast', { event: 'rtc-signal' }, (payload) => {
        console.log("Received rtc-signal in general channel:", payload);
        this.handleSignalingMessage(payload.payload);
      })
      .subscribe((status) => {
        console.log("RTC signaling channel status:", status);
      });
      
    console.log("WebRTC service initialized and listening for signaling messages");
  }

  // Set callbacks for UI to handle peer connections
  public setCallbacks(
    onPeerConnected: (peerId: string, stream: MediaStream) => void,
    onPeerDisconnected: (peerId: string) => void
  ) {
    this.onPeerConnectedCallback = onPeerConnected;
    this.onPeerDisconnectedCallback = onPeerDisconnected;
    console.log("WebRTC callbacks set");
  }

  // Initialize the service for a specific space
  public async initialize(spaceId: string, userId: string) {
    if (this.isInitialized && spaceId === this.spaceId && userId === this.localUserId) {
      console.log("WebRTC already initialized for this space and user, skipping");
      return this;
    }
    
    console.log(`Initializing WebRTC service for space: ${spaceId}, user: ${userId}`);
    
    // Clean up any existing state
    this.cleanup();
    
    this.spaceId = spaceId;
    this.localUserId = userId;
    this.isInitialized = true;
    
    this.setupRealtimeListeners();
    
    // Join the space-specific channel
    const spaceChannel = supabase.channel(`space-${spaceId}`)
      .on('broadcast', { event: 'speaker-joined' }, (payload) => {
        console.log('Speaker joined:', payload);
        if (this.speakingEnabled && payload.payload.userId !== this.localUserId) {
          this.connectToPeer(payload.payload.userId);
        }
      })
      .on('broadcast', { event: 'speaker-left' }, (payload) => {
        console.log('Speaker left:', payload);
        if (payload.payload.userId !== this.localUserId) {
          this.disconnectFromPeer(payload.payload.userId);
        }
      })
      .on('broadcast', { event: 'rtc-signal' }, (payload) => {
        console.log('RTC signal received in space channel:', payload);
        this.handleSignalingMessage(payload.payload);
      })
      .subscribe((status) => {
        console.log(`Space-${spaceId} channel status:`, status);
      });
      
    console.log(`Subscribed to space-${spaceId} channel`);

    // If other speakers are already in the room, try to fetch them and connect
    try {
      const { data: participants } = await supabase
        .from('space_participants')
        .select('user_id, role')
        .eq('space_id', spaceId)
        .neq('user_id', userId)
        .in('role', ['host', 'speaker']);
        
      if (participants && participants.length > 0) {
        console.log('Found existing speakers:', participants);
        
        // If we're now a speaker, connect to other speakers
        if (this.speakingEnabled) {
          participants.forEach(p => {
            this.connectToPeer(p.user_id);
          });
        }
      }
    } catch (error) {
      console.error('Error fetching existing speakers:', error);
    }

    return this;
  }

  // Enable/disable speaking mode
  public async enableSpeaking(enable: boolean): Promise<boolean> {
    console.log(`Enabling speaking mode: ${enable}`);
    if (enable === this.speakingEnabled) return this.speakingEnabled;
    
    // Store old state in case we need to revert
    const previousState = this.speakingEnabled;
    this.speakingEnabled = enable;
    
    if (enable) {
      try {
        // Get microphone access with enhanced configuration for clearer audio
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000,
            channelCount: 2,
          },
          video: false
        });
        
        console.log("Microphone access granted:", this.localStream);
        
        // Announce that this user is now a speaker
        await this.broadcastSpeakerUpdate(true);
        
        // Connect to all existing speakers
        if (this.spaceId) {
          try {
            const { data: speakers } = await supabase
              .from('space_participants')
              .select('user_id')
              .eq('space_id', this.spaceId)
              .in('role', ['host', 'speaker'])
              .neq('user_id', this.localUserId);
              
            if (speakers && speakers.length > 0) {
              console.log('Found existing speakers to connect to:', speakers);
              speakers.forEach(speaker => {
                this.connectToPeer(speaker.user_id);
              });
            }
          } catch (error) {
            console.error('Error fetching speakers:', error);
          }
        }
        
        return true;
      } catch (error) {
        console.error('Error accessing microphone:', error);
        // Revert to previous state
        this.speakingEnabled = previousState;
        return false;
      }
    } else {
      // Stop the local stream
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => track.stop());
        this.localStream = null;
      }
      
      // Disconnect from all peers
      this.disconnectFromAllPeers();
      
      // Announce that this user is no longer a speaker
      await this.broadcastSpeakerUpdate(false);
      
      return true;
    }
  }

  // Mute/unmute the local audio stream
  public setMuted(muted: boolean) {
    console.log(`Setting mute: ${muted}`);
    if (!this.localStream) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  private async broadcastSpeakerUpdate(isSpeaking: boolean) {
    if (!this.spaceId || !this.localUserId) return;
    
    console.log(`Broadcasting speaker update: ${isSpeaking ? 'joined' : 'left'}`);
    
    try {
      await supabase
        .channel(`space-${this.spaceId}`)
        .send({
          type: 'broadcast',
          event: isSpeaking ? 'speaker-joined' : 'speaker-left',
          payload: { userId: this.localUserId }
        });
      console.log(`Successfully broadcast speaker ${isSpeaking ? 'join' : 'leave'} event`);
    } catch (error) {
      console.error('Error broadcasting speaker update:', error);
    }
  }

  private async connectToPeer(peerId: string) {
    if (this.peers.has(peerId) || !this.localUserId) {
      console.log(`Already connected to peer ${peerId} or missing local user ID`);
      return;
    }
    
    if (!this.localStream && this.speakingEnabled) {
      console.log(`No local stream available, but speaking is enabled. Attempting to get microphone access.`);
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false
        });
      } catch (error) {
        console.error('Error accessing microphone during peer connection:', error);
        return;
      }
    }
    
    if (!this.localStream) {
      console.log(`Cannot connect to peer ${peerId} without local stream`);
      return;
    }
    
    console.log(`Connecting to peer: ${peerId}`);
    
    try {
      // Create a new RTCPeerConnection with enhanced ICE servers
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' },
          { urls: 'stun:stun4.l.google.com:19302' }
        ],
        iceCandidatePoolSize: 10
      });
      
      // Add local stream tracks to the connection
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
          console.log(`Adding track to peer connection: ${track.kind}`);
          peerConnection.addTrack(track, this.localStream);
        }
      });
      
      // Create a peer object
      const peer: Peer = {
        id: peerId,
        connection: peerConnection
      };
      
      // Set up event handlers for this peer connection
      peerConnection.onicecandidate = event => {
        if (event.candidate) {
          console.log(`Sending ICE candidate to ${peerId}`);
          this.sendSignalingMessage(peerId, {
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      peerConnection.ontrack = event => {
        console.log(`Received track from ${peerId}:`, event.streams[0]);
        peer.stream = event.streams[0];
        if (this.onPeerConnectedCallback) {
          this.onPeerConnectedCallback(peerId, event.streams[0]);
        }
      };
      
      peerConnection.oniceconnectionstatechange = () => {
        console.log(`ICE connection state change for peer ${peerId}: ${peerConnection.iceConnectionState}`);
        
        // Handle disconnection
        if (
          peerConnection.iceConnectionState === 'disconnected' || 
          peerConnection.iceConnectionState === 'failed' ||
          peerConnection.iceConnectionState === 'closed'
        ) {
          console.log(`Peer ${peerId} disconnected due to ICE state: ${peerConnection.iceConnectionState}`);
          this.disconnectFromPeer(peerId);
        }
      };
      
      // Store the peer
      this.peers.set(peerId, peer);
      
      // Create and send an offer
      const offer = await peerConnection.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await peerConnection.setLocalDescription(offer);
      
      console.log(`Sending offer to ${peerId}`);
      this.sendSignalingMessage(peerId, {
        type: 'offer',
        offer: peerConnection.localDescription
      });
    } catch (error) {
      console.error(`Error connecting to peer ${peerId}:`, error);
      // Clean up any partially created connection
      this.disconnectFromPeer(peerId);
    }
  }

  private async handleSignalingMessage(payload: any) {
    if (!this.localUserId) return;
    
    const { userId: peerId, targetId, message } = payload;
    
    // Check if message is for this user
    if (targetId && targetId !== this.localUserId) {
      console.log(`Message not for this user. Target: ${targetId}, Local: ${this.localUserId}`);
      return;
    }
    
    // Ignore own messages
    if (peerId === this.localUserId) {
      console.log(`Ignoring own signaling message`);
      return;
    }
    
    if (!peerId || !message || !message.type) {
      console.log('Invalid signaling message:', payload);
      return;
    }
    
    console.log(`Received signaling message of type ${message.type} from ${peerId}`);
    
    switch (message.type) {
      case 'offer':
        await this.handleOffer(peerId, message.offer);
        break;
      case 'answer':
        await this.handleAnswer(peerId, message.answer);
        break;
      case 'ice-candidate':
        this.handleIceCandidate(peerId, message.candidate);
        break;
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    console.log(`Handling offer from ${peerId}`);
    
    // If we're not a speaker, we need to become one to accept the offer
    if (!this.speakingEnabled) {
      console.log('Received offer but not in speaking mode, attempting to enable speaking');
      
      try {
        const speakingEnabled = await this.enableSpeaking(true);
        if (!speakingEnabled) {
          console.log('Could not enable speaking mode to answer offer');
          return;
        }
      } catch (error) {
        console.error('Error enabling speaking to answer offer:', error);
        return;
      }
    }
    
    if (!this.localStream) {
      console.log('No local stream available to answer offer');
      return;
    }
    
    try {
      // Create a new RTCPeerConnection if needed
      if (!this.peers.has(peerId)) {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' }
          ],
          iceCandidatePoolSize: 10
        });
        
        // Add local stream tracks to the connection
        this.localStream.getTracks().forEach(track => {
          if (this.localStream) {
            console.log(`Adding track to peer connection: ${track.kind}`);
            peerConnection.addTrack(track, this.localStream);
          }
        });
        
        // Create a peer object
        const peer: Peer = {
          id: peerId,
          connection: peerConnection
        };
        
        // Set up event handlers for this peer connection
        peerConnection.onicecandidate = event => {
          if (event.candidate) {
            console.log(`Sending ICE candidate to ${peerId}`);
            this.sendSignalingMessage(peerId, {
              type: 'ice-candidate',
              candidate: event.candidate
            });
          }
        };
        
        peerConnection.ontrack = event => {
          console.log(`Received track from ${peerId}:`, event.streams[0]);
          peer.stream = event.streams[0];
          if (this.onPeerConnectedCallback) {
            this.onPeerConnectedCallback(peerId, event.streams[0]);
          }
        };
        
        peerConnection.oniceconnectionstatechange = () => {
          console.log(`ICE connection state change for peer ${peerId}: ${peerConnection.iceConnectionState}`);
          
          // Handle disconnection
          if (
            peerConnection.iceConnectionState === 'disconnected' || 
            peerConnection.iceConnectionState === 'failed' ||
            peerConnection.iceConnectionState === 'closed'
          ) {
            console.log(`Peer ${peerId} disconnected due to ICE state: ${peerConnection.iceConnectionState}`);
            this.disconnectFromPeer(peerId);
          }
        };
        
        // Store the peer
        this.peers.set(peerId, peer);
      }
      
      const peerConnection = this.peers.get(peerId)?.connection;
      if (!peerConnection) {
        console.log(`No peer connection available for ${peerId}`);
        return;
      }
      
      // Set the remote description (the offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create an answer
      const answer = await peerConnection.createAnswer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: false
      });
      await peerConnection.setLocalDescription(answer);
      
      console.log(`Sending answer to ${peerId}`);
      // Send the answer back
      this.sendSignalingMessage(peerId, {
        type: 'answer',
        answer: peerConnection.localDescription
      });
    } catch (error) {
      console.error(`Error handling offer from ${peerId}:`, error);
      this.disconnectFromPeer(peerId);
    }
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) {
      console.log(`No peer connection for ${peerId} to handle answer`);
      return;
    }
    
    console.log(`Handling answer from ${peerId}`);
    
    try {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
      console.log(`Successfully set remote description for peer ${peerId}`);
    } catch (error) {
      console.error(`Error handling answer from ${peerId}:`, error);
      this.disconnectFromPeer(peerId);
    }
  }

  private handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) {
      console.log(`No peer connection for ${peerId} to handle ICE candidate`);
      return;
    }
    
    console.log(`Handling ICE candidate from ${peerId}`);
    
    try {
      peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
      console.log(`Successfully added ICE candidate for peer ${peerId}`);
    } catch (error) {
      console.error(`Error handling ICE candidate from ${peerId}:`, error);
    }
  }

  private async sendSignalingMessage(peerId: string, message: any) {
    if (!this.spaceId || !this.localUserId) {
      console.log(`Cannot send signaling message: missing spaceId or localUserId`);
      return;
    }
    
    console.log(`Sending signaling message to ${peerId}:`, message.type);
    
    try {
      await supabase
        .channel(`space-${this.spaceId}`)
        .send({
          type: 'broadcast',
          event: 'rtc-signal',
          payload: {
            userId: this.localUserId,
            targetId: peerId,
            message
          }
        });
      console.log(`Successfully sent ${message.type} signaling message to ${peerId}`);
    } catch (error) {
      console.error(`Error sending signaling message to ${peerId}:`, error);
    }
  }

  private disconnectFromPeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) {
      console.log(`No peer ${peerId} to disconnect from`);
      return;
    }
    
    console.log(`Disconnecting from peer: ${peerId}`);
    
    // Close the peer connection
    if (peer.connection) {
      peer.connection.close();
    }
    
    // Remove the peer from the map
    this.peers.delete(peerId);
    
    // Notify that the peer has disconnected
    if (this.onPeerDisconnectedCallback) {
      this.onPeerDisconnectedCallback(peerId);
    }
  }

  private disconnectFromAllPeers() {
    console.log(`Disconnecting from all peers`);
    for (const peerId of this.peers.keys()) {
      this.disconnectFromPeer(peerId);
    }
    this.peers.clear();
  }

  public cleanup() {
    console.log(`Cleaning up WebRTC service`);
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`Stopped audio track: ${track.id}`);
      });
      this.localStream = null;
    }
    
    // Disconnect from all peers
    this.disconnectFromAllPeers();
    
    // Unsubscribe from channels
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    
    if (this.spaceId) {
      try {
        supabase.removeChannel(supabase.channel(`space-${this.spaceId}`));
      } catch (error) {
        console.error('Error removing space channel:', error);
      }
    }
    
    this.spaceId = null;
    this.localUserId = null;
    this.speakingEnabled = false;
    this.isInitialized = false;
  }
}

// Export a singleton instance
export const webRTCService = new WebRTCService();
