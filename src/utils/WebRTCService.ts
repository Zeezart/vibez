
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
  
  constructor() {
    this.setupRealtimeListeners();
  }

  private setupRealtimeListeners() {
    // We'll listen for signaling messages to establish WebRTC connections
    supabase
      .channel('rtc-signaling')
      .on('broadcast', { event: 'rtc-signal' }, (payload) => {
        this.handleSignalingMessage(payload);
      })
      .subscribe();
  }

  // Set callbacks for UI to handle peer connections
  public setCallbacks(
    onPeerConnected: (peerId: string, stream: MediaStream) => void,
    onPeerDisconnected: (peerId: string) => void
  ) {
    this.onPeerConnectedCallback = onPeerConnected;
    this.onPeerDisconnectedCallback = onPeerDisconnected;
  }

  // Initialize the service for a specific space
  public async initialize(spaceId: string, userId: string) {
    this.spaceId = spaceId;
    this.localUserId = userId;
    
    // Join the space-specific channel
    await supabase.channel(`space-${spaceId}`)
      .subscribe();

    return this;
  }

  // Enable/disable speaking mode
  public async enableSpeaking(enable: boolean) {
    if (enable === this.speakingEnabled) return;
    
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
    if (!this.localStream) return;
    
    this.localStream.getAudioTracks().forEach(track => {
      track.enabled = !muted;
    });
  }

  private async broadcastSpeakerUpdate(isSpeaking: boolean) {
    if (!this.spaceId || !this.localUserId) return;
    
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
    
    try {
      // Create a new RTCPeerConnection
      const peerConnection = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      });
      
      // Add local stream tracks to the connection
      this.localStream.getTracks().forEach(track => {
        if (this.localStream) {
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
          this.sendSignalingMessage(peerId, {
            type: 'ice-candidate',
            candidate: event.candidate
          });
        }
      };
      
      peerConnection.ontrack = event => {
        peer.stream = event.streams[0];
        if (this.onPeerConnectedCallback) {
          this.onPeerConnectedCallback(peerId, event.streams[0]);
        }
      };
      
      // Store the peer
      this.peers.set(peerId, peer);
      
      // Create and send an offer
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
      this.sendSignalingMessage(peerId, {
        type: 'offer',
        offer: peerConnection.localDescription
      });
    } catch (error) {
      console.error('Error connecting to peer:', error);
    }
  }

  private async handleSignalingMessage(payload: any) {
    if (!this.localUserId || payload.userId === this.localUserId) return;
    
    const { userId: peerId, message } = payload;
    
    if (!peerId || !message || !message.type) return;
    
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
      case 'speaker-joined':
        if (this.speakingEnabled) {
          await this.connectToPeer(peerId);
        }
        break;
      case 'speaker-left':
        this.disconnectFromPeer(peerId);
        break;
    }
  }

  private async handleOffer(peerId: string, offer: RTCSessionDescriptionInit) {
    if (!this.localStream || !this.localUserId) return;
    
    try {
      // Create a new RTCPeerConnection if needed
      if (!this.peers.has(peerId)) {
        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
        });
        
        // Add local stream tracks to the connection
        this.localStream.getTracks().forEach(track => {
          if (this.localStream) {
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
            this.sendSignalingMessage(peerId, {
              type: 'ice-candidate',
              candidate: event.candidate
            });
          }
        };
        
        peerConnection.ontrack = event => {
          peer.stream = event.streams[0];
          if (this.onPeerConnectedCallback) {
            this.onPeerConnectedCallback(peerId, event.streams[0]);
          }
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
    if (!peer || !peer.connection) return;
    
    try {
      await peer.connection.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  }

  private handleIceCandidate(peerId: string, candidate: RTCIceCandidateInit) {
    const peer = this.peers.get(peerId);
    if (!peer || !peer.connection) return;
    
    try {
      peer.connection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  }

  private async sendSignalingMessage(peerId: string, message: any) {
    if (!this.spaceId || !this.localUserId) return;
    
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
    for (const peerId of this.peers.keys()) {
      this.disconnectFromPeer(peerId);
    }
  }

  public cleanup() {
    // Stop local stream
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }
    
    // Disconnect from all peers
    this.disconnectFromAllPeers();
    
    // Unsubscribe from channels
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
