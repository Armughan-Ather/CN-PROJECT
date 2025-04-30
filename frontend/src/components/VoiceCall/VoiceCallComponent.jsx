// import React, { useEffect, useRef, useState } from 'react';
// import Peer from 'peerjs';

// const VoiceCallComponent = ({ username, receiver }) => {
//   const [socket, setSocket] = useState(null);
//   const [inCall, setInCall] = useState(false);
//   const [incomingCall, setIncomingCall] = useState(false);
//   const [callStatus, setCallStatus] = useState('');
//   const [peer, setPeer] = useState(null);
//   const [localStream, setLocalStream] = useState(null);
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [currentCall, setCurrentCall] = useState(null);

//   const localAudioRef = useRef(null);
//   const remoteAudioRef = useRef(null);

//   useEffect(() => {
//     const ws = new WebSocket(`ws://localhost:8000/ws/call/${username}/`);
//     let isMounted = true;

//     ws.onopen = () => {
//       if (isMounted) {
//         console.log('WebSocket connected');
//         setSocket(ws);
//       }
//     };

//     ws.onmessage = (event) => {
//       if (!isMounted) return;
//       const data = JSON.parse(event.data);
//       const { sender, payload } = data;

//       if (!payload) return;

//       if (payload.type === 'offer' && sender === receiver) {
//         setIncomingCall(true);
//         setCallStatus(`Incoming call from ${sender}`);
//         createPeer(payload);
//       } else if (payload.type === 'answer') {
//         if (currentCall) {
//           currentCall.setRemoteDescription(new RTCSessionDescription(payload));
//         }
//       } else if (payload.type === 'candidate') {
//         if (currentCall) {
//           currentCall.addIceCandidate(new RTCIceCandidate(payload.candidate));
//         }
//       } else if (payload.type === 'end-call') {
//         endCall();
//       }
//     };

//     ws.onerror = (e) => console.error('WebSocket error:', e);
//     ws.onclose = () => console.log('WebSocket closed');

//     return () => {
//       isMounted = false;
//       ws.close();
//     };
//   }, [username, receiver]);

//   const createPeer = (offer) => {
//     const peer = new Peer(username, {
//       host: 'localhost',
//       port: 9000,
//       path: '/peerjs',
//     });

//     peer.on('open', (id) => {
//       console.log(`Peer connected: ${id}`);
//     });

//     peer.on('call', (incomingCall) => {
//       setCurrentCall(incomingCall);
//       setIncomingCall(true);
//       setCallStatus(`Incoming call from ${incomingCall.peer}`);

//       incomingCall.answer(localStream);
//       incomingCall.on('stream', (remoteStream) => {
//         remoteAudioRef.current.srcObject = remoteStream;
//         setRemoteStream(remoteStream);
//         setInCall(true);
//         setCallStatus('In call');
//       });
//     });

//     peer.on('error', (err) => {
//       console.error('PeerJS error:', err);
//       setCallStatus('PeerJS connection failed');
//     });

//     setPeer(peer);
//   };

//   const startCall = async () => {
//     if (!socket || socket.readyState !== WebSocket.OPEN) return;

//     try {
//       const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//       setLocalStream(stream);

//       if (!peer) {
//         createPeer();
//       }

//       const call = peer.call(receiver, stream);
//       call.on('stream', (remoteStream) => {
//         remoteAudioRef.current.srcObject = remoteStream;
//         setRemoteStream(remoteStream);
//         setInCall(true);
//         setCallStatus(`In call with ${receiver}`);
//       });
//       setCurrentCall(call);
//       setCallStatus(`Calling ${receiver}...`);
//     } catch (err) {
//       console.error('Error accessing microphone:', err);
//       setCallStatus('Microphone access denied or error occurred.');
//     }
//   };

//   const answerCall = () => {
//     setIncomingCall(false);
//     setCallStatus('Connecting...');
//     currentCall.answer(localStream);
//     currentCall.on('stream', (remoteStream) => {
//       remoteAudioRef.current.srcObject = remoteStream;
//       setRemoteStream(remoteStream);
//       setInCall(true);
//       setCallStatus(`In call with ${receiver}`);
//     });
//   };

//   const rejectCall = () => {
//     setIncomingCall(false);
//     setCallStatus('Call Declined');
//     currentCall.close();
//     socket?.send(JSON.stringify({
//       receiver,
//       payload: { type: 'end-call' },
//     }));
//   };

//   const endCall = () => {
//     socket?.send(JSON.stringify({
//       receiver,
//       payload: { type: 'end-call' },
//     }));

//     if (currentCall) {
//       currentCall.close();
//     }

//     if (localStream) {
//       localStream.getTracks().forEach(track => track.stop());
//     }

//     setInCall(false);
//     setCallStatus('');
//   };

//   return (
//     <div style={{ marginTop: '12px' }}>
//       <h5>Voice Call with {receiver}</h5>
//       {callStatus && <p>{callStatus}</p>}
//       {!inCall && !incomingCall && socket?.readyState === WebSocket.OPEN && (
//         <button onClick={startCall}>Call {receiver}</button>
//       )}
//       {inCall && (
//         <button onClick={endCall} style={{ backgroundColor: '#f44336', color: 'white' }}>
//           End Call
//         </button>
//       )}
//       {incomingCall && !inCall && (
//         <div>
//           <button onClick={answerCall}>Answer</button>
//           <button
//             onClick={rejectCall}
//             style={{ marginLeft: '10px', backgroundColor: '#f44336', color: 'white' }}
//           >
//             Reject
//           </button>
//         </div>
//       )}
//       <div>
//         <audio ref={localAudioRef} muted autoPlay />
//         <audio ref={remoteAudioRef} autoPlay />
//       </div>
//     </div>
//   );
// };

// export default VoiceCallComponent;

import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Mic, MicOff, PhoneOff } from 'lucide-react';
import './VoiceCallComponent.css'; // We'll create this CSS file

// Basic STUN server configuration (Google's public STUN servers)
// For production, you might need TURN servers as well for NAT traversal.
const peerConnectionConfig = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
  ],
};

const VoiceCallComponent = ({ username, receiver, onEndCall, isCaller }) => {
  const [callStatus, setCallStatus] = useState('Initializing...'); // e.g., 'Initializing', 'Calling', 'Receiving', 'Connected', 'Failed', 'Ended'
  const [isMuted, setIsMuted] = useState(false);

  // Refs for core WebRTC objects and media elements
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteStreamRef = useRef(null);
  const signalingSocketRef = useRef(null);
  const remoteAudioRef = useRef(null); // Ref for the <audio> element

  // Helper function to send signals via WebSocket
  const sendSignal = useCallback((type, payload) => {
    if (signalingSocketRef.current && signalingSocketRef.current.readyState === WebSocket.OPEN) {
      const signal = {
        receiver: receiver, // Send to the other peer
        type: type,
        payload: payload,
      };
      console.log(`Sending signal: ${type} to ${receiver}`);
      signalingSocketRef.current.send(JSON.stringify(signal));
    } else {
      console.error('Signaling socket not open. Cannot send signal:', type);
       setCallStatus('Failed'); // Indicate failure if socket isn't ready
    }
  }, [receiver]); // Dependency: receiver username

  // Function to clean up resources
  const cleanupCall = useCallback((notifyPeer = true) => {
    console.log('Cleaning up call...');
    setCallStatus('Ended');

    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
      localStreamRef.current = null;
    }
    if (remoteStreamRef.current) {
       remoteStreamRef.current.getTracks().forEach(track => track.stop());
       remoteStreamRef.current = null;
    }
     // Clean up audio element source
    if (remoteAudioRef.current) {
       remoteAudioRef.current.srcObject = null;
    }


    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.onicecandidate = null;
      peerConnectionRef.current.ontrack = null;
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    // Send hangup signal if requested and socket is available
    if (notifyPeer) {
       sendSignal('hangup', {}); // Let the other peer know
    }


    // Close signaling socket
    if (signalingSocketRef.current) {
      signalingSocketRef.current.onmessage = null;
      signalingSocketRef.current.onclose = null;
      signalingSocketRef.current.onerror = null;
      if (signalingSocketRef.current.readyState === WebSocket.OPEN) {
          signalingSocketRef.current.close();
      }
      signalingSocketRef.current = null;
    }

     // Notify parent component to close UI etc.
    if (onEndCall) {
       onEndCall();
    }

  }, [sendSignal, onEndCall]); // Dependencies


  // Initialize WebSocket and getUserMedia
  useEffect(() => {
    console.log(`VoiceCallComponent Mounted. User: ${username}, Receiver: ${receiver}, isCaller: ${isCaller}`);
    let isMounted = true; // Flag to prevent state updates on unmounted component

    const initialize = async () => {
      try {
        // 1. Get User Media (Microphone)
        console.log('Requesting microphone access...');
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted) {
            stream.getTracks().forEach(track => track.stop()); // Stop stream if component unmounted quickly
            return;
        };
        console.log('Microphone access granted.');
        localStreamRef.current = stream;
        // Optional: Attach local stream to an audio element for testing (muted)
        // const localAudio = document.createElement('audio');
        // localAudio.srcObject = stream;
        // localAudio.muted = true;

        // 2. Initialize Signaling WebSocket
        const wsUrl = `ws://127.0.0.1:8000/ws/call/${username}/`;
        console.log(`Connecting to signaling server: ${wsUrl}`);
        const socket = new WebSocket(wsUrl);
        signalingSocketRef.current = socket;

        socket.onopen = () => {
          if (!isMounted) return;
          console.log('Signaling WebSocket connected.');
          setCallStatus(isCaller ? 'Connecting...' : 'Waiting for connection...'); // Initial status after WS connect

          // Proceed with PeerConnection setup only after WebSocket is open
          setupPeerConnection();

           // If this user is the caller, initiate the offer process
           if (isCaller) {
             createOffer();
           } else {
             setCallStatus('Waiting for call...'); // Callee waits for offer
           }

        };

        socket.onmessage = (event) => {
          if (!isMounted) return;
          handleSignalingData(JSON.parse(event.data));
        };

        socket.onerror = (error) => {
          if (!isMounted) return;
          console.error('Signaling WebSocket error:', error);
          setCallStatus('Failed');
          cleanupCall(false); // Clean up without notifying peer (socket failed)
        };

        socket.onclose = (event) => {
          if (!isMounted) return;
          console.log('Signaling WebSocket closed:', event.code, event.reason);
          // Don't automatically set to failed if cleanup was initiated
          if (callStatus !== 'Ended' && callStatus !== 'Failed') {
             setCallStatus('Failed'); // Or 'Disconnected'
             cleanupCall(false);
          }
        };

      } catch (err) {
        if (!isMounted) return;
        console.error('Error initializing call:', err);
        alert('Could not access microphone. Please check permissions.');
        setCallStatus('Failed');
        cleanupCall(false);
      }
    };

    const setupPeerConnection = () => {
        if (!isMounted || !localStreamRef.current || !signalingSocketRef.current) {
             console.error("Cannot setup PeerConnection: prerequisites not met.");
             if (isMounted) setCallStatus('Failed');
             return; // Exit if prerequisites aren't ready
        }

         console.log('Setting up RTCPeerConnection...');
         const pc = new RTCPeerConnection(peerConnectionConfig);
         peerConnectionRef.current = pc;

         // Add local audio tracks to the connection
         localStreamRef.current.getTracks().forEach(track => {
           console.log('Adding local track:', track.kind);
           pc.addTrack(track, localStreamRef.current);
         });

         // Handle ICE Candidates
         pc.onicecandidate = (event) => {
           if (event.candidate) {
             console.log('Generated ICE candidate:', event.candidate.candidate.substring(0, 30) + "..."); // Log concisely
             sendSignal('candidate', event.candidate);
           } else {
             console.log('All ICE candidates have been sent.');
           }
         };

          // Handle remote stream
         pc.ontrack = (event) => {
            console.log('Received remote track:', event.track.kind, 'Stream:', event.streams[0].id);
             if (event.streams && event.streams[0]) {
                remoteStreamRef.current = event.streams[0];
                if (remoteAudioRef.current) {
                    console.log('Attaching remote stream to audio element.');
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                    remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e)); // Autoplay might require user interaction
                    setCallStatus('Connected'); // Update status when track is received
                } else {
                    console.warn("Remote audio element ref not available yet.");
                }

             } else {
                 console.warn("Received track event without stream.");
                 // Handle cases where track might be added without a full stream initially (less common for basic audio)
                 if (!remoteStreamRef.current) {
                     remoteStreamRef.current = new MediaStream();
                 }
                 remoteStreamRef.current.addTrack(event.track);
                  if (remoteAudioRef.current) {
                    console.log('Attaching reconstructed remote stream to audio element.');
                    remoteAudioRef.current.srcObject = remoteStreamRef.current;
                    remoteAudioRef.current.play().catch(e => console.error("Error playing remote audio:", e));
                    setCallStatus('Connected');
                  }
             }
         };

         // Handle connection state changes (useful for detecting disconnects)
         pc.onconnectionstatechange = (event) => {
             console.log(`PeerConnection state changed: ${pc.connectionState}`);
             switch (pc.connectionState) {
                 case "connected":
                    // Already handled by ontrack generally, but good for confirmation
                    if (callStatus !== 'Connected') setCallStatus('Connected');
                    break;
                 case "disconnected":
                 case "failed":
                     console.warn(`PeerConnection state is ${pc.connectionState}. Cleaning up.`);
                     setCallStatus('Failed'); // Or 'Disconnected'
                     cleanupCall(false); // Connection lost, likely no need to send hangup
                     break;
                 case "closed":
                     console.log("PeerConnection state is closed.");
                     // Usually follows cleanupCall, no action needed unless unexpected
                     break;
                 default:
                     // connecting, new etc.
                     break;
             }
         };
    };

    const handleSignalingData = async (data) => {
      if (!isMounted || !peerConnectionRef.current) {
           console.log("Component unmounted or PeerConnection not ready, ignoring signal:", data.type);
           return;
      }
      console.log(`Received signal: ${data.type} from ${data.sender}`);

      switch (data.type) {
        case 'offer':
           // Received an offer (Callee role)
           if (!isCaller) { // Ensure only callee processes offer
               setCallStatus('Receiving call...');
               try {
                   console.log('Setting remote description (offer)...');
                   await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.payload));
                   console.log('Creating answer...');
                   const answer = await peerConnectionRef.current.createAnswer();
                   console.log('Setting local description (answer)...');
                   await peerConnectionRef.current.setLocalDescription(answer);
                   sendSignal('answer', answer); // Send the answer back
                   setCallStatus('Answering...');
               } catch (error) {
                   console.error('Error handling offer:', error);
                   setCallStatus('Failed');
                   cleanupCall(true); // Notify caller about the failure
               }
           } else {
                console.warn("Caller received an unexpected offer signal.");
           }
          break;
        case 'answer':
           // Received an answer (Caller role)
           if (isCaller) { // Ensure only caller processes answer
               try {
                   console.log('Setting remote description (answer)...');
                   await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.payload));
                   console.log('Call negotiation complete (answer received). Waiting for connection...');
                   // Status changes to 'Connected' typically when 'ontrack' or 'onconnectionstatechange' fires
                   setCallStatus('Connecting...'); // Indicate we're establishing connection
               } catch (error) {
                   console.error('Error handling answer:', error);
                   setCallStatus('Failed');
                   cleanupCall(true);
               }
           } else {
                console.warn("Callee received an unexpected answer signal.");
           }
          break;
        case 'candidate':
          // Received an ICE candidate
          try {
            if (data.payload) {
                console.log('Adding received ICE candidate:', data.payload.candidate.substring(0, 30) + "...");
                await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.payload));
            } else {
                 console.log("Received null ICE candidate signal (end of candidates).");
            }
          } catch (error) {
            // Ignore benign errors like adding candidates before remote description is set
            if (error.name !== "InvalidStateError") {
                 console.error('Error adding received ICE candidate:', error);
            } else {
                 console.log("Ignoring ICE candidate received in invalid state (likely race condition).");
            }
          }
          break;
        case 'hangup':
          console.log('Received hangup signal.');
          setCallStatus('Ended by peer');
          cleanupCall(false); // Don't send hangup back
          break;
        default:
          console.log('Unknown signal type:', data.type);
      }
    };

     const createOffer = async () => {
       if (!peerConnectionRef.current || !isMounted) return;

       try {
           setCallStatus('Calling...');
           console.log('Creating offer...');
           const offer = await peerConnectionRef.current.createOffer();
           console.log('Setting local description (offer)...');
           await peerConnectionRef.current.setLocalDescription(offer);
           sendSignal('offer', offer); // Send the offer to the receiver
       } catch (error) {
           console.error('Error creating offer:', error);
           setCallStatus('Failed');
           cleanupCall(true); // Notify receiver about failure
       }
    };


    initialize(); // Start the process

    // Cleanup function
    return () => {
      console.log("VoiceCallComponent Unmounting...");
      isMounted = false; // Set flag to prevent async updates
      // Determine if hangup signal should be sent based on current status
      const shouldNotify = callStatus !== 'Ended' && callStatus !== 'Ended by peer' && callStatus !== 'Failed' && callStatus !== 'Initializing...';
      cleanupCall(shouldNotify);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, receiver, isCaller, onEndCall]); // Re-run effect if these core props change (shouldn't during a call ideally)


  const toggleMute = () => {
    if (!localStreamRef.current) return;
    localStreamRef.current.getAudioTracks().forEach(track => {
      track.enabled = !track.enabled;
    });
    setIsMuted(prev => !prev);
     console.log(`Microphone ${isMuted ? 'unmuted' : 'muted'}`);
  };

  const handleEndCallClick = () => {
      cleanupCall(true); // Send hangup signal and clean up
  }

  return (
    <div className="voice-call-container">
      <p className="call-status">Status: {callStatus}</p>
      <p className="call-participants">
        {isCaller ? `Calling ${receiver}` : `Call from ${receiver}`}
      </p>

      {/* Hidden audio element to play the remote stream */}
      <audio ref={remoteAudioRef} autoPlay playsInline />

      <div className="call-controls">
        <button onClick={toggleMute} className={`control-button ${isMuted ? 'muted' : ''}`}>
          {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
          <span>{isMuted ? 'Unmute' : 'Mute'}</span>
        </button>
        <button onClick={handleEndCallClick} className="control-button end-call">
          <PhoneOff size={24} />
          <span>End Call</span>
        </button>
      </div>
    </div>
  );
};

export default VoiceCallComponent;