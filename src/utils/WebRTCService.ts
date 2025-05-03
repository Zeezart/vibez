
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
  
  constructor() {
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners() {
    // We'll listen for signaling messages to establish WebRTC connections
    this.realtimeChannel = supabase
      .channel('rtc-signaling')
      .on('broadcast', { event: 'rtc-signal' }, (payload) => {
        this.handleSignalingMessage(payload.payload);
      })
      .subscribe();
      
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
    console.log(`Initializing WebRTC service for space: ${spaceId}, user: ${userId}`);
    this.spaceId = spaceId;
    this.localUserId = userId;
    
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
        console.log('RTC signal received:', payload);
        this.handleSignalingMessage(payload.payload);
      })
      .subscribe();
      
    console.log(`Subscribed to space-${spaceId} channel`);

    return this;
  }

  // Enable/disable speaking mode
  public async enableSpeaking(enable: boolean) {
    console.log(`Enabling speaking mode: ${enable}`);
    if (enable === this.speakingEnabled) return this.speakingEnabled;
    
    this.speakingEnabled = enable;
    
    if (enable) {
      try {
        // Get microphone access
        this.localStream = await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
          video: false
        });
        
        console.log("Microphone access granted:", this.localStream);
        
        // Announce that this user is now a speaker
        await this.broadcastSpeakerUpdate(true);
        
        return true;
      } catch (error) {
        console.error('Error accessing microphone:', error);
        this.speakingEnabled = false;
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
    
    await supabase
      .channel(`space-${this.spaceId}`)
      .send({
        type: 'broadcast',
        event: isSpeaking ? 'speaker-joined' : 'speaker-left',
        payload: { userId: this.localUserId }
      });
  }

  private async connectToPeer(peerId: string) {
    if (this.peers.has(peerId) || !this.localStream || !this.localUserId) return;
    
    console.log(`Connecting to peer: ${peerId}`);
    
    try {
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' }
        ]
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
        console.log(`ICE connection state change: ${peerConnection.iceConnectionState}`);
      };
      
      // Store the peer
      this.peers.set(peerId, peer);
      
      // Create and send an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      console.log(`Sending offer to ${peerId}`);
      this.sendSignalingMessage(peerId, {
        type: 'offer',
        offer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error connecting to peer:', error);
    }
  }

  private async handleSignalingMessage(payload: any) {
    if (!this.localUserId) return;
    
    const { userId: peerId, targetId, message } = payload;
    
    // Check if message is for this user
    if (targetId && targetId !== this.localUserId) return;
    
    // Ignore own messages
    if (peerId === this.localUserId) return;
    
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
    if (!this.speakingEnabled || !this.localStream || !this.localUserId) {
      console.log(`Received offer but speaking is not enabled or no local stream`);
      return;
    }
    
    console.log(`Handling offer from ${peerId}`);
    
    try {
      // Create a new RTCPeerConnection if needed
      if (!this.peers.has(peerId)) {
        const peerConnection = new RTCPeerConnection({
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' }
          ]
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
          console.log(`ICE connection state change: ${peerConnection.iceConnectionState}`);
        };
        
        // Store the peer
        this.peers.set(peerId, peer);
      }
      
      const peerConnection = this.peers.get(peerId)?.connection;
      if (!peerConnection) return;
      
      // Set the remote description (the offer)
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      // Create an answer
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      console.log(`Sending answer to ${peerId}`);
      // Send the answer back
      this.sendSignalingMessage(peerId, {
        type: 'answer',
        answer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  }

  private async handleAnswer(peerId: string, answer: RTCSessionDescriptionInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) {
      console.log(`No peer connection for ${peerId}`);
      return;
    }
    
    console.log(`Handling answer from ${peerId}`);
    
    try {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) {
      console.log(`No peer connection for ${peerId}`);
      return;
    }
    
    console.log(`Handling ICE candidate from ${peerId}`);
    
    try {
      peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private async sendSignalingMessage(peerId: string, message: any) {
    if (!this.spaceId || !this.localUserId) return;
    
    console.log(`Sending signaling message to ${peerId}:`, message);
    
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
  }

  private disconnectFromPeer(peerId: string) {
    const peer = this.peers.get(peerId);
    if (!peer) return;
    
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
  }

  public cleanup() {
    console.log(`Cleaning up WebRTC service`);
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Disconnect from all peers
    this.disconnectFromAllPeers();
    
    // Unsubscribe from channels
    if (this.realtimeChannel) {
      supabase.removeChannel(this.realtimeChannel);
    }
    
    if (this.spaceId) {
      supabase.removeChannel(supabase.channel(`space-${this.spaceId}`));
    }
    
    this.spaceId = null;
    this.localUserId = null;
    this.speakingEnabled = false;
  }
}

// Export a singleton instance
export const webRTCService = new WebRTCService();
