import React, { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';

const VoiceCallComponent = ({ username, receiver }) => {
  const [socket, setSocket] = useState(null);
  const peerRef = useRef(null);
  const streamRef = useRef(null);

  useEffect(() => {
    const ws = new WebSocket(`ws://localhost:8000/ws/call/${username}/`);
    setSocket(ws);

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.payload && data.sender === receiver) {
        if (data.payload.type === 'offer') {
          handleReceiveOffer(data.payload);
        } else if (data.payload.type === 'answer') {
          peerRef.current.signal(data.payload);
        }
      }
    };

    return () => {
      ws.close();
    };
  }, [username, receiver]);

  const handleReceiveOffer = async (offer) => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const peer = new Peer({ initiator: false, trickle: false, stream });
    peer.signal(offer);

    peer.on('signal', (data) => {
      socket.send(JSON.stringify({
        receiver,
        payload: data
      }));
    });

    peer.on('stream', (remoteStream) => {
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play();
    });

    peerRef.current = peer;
  };

  const startCall = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    streamRef.current = stream;

    const peer = new Peer({ initiator: true, trickle: false, stream });

    peer.on('signal', (data) => {
      socket.send(JSON.stringify({
        receiver,
        payload: data
      }));
    });

    peer.on('stream', (remoteStream) => {
      const audio = new Audio();
      audio.srcObject = remoteStream;
      audio.play();
    });

    peerRef.current = peer;
  };

  return (
    <div>
      <button onClick={startCall}>Call {receiver}</button>
    </div>
  );
};

export default VoiceCallComponent;
