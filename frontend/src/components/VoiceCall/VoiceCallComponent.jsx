import React, { useEffect, useState, useRef } from 'react';
import { Mic, MicOff, PhoneOff, Volume2, VolumeX } from 'lucide-react';
import './VoiceCallComponent.css';

const VoiceCallComponent = ({ 
  username, 
  receiver, 
  onEndCall, 
  isCaller,
  callSocket,
  incomingCall 
}) => {
  // Call State
  const [callStatus, setCallStatus] = useState(isCaller ? 'calling' : 'incoming');
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerMuted, setIsSpeakerMuted] = useState(false);
  const iceCandidateQueue = [];
  let isRemoteDescriptionSet = false;

  // WebRTC Refs
  const peerConnection = useRef(null);
  const localStream = useRef(null);
  const remoteStream = useRef(null);
  const callTimer = useRef(null);

  // DOM Refs
  const localAudio = useRef(null);
  const remoteAudio = useRef(null);
  const pendingCandidates = [];
let remoteDescriptionSet = false;

  
  // Call setup on component mount
  useEffect(() => {
    initializeCall();
    
    // Cleanup when component unmounts
    return () => {
      cleanupCall();
    };
  }, []);

  // Initialize WebRTC call
  const initializeCall = async () => {
    try {
      // Request audio permission
      console.log('Requesting audio permission...');
      localStream.current = await navigator.mediaDevices.getUserMedia({ 
        audio: true, 
        video: false 
      });
      
      // Connect local audio to the audio element (for monitoring)
      if (localAudio.current) {
        localAudio.current.srcObject = localStream.current;
      }

      // Create the remote audio stream
      remoteStream.current = new MediaStream();
      if (remoteAudio.current) {
        remoteAudio.current.srcObject = remoteStream.current;
      }

      // Initialize WebRTC peer connection
      console.log('Initializing RTCPeerConnection...');
      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ]
      };
      
      peerConnection.current = new RTCPeerConnection(configuration);
      
      // Add local audio tracks to the connection
      localStream.current.getTracks().forEach(track => {
        console.log('Adding local track to peer connection:', track.kind);
        peerConnection.current.addTrack(track, localStream.current);
      });
      
      // Set up event handlers for receiving remote audio
      peerConnection.current.ontrack = (event) => {
        console.log('Received remote track:', event.track.kind);
        event.streams[0].getTracks().forEach(track => {
          console.log('Adding remote track to remote stream:', track.kind);
          remoteStream.current.addTrack(track);
        });
      };
      
      // Handle ICE candidates
      peerConnection.current.onicecandidate = (event) => {
        if (event.candidate) {
          sendSignal('ice-candidate', event.candidate);
        }
      };
      
      // Connection state monitoring
      peerConnection.current.oniceconnectionstatechange = () => {
        console.log('ICE connection state:', peerConnection.current.iceConnectionState);
        switch (peerConnection.current.iceConnectionState) {
          case 'connected':
          case 'completed':
            // Call is connected, start timer
            setCallStatus('connected');
            startCallTimer();
            break;
          case 'failed':
          case 'disconnected':
          case 'closed':
            // Connection issues or call ended
            handleConnectionError('Connection lost');
            break;
          default:
            break;
        }
      };
      
      // Set up WebSocket message handlers
      setupSignalingHandlers();
      
      // If caller, initiate the call offer
      if (isCaller) {
        createAndSendOffer();
      }
      
    } catch (error) {
      console.error('Error initializing call:', error);
      handleConnectionError('Failed to initialize call: ' + error.message);
    }
  };
  
  // Set up WebSocket signaling event handlers
  const setupSignalingHandlers = () => {
    if (!callSocket) {
      console.error('No call socket available');
      handleConnectionError('Signaling connection not available');
      return;
    }
    
    // Original onmessage handler is in Chat.jsx
    // We need to set up a temporary listener that filters for our specific messages
    const originalOnMessage = callSocket.onmessage;
    
    callSocket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Call signal received:', data);
        
        // Make sure the message is related to our call
        const isForThisCall = data.sender === receiver && 
                             (data.type !== 'call-request'); // Already handled by Chat.jsx
        
        if (isForThisCall) {
          // Handle various signal types
          switch (data.type) {
            case 'call-accepted':
              // Receiver accepted the call
              console.log('Call accepted');
              setCallStatus('connecting');
              break;
              
            case 'call-rejected':
              // Receiver rejected the call
              console.log('Call rejected:', data.payload?.reason || 'No reason provided');
              handleCallRejected(data.payload?.reason);
              break;
              
            case 'call-busy':
              // Receiver is busy in another call
              console.log('Receiver is busy');
              handleCallRejected('User is busy in another call');
              break;
              
            case 'call-ended':
              // Other party ended the call
              console.log('Call ended by remote user');
              handleCallEnded('Call ended by other user');
              break;
              
              case 'offer':
                console.log('offer')
                await peerConnection.setRemoteDescription(new RTCSessionDescription(data.payload));
                remoteDescriptionSet = true;
              
                // Apply any queued candidates now
                for (const candidate of pendingCandidates) {
                  await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
                }
                pendingCandidates.length = 0;
              
                // Continue to create and send answer...
                const answer = await peerConnection.createAnswer();
                await peerConnection.setLocalDescription(answer);
                sendSignal('answer', answer);
                break;
              
              
              case 'answer':
                console.log('answer')
                await peerConnection.current.setRemoteDescription(
                  new RTCSessionDescription(data.payload)
                );
                break;
              
                case 'ice-candidate':
                  console.log('ice-candidate')
                  if (!remoteDescriptionSet) {
                    pendingCandidates.push(data.payload);
                  } else {
                    await peerConnection.addIceCandidate(new RTCIceCandidate(data.payload));
                  }
                  break;
                
              
            default:
              console.log('Unhandled signal type:', data.type);
          }
        }
      } catch (error) {
        console.error('Error handling call signal:', error);
      }
      
      // Also call the original handler if it exists
      if (originalOnMessage) {
        originalOnMessage(event);
      }
    };
  };
  
  // Create and send WebRTC offer (caller)
  const createAndSendOffer = async () => {
    if (!peerConnection.current) {
      console.error('Peer connection not initialized');
      return;
    }
    
    try {
      console.log('Creating offer...');
      // caller, when making the offer
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      sendSignal('offer', offer);        // <-- just the { type:"offer", sdp:"..." } object

      console.log('Setting local description...');
      
      // First send a call request
      if (isCaller && callStatus === 'calling') {
        console.log('Sending call request signal');
        sendSignal('call-request', { caller: username });
      }
      
      // Then send the WebRTC offer
      console.log('Sending offer signal');
      //sendSignal('offer', { sdp: offer });
      
    } catch (error) {
      console.error('Error creating offer:', error);
      handleConnectionError('Failed to create call offer');
    }
  };
  
  // Handle received WebRTC offer (receiver)
  async function handleReceivedOffer(offer) {
    // offer is already an RTCSessionDescriptionInit
    await peerConnection.current.setRemoteDescription(
      new RTCSessionDescription(offer)
    );
  
    const answer = await peerConnection.current.createAnswer();
    await peerConnection.current.setLocalDescription(answer);
    sendSignal('answer', answer);    // <-- send back the full { type:"answer", sdp:"..." }
  }
  
  
  // Handle received WebRTC answer (caller)
  const handleReceivedAnswer = async (payload) => {
    if (!peerConnection.current) {
      console.error('Peer connection not initialized');
      return;
    }
    
    try {
      const { sdp } = payload;
      console.log('Setting remote description from answer...');
      const remoteDesc = new RTCSessionDescription(sdp);
      await peerConnection.current.setRemoteDescription(remoteDesc);
      
      // Call should now be connecting via ICE
      setCallStatus('connecting');
      
    } catch (error) {
      console.error('Error handling answer:', error);
      handleConnectionError('Failed to process call answer');
    }
  };
  
  // Handle received ICE candidate
  async function handleReceivedICECandidate(candidate) {
    console.log("Received ICE candidate");
  
    if (!peerConnection) {
      console.warn("Peer connection not initialized yet, buffering candidate");
      iceCandidateQueue.push(candidate);
      return;
    }
  
    if (!isRemoteDescriptionSet) {
      console.warn("Remote description not set yet, buffering candidate");
      iceCandidateQueue.push(candidate);
      return;
    }
  
    try {
      await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (error) {
      console.error("Error handling ICE candidate:", error);
    }
  }
  
  
  // Send signal through the WebSocket
  const sendSignal = (type, payload) => {
    if (!callSocket || callSocket.readyState !== WebSocket.OPEN) {
      console.error('Call socket not open');
      return;
    }
    
    try {
      const signal = {
        receiver: receiver,
        type: type,
        payload: payload
      };
      
      console.log(`Sending ${type} signal to ${receiver}:`, signal);
      callSocket.send(JSON.stringify(signal));
    } catch (error) {
      console.error('Error sending signal:', error);
    }
  };
  
  // Start the call timer
  const startCallTimer = () => {
    if (callTimer.current) {
      clearInterval(callTimer.current);
    }
    
    const startTime = Date.now();
    callTimer.current = setInterval(() => {
      const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
      setCallDuration(elapsedSeconds);
    }, 1000);
  };
  
  // Format call duration as MM:SS
  const formatCallDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  // Toggle microphone mute state
  const toggleMute = () => {
    if (localStream.current) {
      const audioTracks = localStream.current.getAudioTracks();
      audioTracks.forEach(track => {
        track.enabled = isMuted; // Toggle to opposite of current state
      });
      setIsMuted(!isMuted);
    }
  };
  
  // Toggle speaker mute state
  const toggleSpeaker = () => {
    if (remoteAudio.current) {
      remoteAudio.current.muted = !isSpeakerMuted;
      setIsSpeakerMuted(!isSpeakerMuted);
    }
  };
  
  // Handle call acceptance by user (for incoming calls)
  const acceptCall = () => {
    if (callStatus === 'incoming') {
      console.log('Call accepted by user');
      setCallStatus('connecting');
      sendSignal('call-accepted', {});
      // The offer handling will occur when we receive it from the caller
    }
  };
  
  // Handle call rejection by user (for incoming calls)
  const rejectCall = () => {
    if (callStatus === 'incoming') {
      console.log('Call rejected by user');
      sendSignal('call-rejected', { reason: 'Call rejected by user' });
      handleCallEnded('Call rejected');
    }
  };
  
  // Handle ending the call from our side
  const endCall = () => {
    console.log('Ending call');
    sendSignal('call-ended', {});
    handleCallEnded('Call ended');
  };
  
  // Handle call rejection (incoming or outgoing)
  const handleCallRejected = (reason) => {
    console.log('Call rejected:', reason);
    setCallStatus('rejected');
    // Auto-dismiss after a short delay
    setTimeout(() => {
      onEndCall(); // Notify parent component
    }, 2000);
  };
  
  // Handle call ended (by either party)
  const handleCallEnded = (reason) => {
    console.log('Call ended:', reason);
    setCallStatus('ended');
    // Stop timer
    if (callTimer.current) {
      clearInterval(callTimer.current);
    }
    // Auto-dismiss after a short delay
    setTimeout(() => {
      onEndCall(); // Notify parent component
    }, 2000);
  };
  
  // Handle connection errors
  const handleConnectionError = (message) => {
    console.error('Connection error:', message);
    setCallStatus('error');
    // Auto-dismiss after a short delay
    setTimeout(() => {
      onEndCall(); // Notify parent component
    }, 2000);
  };
  
  // Clean up resources when call ends
  const cleanupCall = () => {
    // Stop call timer
    if (callTimer.current) {
      clearInterval(callTimer.current);
      callTimer.current = null;
    }
    
    // Close peer connection
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    
    // Stop all local media tracks
    if (localStream.current) {
      localStream.current.getTracks().forEach(track => track.stop());
      localStream.current = null;
    }
    
    // Clear remote stream
    remoteStream.current = null;
    
    console.log('Call resources cleaned up');
  };
  
  // Generate call status message
  const getStatusMessage = () => {
    switch (callStatus) {
      case 'calling':
        return `Calling ${receiver}...`;
      case 'incoming':
        return `Incoming call from ${receiver}`;
      case 'connecting':
        return 'Connecting...';
      case 'connected':
        return formatCallDuration(callDuration);
      case 'ended':
        return 'Call ended';
      case 'rejected':
        return 'Call rejected';
      case 'error':
        return 'Call failed';
      default:
        return 'Initializing...';
    }
  };
  
  // Render UI based on call state
  return (
    <div className="voice-call-container">
      {/* Hidden audio elements */}
      <audio ref={localAudio} autoPlay muted className="hidden-audio" />
      <audio ref={remoteAudio} autoPlay className="hidden-audio" />
      
      {/* Call UI */}
      <div className="call-header">
        <div className="caller-avatar">
          {receiver.charAt(0).toUpperCase()}
        </div>
        <div className="caller-info">
          <h3 className="caller-name">{receiver}</h3>
          <p className="call-status">{getStatusMessage()}</p>
        </div>
      </div>
      
      <div className="call-controls">
        {/* Show accept/reject for incoming calls */}
        {callStatus === 'incoming' && (
          <div className="incoming-call-controls">
            <button 
              className="reject-button control-button"
              onClick={rejectCall}
              title="Reject call"
            >
              <PhoneOff size={24} />
            </button>
            <button 
              className="accept-button control-button"
              onClick={acceptCall}
              title="Accept call"
            >
              <Mic size={24} />
            </button>
          </div>
        )}
        
        {/* Show mute/end for active calls */}
        {(callStatus === 'connected' || callStatus === 'connecting') && (
          <>
            <button 
              className={`mute-button control-button ${isMuted ? 'active' : ''}`}
              onClick={toggleMute}
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button 
              className={`speaker-button control-button ${isSpeakerMuted ? 'active' : ''}`}
              onClick={toggleSpeaker}
              title={isSpeakerMuted ? 'Speaker on' : 'Speaker off'}
            >
              {isSpeakerMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            <button 
              className="end-call-button control-button"
              onClick={endCall}
              title="End call"
            >
              <PhoneOff size={24} />
            </button>
          </>
        )}
        
        {/* Show end call for outgoing calls */}
        {callStatus === 'calling' && (
          <button 
            className="end-call-button control-button"
            onClick={endCall}
            title="Cancel call"
          >
            <PhoneOff size={24} />
          </button>
        )}
        
        {/* Show dismiss button for ended/rejected/error calls */}
        {(callStatus === 'ended' || callStatus === 'rejected' || callStatus === 'error') && (
          <button 
            className="dismiss-button control-button"
            onClick={onEndCall}
            title="Dismiss"
          >
            OK
          </button>
        )}
      </div>
    </div>
  );
};

export default VoiceCallComponent;