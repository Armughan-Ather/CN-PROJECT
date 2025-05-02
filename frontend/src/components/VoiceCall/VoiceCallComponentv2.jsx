import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../assets/AuthContext";
import "./VoiceCallComponent.css";

const VoiceCallComponent = () => {
  const [username, setUsername] = useState("");
  const [otherUser, setOtherUser] = useState("");
  const [callStatus, setCallStatus] = useState("");
  const [remoteRTCMessage, setRemoteRTCMessage] = useState(null);
  const { user } = useAuth();

  const callSocket = useRef(null);
  const localVideo = useRef(null);
  const remoteVideo = useRef(null);
  const peerConnection = useRef(null);
  const isRemoteDescriptionSet = useRef(false);
  const candidateQueue = useRef([]);

  const pcConfig = {
    iceServers: [
      { urls: "stun:stun.jap.bloggernepal.com:5349" },
      {
        urls: "turn:turn.jap.bloggernepal.com:5349",
        username: "guest",
        credential: "somepassword",
      },
    ],
  };

  useEffect(() => {
    connectSocket();
    return () => callSocket.current?.close();
  }, []);

  const connectSocket = () => {
    callSocket.current = new WebSocket(`ws://127.0.0.1:8000/ws/call/`);
    callSocket.current.onopen = () => {
      callSocket.current.send(
        JSON.stringify({
          type: "login",
          data: { name: user?.username },
        })
      );
    };
    callSocket.current.onmessage = (e) => {
      const { type, data } = JSON.parse(e.data);
      if (type === "connection") console.log(data.message);
      else if (type === "call_received") onNewCall(data);
      else if (type === "call_answered") onCallAnswered(data);
      else if (type === "ICEcandidate") onICECandidate(data);
      else if (type === "call_cancelled") onCallCancelled(data);
    };
  };

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection(pcConfig);
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        safeSendICECandidate({
          user: otherUser,
          rtcMessage: {
            label: event.candidate.sdpMLineIndex,
            id: event.candidate.sdpMid,
            candidate: event.candidate.candidate,
          },
        });
      }
    };
    pc.ontrack = (event) => {
      remoteVideo.current.srcObject = event.streams[0];
    };
    peerConnection.current = pc;
    return pc;
  };

  const safeSendICECandidate = (candidate) => {
    if (isRemoteDescriptionSet.current) {
      callSocket.current.send(
        JSON.stringify({ type: "ICEcandidate", data: candidate })
      );
    } else {
      candidateQueue.current.push(candidate);
    }
  };

  const flushCandidateQueue = () => {
    while (candidateQueue.current.length > 0) {
      const queuedCandidate = candidateQueue.current.shift();
      callSocket.current.send(
        JSON.stringify({ type: "ICEcandidate", data: queuedCandidate })
      );
    }
  };

  const beReady = () => {
    return navigator.mediaDevices
      .getUserMedia({ audio: true, video: true })
      .then((stream) => {
        localVideo.current.srcObject = stream;
        const pc = createPeerConnection();
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));
        return pc;
      })
      .catch((err) => {
        alert("Media access error: " + err.name);
        throw err;
      });
  };

  const waitForSocketConnection = (socket, callback) => {
    const interval = setInterval(() => {
      if (socket.readyState === WebSocket.OPEN) {
        clearInterval(interval);
        callback();
      }
    }, 100);
  };

  const sendCall = (data) => {
    waitForSocketConnection(callSocket.current, () => {
      callSocket.current.send(JSON.stringify({ type: "call", data }));
      setCallStatus("calling");
    });
  };

  const answerCall = (data) => {
    callSocket.current.send(JSON.stringify({ type: "answer_call", data }));
    setCallStatus("call_started");
  };

  const cancelCall = () => {
    callSocket.current.send(
      JSON.stringify({
        type: "cancel_call",
        caller: user?.username,
        callee: otherUser,
      })
    );
    setCallStatus("call_ended");
  };

  const onNewCall = (data) => {
    setOtherUser(data.caller);
    setRemoteRTCMessage(data.rtcMessage);
    setCallStatus("waiting_for_answer");
  };

  const onCallAnswered = async (data) => {
    const remoteDesc = new RTCSessionDescription(data.rtcMessage);
    await peerConnection.current.setRemoteDescription(remoteDesc);
    isRemoteDescriptionSet.current = true;
    flushCandidateQueue();
    setCallStatus("call_started");
  };

  const onICECandidate = (data) => {
    const candidate = new RTCIceCandidate({
      sdpMLineIndex: data.rtcMessage.label,
      candidate: data.rtcMessage.candidate,
    });
    peerConnection.current?.addIceCandidate(candidate);
  };

  const onCallCancelled = (data) => {
    if (data.caller === user?.username || data.callee === user?.username) {
      setCallStatus("call_ended");
      setOtherUser("");
      setRemoteRTCMessage(null);
      alert(`${data.caller || data.callee} has cancelled the call.`);
    }
  };

  const processCall = async () => {
    try {
      const pc = await beReady();
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      sendCall({ name: username, rtcMessage: offer });
    } catch (err) {
      console.error("Error in processCall:", err);
    }
  };

  const processAccept = async () => {
    try {
      const pc = await beReady();
      await pc.setRemoteDescription(new RTCSessionDescription(remoteRTCMessage));
      isRemoteDescriptionSet.current = true;
      flushCandidateQueue();
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);
      answerCall({ caller: otherUser, rtcMessage: answer });
    } catch (err) {
      console.error("Error accepting call:", err);
    }
  };

  return (
    <div className="voice-call-container">
      <h2>WebRTC Voice Call</h2>
      <div className="input-section">
        <input
          type="text"
          placeholder="Enter Username to Call"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
        />
        <button
          className="call-button"
          onClick={processCall}
          disabled={!username}
        >
          Call
        </button>
      </div>

      {callStatus === "calling" && (
        <div className="calling-ui">
          <p>Calling {username}...</p>
        </div>
      )}

      {callStatus === "waiting_for_answer" && (
        <div className="answer-ui">
          <p>Incoming call from {otherUser}</p>
          <button className="answer-button" onClick={processAccept}>
            Answer
          </button>
        </div>
      )}

      {callStatus === "call_started" && (
        <div className="call-ui">
          <p>Call started with {otherUser}</p>
          <button className="end-call-button" onClick={cancelCall}>
            End Call
          </button>
        </div>
      )}

      {callStatus === "call_ended" && (
        <div className="call-ended">
          <p>Call ended.</p>
        </div>
      )}

      <video
        className="local-video"
        ref={localVideo}
        autoPlay
        playsInline
        muted
      ></video>
      <video
        className="remote-video"
        ref={remoteVideo}
        autoPlay
        playsInline
      ></video>
    </div>
  );
};

export default VoiceCallComponent;
