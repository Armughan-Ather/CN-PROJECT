// import React, { useEffect, useState, useRef } from 'react';
// import { useAuth } from '../../assets/AuthContext';
// import axios from 'axios';
// import { PhoneCall, Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
// import './chat.css';
// import VoiceCallComponent from '../VoiceCall/VoiceCallComponent';

// const Chat = () => {
//   const { user } = useAuth();
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null);
//   const [message, setMessage] = useState('');
//   const [messages, setMessages] = useState([]);
//   const [showSidebar, setShowSidebar] = useState(true);
//   const [recentChats, setRecentChats] = useState([]);
//   const socketRef = useRef(null);
//   const messagesEndRef = useRef(null);

//   // State for managing voice call UI
//   const [showCallUI, setShowCallUI] = useState(false);
//   const [peerConnection, setPeerConnection] = useState(null); // Store peer connection for WebRTC

//   // Auto-scroll to bottom when new messages arrive
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Handle WebSocket connection
//   useEffect(() => {
//     if (!user || !user.username || !selectedUser) return;

//     const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${selectedUser}/`);
//     socketRef.current = ws;

//     ws.onopen = () => console.log("WebSocket connected");
//     ws.onmessage = (event) => {
//       const data = JSON.parse(event.data);

//       if (
//         data.sender === selectedUser || data.receiver === selectedUser
//       ) {
//         setMessages((prev) => [...prev, data]);
//       }
//     };
//     ws.onclose = () => console.log("WebSocket disconnected");

//     return () => ws.close();
//   }, [user, selectedUser]);

//   // Fetch recent chats on component mount
//   useEffect(() => {
//     if (user && user.accessToken) {
//       fetchRecentChats();
//     }
//   }, [user]);

//   useEffect(() => {
//     if (selectedUser) {
//       fetchChatHistory(selectedUser);
//     }
//   }, [selectedUser]);

//   // Handle user search
//   useEffect(() => {
//     const fetchUsers = async () => {
//       if (!searchQuery.trim() || !user || !user.accessToken) {
//         setSearchResults([]);
//         return;
//       }

//       try {
//         const res = await axios.get(`http://127.0.0.1:8000/chat/search-users/?q=${searchQuery}`, {
//           headers: {
//             Authorization: `Bearer ${user.accessToken}`,
//           },
//         });
//         setSearchResults(res.data);
//       } catch (error) {
//         console.error('Search error:', error);
//       }
//     };

//     const delayDebounce = setTimeout(fetchUsers, 300);
//     return () => clearTimeout(delayDebounce);
//   }, [searchQuery, user]);

//   // Initiate the voice call (get media and show UI)
//   const initiateCall = async () => {
//     try {
//       await navigator.mediaDevices.getUserMedia({ audio: true });
//       setShowCallUI(true); // Show the call UI on successful media access

//       // Create a new WebRTC peer connection
//       const pc = new RTCPeerConnection();
//       setPeerConnection(pc);
//       pc.onicecandidate = handleICECandidate;
//       pc.ontrack = handleTrack;

//       // Handle signaling here (offer, answer, signaling channel)
//       // Placeholder for signaling code (e.g., send/receive SDP)
//     } catch (err) {
//       alert("Microphone permission is required to make a call.");
//       console.error("Error accessing media devices:", err);
//     }
//   };

//   // Handle ICE candidates
//   const handleICECandidate = (event) => {
//     if (event.candidate) {
//       // Send the ICE candidate to the remote peer
//       console.log('New ICE candidate:', event.candidate);
//     }
//   };

//   // Handle remote media tracks
//   const handleTrack = (event) => {
//     const remoteStream = event.streams[0];
//     // Display the remote video/audio
//     console.log('Received remote stream:', remoteStream);
//   };

//   // Fetch recent chats
//   const fetchRecentChats = async () => {
//     try {
//       const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
//         headers: {
//           Authorization: `Bearer ${user.accessToken}`,
//         },
//       });
//       setRecentChats(res.data);
//     } catch (error) {
//       console.error('Error fetching recent chats:', error);
//     }
//   };

//   // Fetch chat history with a specific user
//   const fetchChatHistory = async (username) => {
//     try {
//       const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
//         headers: {
//           Authorization: `Bearer ${user.accessToken}`,
//         },
//       });
//       setMessages(res.data);
//     } catch (error) {
//       console.error('Error fetching chat history:', error);
//       setMessages([]);
//     }
//   };

//   // Send message
//   const sendMessage = () => {
//     if (!message.trim()) return;
//     if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
//       socketRef.current.send(JSON.stringify({
//         sender: user.username,
//         receiver: selectedUser,
//         message: message.trim(),
//       }));
//       setMessage('');
//     }
//   };

//   // Format timestamp
//   const formatTime = (timestamp) => {
//     if (!timestamp) return '';
//     const date = new Date(timestamp);
//     return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
//   };

//   // Format date for message grouping
//   const formatMessageDate = (timestamp) => {
//     if (!timestamp) return '';
//     const date = new Date(timestamp);
//     const today = new Date();

//     if (date.toDateString() === today.toDateString()) {
//       return 'Today';
//     }

//     const yesterday = new Date();
//     yesterday.setDate(yesterday.getDate() - 1);
//     if (date.toDateString() === yesterday.toDateString()) {
//       return 'Yesterday';
//     }

//     return date.toLocaleDateString();
//   };

//   // Toggle mobile sidebar
//   const toggleSidebar = () => {
//     setShowSidebar(!showSidebar);
//   };

//   // Select a chat user
//   const selectUserChat = (username) => {
//     setSelectedUser(username);
//     setMessages([]);
//     if (window.innerWidth < 768) {
//       setShowSidebar(false);
//     }
//   };

//   return (
//     <div className="chat-container">
//       {/* Sidebar - Chat list */}
//       <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
//         <div className="sidebar-header">
//           <h2>Chats</h2>
//           <div className="header-icons">
//             <MoreVertical size={20} className="icon" />
//           </div>
//         </div>

//         <div className="search-container">
//           <div className="search-wrapper">
//             <Search size={18} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search or start new chat"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="search-input"
//             />
//           </div>
//         </div>

//         {searchResults.length > 0 ? (
//           <ul className="chat-list search-results">
//             {searchResults.map((u) => (
//               <li
//                 key={u.username}
//                 onClick={() => selectUserChat(u.username)}
//                 className="chat-list-item"
//               >
//                 <div className="avatar">{u.username.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{u.username}</div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <ul className="chat-list">
//             {recentChats.map((chat) => (
//               <li
//                 key={chat.username}
//                 onClick={() => selectUserChat(chat.username)}
//                 className={`chat-list-item ${selectedUser === chat.username ? 'active' : ''}`}
//               >
//                 <div className="avatar">{chat.username.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{chat.username}</div>
//                   <div className="chat-last-message">{chat.lastMessage}</div>
//                 </div>
//                 <div className="chat-meta">
//                   <span className="chat-time">{formatTime(chat.timestamp)}</span>
//                   {chat.unreadCount > 0 && (
//                     <span className="unread-count">{chat.unreadCount}</span>
//                   )}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div>

//       {/* Main chat area */}
//       <div className="chat-main">
//         {selectedUser ? (
//           <>
//             <div className="chat-header">
//               {window.innerWidth < 768 && (
//                 <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
//               )}
//               <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
//               <div className="user-info">
//                 <h3>{selectedUser}</h3>
//                 <span className="user-status">Online</span>
//               </div>
//               <div className="header-actions">
//                 <PhoneCall
//                   size={20}
//                   className="call-icon"
//                   onClick={initiateCall}
//                   title="Call"
//                 />
//                 <MoreVertical size={20} className="icon" />
//               </div>
//             </div>

//             <div className="messages-container">
//               {messages.length > 0 ? (
//                 <div className="messages-list">
//                   {messages.map((msg, idx) => {
//                     const isCurrentUser = msg.sender === user.username;
//                     const messageDate = formatMessageDate(msg.timestamp);
//                     const showDateHeader = idx === 0 || 
//                       formatMessageDate(messages[idx - 1]?.timestamp) !== messageDate;

//                     return (
//                       <React.Fragment key={idx}>
//                         {showDateHeader && (
//                           <div className="date-separator">
//                             <span>{messageDate}</span>
//                           </div>
//                         )}
//                         <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
//                           <div className="message-content">
//                             {msg.message}
//                             <span className="message-time">{formatTime(msg.timestamp)}</span>
//                           </div>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}
//                   <div ref={messagesEndRef} />
//                 </div>
//               ) : (
//                 <div className="empty-chat">
//                   <p>Start a conversation with {selectedUser}</p>
//                 </div>
//               )}
//             </div>

//             <div className="message-input-container">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
//                 placeholder="Type a message"
//                 className="message-input"
//               />
//               <button
//                 onClick={sendMessage}
//                 className="send-button"
//                 disabled={!message.trim()}
//               >
//                 <Send size={20} />
//               </button>
//             </div>

//             {/* Call UI Overlay */}
//             {showCallUI && (
//               <div className="call-ui-overlay">
//                 <div className="call-box">
//                   <h4>Voice Call with {selectedUser}</h4>
//                   <VoiceCallComponent username={user.username} receiver={selectedUser} />
//                   <button className="end-call-btn" onClick={() => setShowCallUI(false)}>
//                     End Call
//                   </button>
//                 </div>
//               </div>
//             )}
//           </>
//         ) : (
//           <div className="no-chat-selected">
//             <div className="welcome-message">
//               <h3>Welcome to the Chat</h3>
//               <p>Select a user from the list to start chatting</p>
//             </div>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default Chat;

// import React, { useEffect, useState, useRef } from 'react';
// import { useAuth } from '../../assets/AuthContext'; // Assuming AuthContext provides { user: { username, accessToken } }
// import axios from 'axios';
// import { PhoneCall, Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
// import './chat.css'; // Ensure this CSS file exists and is styled
// import VoiceCallComponent from '../VoiceCall/VoiceCallComponent'; // Import the call component

// const Chat = () => {
//   const { user } = useAuth(); // Get user info from context

//   // Component State
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null); // The user being chatted with/called
//   const [message, setMessage] = useState(''); // Current message input
//   const [messages, setMessages] = useState([]); // History/live messages for selectedUser
//   const [showSidebar, setShowSidebar] = useState(true); // For mobile responsiveness
//   const [recentChats, setRecentChats] = useState([]); // List of recent chat partners

//   // Refs
//   const chatSocketRef = useRef(null); // Ref for the chat WebSocket connection
//   const messagesEndRef = useRef(null); // Ref to scroll to the bottom of messages
//   const callSocketRef = useRef(null); // WebSocket for call signaling


//   // --- Voice Call State ---
//   const [isCallActive, setIsCallActive] = useState(false); // Is the call UI currently visible?
//   const [isMakingCall, setIsMakingCall] = useState(false); // Are *we* the one who initiated the call? (Determines isCaller prop)
//   // Note: Handling *incoming* calls needs additional logic (e.g., a persistent signaling listener)

//   // --- Effects ---

//   // Auto-scroll messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Fetch recent chats when user logs in
//   useEffect(() => {
//     if (user && user.accessToken) {
//       fetchRecentChats();
//     } else {
//       setRecentChats([]); // Clear if no user
//     }
//   }, [user]); // Dependency: user object

//   // Fetch chat history when a user is selected
//   useEffect(() => {
//     if (selectedUser && user?.accessToken) {
//       fetchChatHistory(selectedUser);
//     } else {
//        setMessages([]); // Clear messages if no user selected or no token
//     }
//     // No need to include fetchChatHistory in dependencies if defined outside/stable
//   }, [selectedUser, user?.accessToken]); // Dependency: selectedUser, user token

//   // Handle Chat WebSocket connection
//   useEffect(() => {
//     // Ensure we have a logged-in user and a selected chat partner
//     if (!user?.username || !selectedUser) {
//       // Close existing connection if user logs out or deselects chat
//       if (chatSocketRef.current) {
//         console.log("Closing chat WebSocket (no user/selection).");
//         chatSocketRef.current.close();
//         chatSocketRef.current = null;
//       }
//       return; // Exit effect
//     }

//     // Close previous connection if selectedUser changes
//     if (chatSocketRef.current) {
//       console.log(`Chat user changed to ${selectedUser}, closing previous chat WebSocket.`);
//       chatSocketRef.current.close();
//     }

//     // Establish WebSocket connection to the user's own endpoint
//     // Assumes backend consumer routes based on sender/receiver in message payload
//     const wsUrl = `ws://127.0.0.1:8000/ws/chat/${user.username}/`;
//     console.log(`Establishing chat WebSocket connection: ${wsUrl}`);
//     const ws = new WebSocket(wsUrl);
//     chatSocketRef.current = ws;

//     ws.onopen = () => {
//       console.log(`Chat WebSocket connected for ${user.username}`);
//       // Optional: Send a message indicating user is online or ready
//     };

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("Chat message received:", data);

//         // Check if the message belongs to the currently active chat window
//         const isCurrentChat = (data.sender === user.username && data.receiver === selectedUser) ||
//                               (data.sender === selectedUser && data.receiver === user.username);

//         if (isCurrentChat) {
//           // Add message to the current chat window
//           // Ensure message object has a unique key if rendering directly from this data later
//           setMessages((prevMessages) => [...prevMessages, data]);
//         } else {
//           console.log("Received message for a different chat.");
//           // TODO: Implement notification/unread count logic for other chats
//           // You might need to update the `recentChats` state here
//         }
//       } catch (error) {
//         console.error("Failed to parse incoming chat message:", error);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error("Chat WebSocket error:", error);
//       // Optional: Add user feedback about connection issues
//     };

//     ws.onclose = (event) => {
//       console.log(`Chat WebSocket disconnected for ${user.username}. Code: ${event.code}, Reason: ${event.reason}`);
//       chatSocketRef.current = null; // Clear the ref
//       // Optional: Implement reconnection logic if needed
//     };

//     // Cleanup function: Close WebSocket when component unmounts or dependencies change
//     return () => {
//       if (ws && ws.readyState === WebSocket.OPEN) {
//         console.log(`Closing chat WebSocket for ${user.username}.`);
//         ws.close();
//       }
//       chatSocketRef.current = null;
//     };
//     // Dependencies: Reconnect if user logs in/out or selectedUser changes
//   }, [user, selectedUser]);

//   // Persistent Call WebSocket Connection (for receiving calls anytime)
// useEffect(() => {
//   if (!user?.username) return;

//   const callWs = new WebSocket(`ws://127.0.0.1:8000/ws/call/${user.username}/`);
//   callSocketRef.current = callWs;

//   callWs.onopen = () => {
//     console.log("Call WebSocket connected for", user.username);
//   };

//   callWs.onmessage = (event) => {
//     const data = JSON.parse(event.data);
//     console.log("Call signaling message received:", data);

//     if (data.type === 'incoming_call') {
//       const fromUser = data.from;

//       // Show incoming call UI — mount VoiceCallComponent in receiver mode
//       setSelectedUser(fromUser); // Optional: switch context
//       setIsMakingCall(false);    // We're the receiver
//       setIsCallActive(true);     // Show the call UI
//     }

//     if (data.type === 'call_cancelled') {
//       console.log("Call was cancelled by caller.");
//       setIsCallActive(false);
//     }

//     if (data.type === 'call_accepted') {
//       console.log("Call accepted.");
//       // Could be used to update UI (e.g., move to active call state)
//     }

//     // You can handle more types as needed (e.g., 'call_ended', 'busy', etc.)
//   };

//   callWs.onerror = (err) => {
//     console.error("Call WebSocket error:", err);
//   };

//   callWs.onclose = () => {
//     console.log("Call WebSocket closed.");
//   };

//   // Cleanup
//   return () => {
//     if (callWs.readyState === WebSocket.OPEN) callWs.close();
//     callSocketRef.current = null;
//   };
// }, [user?.username]);



//   // Handle User Search (debounced)
//   useEffect(() => {
//     const fetchUsers = async () => {
//       if (!searchQuery.trim() || !user?.accessToken) {
//         setSearchResults([]);
//         return;
//       }
//       try {
//         const res = await axios.get(`http://127.0.0.1:8000/chat/search-users/?q=${searchQuery}`, {
//           headers: { Authorization: `Bearer ${user.accessToken}` },
//         });
//         setSearchResults(res.data);
//       } catch (error) {
//         console.error('Search error:', error);
//         setSearchResults([]); // Clear results on error
//       }
//     };

//     // Debounce API call
//     const delayDebounce = setTimeout(fetchUsers, 300);
//     return () => clearTimeout(delayDebounce); // Cleanup timeout

//   }, [searchQuery, user?.accessToken]); // Dependencies: search query, user token

//   // --- Functions ---

//   // Fetch recent chat partners
//   const fetchRecentChats = async () => {
//     if (!user?.accessToken) return;
//     try {
//       console.log("Fetching recent chats...");
//       const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       setRecentChats(res.data);
//     } catch (error) {
//       console.error('Error fetching recent chats:', error);
//       setRecentChats([]); // Clear on error
//     }
//   };

//   // Fetch message history for the selected user
//   const fetchChatHistory = async (username) => {
//      if (!username || !user?.accessToken) {
//          console.warn("fetchChatHistory skipped: no username or access token.");
//          setMessages([]); // Ensure messages are cleared
//          return;
//      }
//     console.log(`Workspaceing chat history with ${username}...`);
//     try {
//       const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       console.log(`History received for ${username}:`, res.data.length, "messages");
//       setMessages(res.data); // Update messages state
//     } catch (error) {
//       console.error(`Error fetching chat history for ${username}:`, error);
//       setMessages([]); // Clear messages on error
//     }
//   };

//   // Send a chat message via WebSocket
//   const sendMessage = () => {
//     const trimmedMessage = message.trim();
//     if (!trimmedMessage || !selectedUser || !user?.username) return;

//     if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
//       const messageData = {
//         sender: user.username,
//         receiver: selectedUser,
//         message: trimmedMessage,
//         // Add timestamp client-side for optimistic update if needed
//         // timestamp: new Date().toISOString()
//       };
//       console.log("Sending chat message:", messageData);
//       try {
//         chatSocketRef.current.send(JSON.stringify(messageData));
//         // Optimistic UI update (optional but improves perceived speed)
//         // setMessages((prev) => [...prev, { ...messageData, timestamp: new Date().toISOString() }]);
//         setMessage(''); // Clear input field
//       } catch (error) {
//           console.error("Error sending message via WebSocket:", error);
//           alert("Failed to send message. Connection issue?");
//       }
//     } else {
//       console.error('Chat WebSocket is not open. Cannot send message.');
//       alert('Cannot send message. Connection lost. Please refresh or try again.');
//     }
//   };

//   // --- Call Handling Functions ---

//   // Initiate the call process
//   const handleInitiateCall = () => {
//     if (!selectedUser) {
//       alert('Please select a user to call.');
//       return;
//     }
//     if (isCallActive) {
//       // Should ideally not happen due to button disabling, but good failsafe
//       alert('A call is already in progress.');
//       return;
//     }
//     console.log(`Initiating call with ${selectedUser}. Setting call state...`);
//     setIsMakingCall(true); // Set flag indicating *we* are the caller
//     setIsCallActive(true); // Set flag to show the VoiceCallComponent UI
//     // VoiceCallComponent will now mount and handle the WebRTC/Signaling process
//   };

//   // Callback passed to VoiceCallComponent, triggered when call ends
//   const handleEndCall = () => {
//     console.log('Chat.jsx: handleEndCall triggered by VoiceCallComponent. Resetting state.');
//     setIsCallActive(false); // Hide the call UI
//     setIsMakingCall(false); // Reset the caller flag
//     // Optionally add other cleanup logic here if needed
//   };

//   // --- UI Handlers & Formatters ---

//   // Toggle sidebar visibility (for mobile)
//   const toggleSidebar = () => {
//     setShowSidebar(!showSidebar);
//   };

//   // Handle selecting a user from the list
//   const selectUserChat = (username) => {
//      if (username === selectedUser) return; // Avoid re-selecting the same user

//     console.log("Selected chat:", username);
//     setSelectedUser(username); // Set the active chat partner
//     setMessages([]); // Clear messages from the previous chat immediately
//     setSearchQuery(''); // Clear search input
//     setSearchResults([]); // Clear search results list
//     // Hide sidebar on mobile after selection
//     if (window.innerWidth < 768) {
//       setShowSidebar(false);
//     }
//     // Chat history fetching is handled by the useEffect watching selectedUser
//   };

//   // Format timestamp for display (e.g., 10:30 AM)
//   const formatTime = (timestamp) => {
//     if (!timestamp) return '';
//     try {
//       const date = new Date(timestamp);
//       // Adjust options as needed for desired format
//       return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
//     } catch (e) {
//         console.error("Error formatting time:", e);
//         return "Invalid time";
//     }
//   };

//   // Format date for message grouping headers (e.g., Today, Yesterday, MM/DD/YYYY)
//   const formatMessageDate = (timestamp) => {
//      if (!timestamp) return '';
//      try {
//         const date = new Date(timestamp);
//         const today = new Date();
//         const yesterday = new Date();
//         yesterday.setDate(today.getDate() - 1);

//         if (date.toDateString() === today.toDateString()) return 'Today';
//         if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
//         // Adjust options for desired date format
//         return date.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
//     } catch(e) {
//         console.error("Error formatting message date:", e);
//         return "Invalid date";
//     }
//   };


//   // --- Render Logic ---
//   return (
//     <div className="chat-container">
//       {/* Sidebar Section */}
//       <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
//         <div className="sidebar-header">
//           <h2>Chats</h2>
//           <div className="header-icons">
//             <MoreVertical size={20} className="icon" /> {/* Placeholder Icon */}
//           </div>
//         </div>

//         {/* Search Input */}
//         <div className="search-container">
//           <div className="search-wrapper">
//             <Search size={18} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search or start new chat"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="search-input"
//             />
//           </div>
//         </div>

//         {/* Chat List (Shows search results or recent chats) */}
//         {searchResults.length > 0 ? (
//           <ul className="chat-list search-results">
//             {searchResults.map((u) => (
//               <li key={u.username} onClick={() => selectUserChat(u.username)} className="chat-list-item">
//                 <div className="avatar">{u.username?.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{u.username}</div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <ul className="chat-list">
//             {recentChats.map((chat) => (
//               <li
//                 key={chat.username}
//                 onClick={() => selectUserChat(chat.username)}
//                 className={`chat-list-item ${selectedUser === chat.username ? 'active' : ''}`}
//               >
//                 <div className="avatar">{chat.username?.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{chat.username}</div>
//                   <div className="chat-last-message">{chat.lastMessage || 'No messages yet'}</div> {/* Display last message */}
//                 </div>
//                 <div className="chat-meta">
//                   <span className="chat-time">{formatTime(chat.timestamp)}</span>
//                   {/* Optional: Unread count display */}
//                   {/* {chat.unreadCount > 0 && <span className="unread-count">{chat.unreadCount}</span>} */}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div> {/* End Sidebar */}

//       {/* Main Chat Area Section */}
//       <div className="chat-main">
//         {selectedUser ? (
//           // View when a chat is selected
//           <>
//             {/* Chat Header */}
//             <div className="chat-header">
//               {window.innerWidth < 768 && (
//                 <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
//               )}
//               <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
//               <div className="user-info">
//                 <h3>{selectedUser}</h3>
//                 <span className="user-status">Online</span> {/* TODO: Implement presence system */}
//               </div>
//               <div className="header-actions">
//                 {/* Call Button - Disabled during an active call */}
//                 <PhoneCall
//                   size={20}
//                   className={`call-icon ${isCallActive ? 'disabled' : ''}`}
//                   onClick={!isCallActive ? handleInitiateCall : undefined} // Only clickable when not in call
//                   title={isCallActive ? "Call in progress" : "Start voice call"}
//                 />
//                 <MoreVertical size={20} className="icon" /> {/* Placeholder */}
//               </div>
//             </div>

//             {/* Messages Container */}
//             <div className="messages-container">
//               {messages.length > 0 ? (
//                 <div className="messages-list">
//                   {messages.map((msg, idx) => {
//                     const isCurrentUser = msg.sender === user?.username;
//                     const messageDate = formatMessageDate(msg.timestamp);
//                     // Determine if the date header should be shown for this message
//                     const showDateHeader = idx === 0 || formatMessageDate(messages[idx - 1]?.timestamp) !== messageDate;

//                     return (
//                       <React.Fragment key={msg.id || idx}> {/* Use message ID if available, fallback to index */}
//                         {showDateHeader && (
//                           <div className="date-separator"><span>{messageDate}</span></div>
//                         )}
//                         <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
//                           <div className="message-content">
//                             {msg.message || msg.content} {/* Handle potential variations in message field name */}
//                             <span className="message-time">{formatTime(msg.timestamp)}</span>
//                           </div>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}
//                   {/* Invisible div to target for scrolling */}
//                   <div ref={messagesEndRef} />
//                 </div>
//               ) : (
//                 <div className="empty-chat"><p>Start the conversation with {selectedUser}!</p></div>
//               )}
//             </div> {/* End Messages Container */}

//             {/* Message Input Area */}
//             <div className="message-input-container">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 // Send on Enter key press
//                 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), sendMessage()) : null}
//                 placeholder="Type a message..."
//                 className="message-input"
//                 disabled={isCallActive} // Optionally disable input during call
//               />
//               <button
//                 onClick={sendMessage}
//                 className="send-button"
//                 disabled={!message.trim() || isCallActive} // Disable if no message or during call
//               >
//                 <Send size={20} />
//               </button>
//             </div> {/* End Message Input Area */}

//             {/* --- Voice Call UI Overlay --- */}
//             {/* Conditionally render the call component when isCallActive is true */}
//             {isCallActive && selectedUser && user?.username && (
//               <div className="call-ui-overlay">
//                 <div className="call-box">
//                   {/* Ensure a stable key for the component instance */}
//                   <VoiceCallComponent
//                     key={`${user.username}-call-${selectedUser}`} // Unique key for this call pairing
//                     username={user.username} // Current user's username
//                     receiver={selectedUser} // The user being called
//                     onEndCall={handleEndCall} // Callback function when call ends
//                     isCaller={isMakingCall} // Boolean: true if we initiated, false if receiving
//                   />
//                   {/* Note: The "End Call" button is now managed *inside* VoiceCallComponent */}
//                 </div>
//               </div>
//             )}
//             {/* --- End Voice Call UI Overlay --- */}

//           </> // End selected chat view
//         ) : (
//           // View when no chat is selected
//           <div className="no-chat-selected">
//             <div className="welcome-message">
//               <h3>Welcome, {user?.username || 'Guest'}!</h3>
//               <p>Select a chat from the sidebar to start messaging or calling.</p>
//               {/* You could add an illustration or more info here */}
//             </div>
//           </div>
//         )} {/* End conditional rendering for selectedUser */}
//       </div> {/* End Main Chat Area */}
//     </div> // End Chat Container
//   );
// };

// export default Chat;

// import React, { useEffect, useState, useRef } from 'react';
// import { useAuth } from '../../assets/AuthContext'; // Assuming AuthContext provides { user: { username, accessToken } }
// import axios from 'axios';
// import { PhoneCall, Search, Send, ArrowLeft, MoreVertical, PhoneOff } from 'lucide-react';
// import './chat.css'; // Ensure this CSS file exists and is styled
// import VoiceCallComponent from '../VoiceCall/VoiceCallComponent'; // Import the call component

// const Chat = () => {
//   const { user } = useAuth(); // Get user info from context

//   // Component State
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null); // The user being chatted with/called
//   const [message, setMessage] = useState(''); // Current message input
//   const [messages, setMessages] = useState([]); // History/live messages for selectedUser
//   const [showSidebar, setShowSidebar] = useState(true); // For mobile responsiveness
//   const [recentChats, setRecentChats] = useState([]); // List of recent chat partners

//   // Refs
//   const chatSocketRef = useRef(null); // Ref for the chat WebSocket connection
//   const messagesEndRef = useRef(null); // Ref to scroll to the bottom of messages
//   const callSocketRef = useRef(null); // WebSocket for call signaling

//   // --- Voice Call State ---
//   const [isCallActive, setIsCallActive] = useState(false); // Is the call UI currently visible?
//   const [isMakingCall, setIsMakingCall] = useState(false); // Are *we* the one who initiated the call? (Determines isCaller prop)
//   const [incomingCall, setIncomingCall] = useState(null); // To store incoming call data
//   const [callStatus, setCallStatus] = useState('idle'); // 'idle', 'incoming', 'outgoing', 'active'
//   const peerConnectionRef = useRef(null); // For managing WebRTC peer connection
//   // Inside your React component where you handle the WebRTC connection
//   const [remoteStream, setRemoteStream] = useState(null);
//   const [peerConnection, setPeerConnection] = useState(null);
  




//   // --- Effects ---

//   // Auto-scroll messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Fetch recent chats when user logs in
//   useEffect(() => {
//     if (user && user.accessToken) {
//       fetchRecentChats();
//     } else {
//       setRecentChats([]); // Clear if no user
//     }
//   }, [user]); // Dependency: user object

//   // Fetch chat history when a user is selected
//   useEffect(() => {
//     if (selectedUser && user?.accessToken) {
//       fetchChatHistory(selectedUser);
//     } else {
//        setMessages([]); // Clear messages if no user selected or no token
//     }
//     // No need to include fetchChatHistory in dependencies if defined outside/stable
//   }, [selectedUser, user?.accessToken]); // Dependency: selectedUser, user token

//   // Handle Chat WebSocket connection
//   useEffect(() => {
//     // Ensure we have a logged-in user and a selected chat partner
//     if (!user?.username || !selectedUser) {
//       // Close existing connection if user logs out or deselects chat
//       if (chatSocketRef.current) {
//         console.log("Closing chat WebSocket (no user/selection).");
//         chatSocketRef.current.close();
//         chatSocketRef.current = null;
//       }
//       return; // Exit effect
//     }

//     // Close previous connection if selectedUser changes
//     if (chatSocketRef.current) {
//       console.log(`Chat user changed to ${selectedUser}, closing previous chat WebSocket.`);
//       chatSocketRef.current.close();
//     }

//     // Establish WebSocket connection to the user's own endpoint
//     // Assumes backend consumer routes based on sender/receiver in message payload
//     const wsUrl = `ws://127.0.0.1:8000/ws/chat/${user.username}/`;
//     console.log(`Establishing chat WebSocket connection: ${wsUrl}`);
//     const ws = new WebSocket(wsUrl);
//     chatSocketRef.current = ws;

//     ws.onopen = () => {
//       console.log(`Chat WebSocket connected for ${user.username}`);
//       // Optional: Send a message indicating user is online or ready
//     };

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("Chat message received:", data);

//         // Check if the message belongs to the currently active chat window
//         const isCurrentChat = (data.sender === user.username && data.receiver === selectedUser) ||
//                               (data.sender === selectedUser && data.receiver === user.username);

//         if (isCurrentChat) {
//           // Add message to the current chat window
//           // Ensure message object has a unique key if rendering directly from this data later
//           setMessages((prevMessages) => [...prevMessages, data]);
//         } else {
//           console.log("Received message for a different chat.");
//           // TODO: Implement notification/unread count logic for other chats
//           // You might need to update the `recentChats` state here
//         }
//       } catch (error) {
//         console.error("Failed to parse incoming chat message:", error);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error("Chat WebSocket error:", error);
//       // Optional: Add user feedback about connection issues
//     };

//     ws.onclose = (event) => {
//       console.log(`Chat WebSocket disconnected for ${user.username}. Code: ${event.code}, Reason: ${event.reason}`);
//       chatSocketRef.current = null; // Clear the ref
//       // Optional: Implement reconnection logic if needed
//     };

//     // Cleanup function: Close WebSocket when component unmounts or dependencies change
//     return () => {
//       if (ws && ws.readyState === WebSocket.OPEN) {
//         console.log(`Closing chat WebSocket for ${user.username}.`);
//         ws.close();
//       }
//       chatSocketRef.current = null;
//     };
//     // Dependencies: Reconnect if user logs in/out or selectedUser changes
//   }, [user, selectedUser]);

//   // Persistent Call WebSocket Connection (for receiving calls anytime)
//   useEffect(() => {
//     if (!user?.username) return;

//     const callWs = new WebSocket(`ws://127.0.0.1:8000/ws/call/${user.username}/`);
//     callSocketRef.current = callWs;

//     callWs.onopen = () => {
//       console.log("Call WebSocket connected for", user.username);
//     };

//     callWs.onmessage = (event) => {
//       const data = JSON.parse(event.data);
//       console.log("Call signaling message received:", data);

//       if (data.type === 'offer') {
//         // Someone is calling us (we received an offer before any call context)
//         const fromUser = data.sender;
//         console.log(`Incoming call from ${fromUser}`);

//         // Store the call offer and update UI to show incoming call notification
//         setIncomingCall({
//           from: fromUser, 
//           offer: data.payload
//         });
//         setCallStatus('incoming');

//         // If already in another call, auto-reject this one
//         if (isCallActive) {
//           console.log(`Auto-rejecting call from ${fromUser} as already in a call`);
//           sendCallSignal('call_rejected', { reason: 'busy' }, fromUser);
//         }
//       }

//       if (data.type === 'call_cancelled') {
//         console.log("Call was cancelled by caller.");
//         // Only update if it matches our incoming call
//         if (incomingCall && data.sender === incomingCall.from) {
//           setIncomingCall(null);
//           setCallStatus('idle');
//         }
//       }
      
//       if (data.type === 'call_rejected') {
//         console.log("Call was rejected by receiver.");
//         if (isMakingCall && selectedUser === data.sender) {
//           setIsCallActive(false);
//           setIsMakingCall(false);
//           setCallStatus('idle');
//           alert(`${selectedUser} rejected the call.`);
//         }
//       }

//       if (data.type === 'hangup') {
//         console.log("Call ended by peer.");
//         if (isCallActive) {
//           setIsCallActive(false);
//           setIsMakingCall(false);
//           setCallStatus('idle');
//         }
//       }
//       if (data.type === 'answer') {
//         console.log("Received answer:", data.payload);
//         if (peerConnectionRef.current) {
//           peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.payload));
//         }
//       }
      
//       if (data.type === 'ice_candidate') {
//         console.log("Received ICE candidate:", data.payload);
//         if (peerConnectionRef.current) {
//           peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.payload));
//         }
//       }
      
//     };

//     callWs.onerror = (err) => {
//       console.error("Call WebSocket error:", err);
//     };

//     callWs.onclose = () => {
//       console.log("Call WebSocket closed.");
//     };

//     // Cleanup
//     return () => {
//       if (callWs.readyState === WebSocket.OPEN) callWs.close();
//       callSocketRef.current = null;
//     };
//   }, [user?.username, incomingCall, isCallActive, selectedUser, isMakingCall]);

//   // Handle User Search (debounced)
//   useEffect(() => {
//     const fetchUsers = async () => {
//       if (!searchQuery.trim() || !user?.accessToken) {
//         setSearchResults([]);
//         return;
//       }
//       try {
//         const res = await axios.get(`http://127.0.0.1:8000/chat/search-users/?q=${searchQuery}`, {
//           headers: { Authorization: `Bearer ${user.accessToken}` },
//         });
//         setSearchResults(res.data);
//       } catch (error) {
//         console.error('Search error:', error);
//         setSearchResults([]); // Clear results on error
//       }
//     };

//     // Debounce API call
//     const delayDebounce = setTimeout(fetchUsers, 300);
//     return () => clearTimeout(delayDebounce); // Cleanup timeout

//   }, [searchQuery, user?.accessToken]); // Dependencies: search query, user token

//   // --- Functions ---

//   // Send signal through call WebSocket
//   const sendCallSignal = (type, payload, receiver) => {
//     const targetReceiver = receiver || selectedUser;
    
//     if (!callSocketRef.current || callSocketRef.current.readyState !== WebSocket.OPEN) {
//       console.error("Call WebSocket not open. Cannot send signal.");
//       return false;
//     }

//     if (!targetReceiver) {
//       console.error("No receiver specified for call signal.");
//       return false;
//     }

//     try {
//       callSocketRef.current.send(JSON.stringify({
//         type: type,
//         receiver: targetReceiver,
//         payload: payload
//       }));
//       console.log(`Sent ${type} signal to ${targetReceiver}`);
//       return true;
//     } catch (error) {
//       console.error("Error sending call signal:", error);
//       return false;
//     }
//   };
  
//   // Fetch recent chat partners
//   const fetchRecentChats = async () => {
//     if (!user?.accessToken) return;
//     try {
//       console.log("Fetching recent chats...");
//       const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       setRecentChats(res.data);
//     } catch (error) {
//       console.error('Error fetching recent chats:', error);
//       setRecentChats([]); // Clear on error
//     }
//   };

//   // Fetch message history for the selected user
//   const fetchChatHistory = async (username) => {
//      if (!username || !user?.accessToken) {
//          console.warn("fetchChatHistory skipped: no username or access token.");
//          setMessages([]); // Ensure messages are cleared
//          return;
//      }
//     console.log(`Workspaceing chat history with ${username}...`);
//     try {
//       const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       console.log(`History received for ${username}:`, res.data.length, "messages");
//       setMessages(res.data); // Update messages state
//     } catch (error) {
//       console.error(`Error fetching chat history for ${username}:`, error);
//       setMessages([]); // Clear messages on error
//     }
//   };

//   // Send a chat message via WebSocket
//   const sendMessage = () => {
//     const trimmedMessage = message.trim();
//     if (!trimmedMessage || !selectedUser || !user?.username) return;

//     if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
//       const messageData = {
//         sender: user.username,
//         receiver: selectedUser,
//         message: trimmedMessage,
//         // Add timestamp client-side for optimistic update if needed
//         // timestamp: new Date().toISOString()
//       };
//       console.log("Sending chat message:", messageData);
//       try {
//         chatSocketRef.current.send(JSON.stringify(messageData));
//         // Optimistic UI update (optional but improves perceived speed)
//         // setMessages((prev) => [...prev, { ...messageData, timestamp: new Date().toISOString() }]);
//         setMessage(''); // Clear input field
//       } catch (error) {
//           console.error("Error sending message via WebSocket:", error);
//           alert("Failed to send message. Connection issue?");
//       }
//     } else {
//       console.error('Chat WebSocket is not open. Cannot send message.');
//       alert('Cannot send message. Connection lost. Please refresh or try again.');
//     }
//   };

//   // --- Call Handling Functions ---

//   // Initiate the call process
//   const handleInitiateCall = () => {
//     if (!selectedUser) {
//       alert('Please select a user to call.');
//       return;
//     }
//     if (isCallActive || callStatus !== 'idle') {
//       alert('A call is already in progress or pending.');
//       return;
//     }
    
//     console.log(`Initiating call with ${selectedUser}...`);
//     setCallStatus('outgoing');
//     setIsMakingCall(true); // Set flag indicating *we* are the caller
//     setIsCallActive(true); // Set flag to show the VoiceCallComponent UI
//     // VoiceCallComponent will now mount and handle the WebRTC/Signaling process
//   };

//   // Accept an incoming call
//   const handleAcceptCall = () => {
//     if (!incomingCall) return;
  
//     console.log(`Accepting call from ${incomingCall.from}`);
    
//     // Set selected user to the caller (if not already selected)
//     setSelectedUser(incomingCall.from);
  
//     // Activate call UI with the stored offer
//     setIsMakingCall(false); // We're the receiver
//     setIsCallActive(true);  // Show call UI
//     setCallStatus('active');
  
//     // Assuming you have WebRTC signaling setup for 'offer' and 'answer' exchanges:
//     if (incomingCall.offer) {
//       // Process the offer (this should be handled in your WebRTC setup)
//       acceptIncomingCall(incomingCall.offer); // Accept the call via WebRTC signaling
  
//       // Send an answer back to the caller through your signaling channel
//       sendCallSignal('call_answered', { answer: 'some_answer_data' }, incomingCall.from);
//     }
  
//     // Clear the incoming call data
//     setIncomingCall(null);
//   };
//   const acceptIncomingCall = async (offer) => {
//     // Create a new peer connection for WebRTC
//     const peerConnection = new RTCPeerConnection();
  
//     // Handle incoming stream (audio/video)
//     peerConnection.ontrack = (event) => {
//       // Set the remote media stream to the UI (video/audio element)
//       const remoteStream = event.streams[0];
//       setRemoteStream(remoteStream); // This state will be used to show the remote stream in the UI
//     };
  
//     // Set up the offer that we received from the caller
//     await peerConnection.setRemoteDescription(offer);
  
//     // Get the local media stream (audio/video) from the user's device
//     const localStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
  
//     // Add the local stream to the peer connection
//     localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));
  
//     // Create an answer for the call
//     const answer = await peerConnection.createAnswer();
//     await peerConnection.setLocalDescription(answer);
  
//     // Send the answer back to the caller (via your signaling server, e.g., WebSockets)
//     sendCallSignal('call_answered', { answer }, incomingCall.from);
  
//     // Optionally store the peer connection in the state for future handling (e.g., for ending the call)
//     setPeerConnection(peerConnection);  // Store it for later reference when needed
//   };
  
  

//   // Reject an incoming call
//   const handleRejectCall = () => {
//     if (!incomingCall) return;
    
//     console.log(`Rejecting call from ${incomingCall.from}`);
    
//     // Send rejection signal
//     sendCallSignal('call_rejected', { reason: 'declined' }, incomingCall.from);
    
//     // Clear incoming call state
//     setIncomingCall(null);
//     setCallStatus('idle');
//   };

//   // Cancel an outgoing call
//   const handleCancelCall = () => {
//     if (callStatus !== 'outgoing' || !selectedUser) return;
    
//     console.log(`Cancelling outgoing call to ${selectedUser}`);
    
//     // Send cancellation signal
//     sendCallSignal('call_cancelled', {}, selectedUser);
    
//     // Reset call state
//     setIsCallActive(false);
//     setIsMakingCall(false);
//     setCallStatus('idle');
//   };

//   // Callback passed to VoiceCallComponent, triggered when call ends
//   const handleEndCall = () => {
//     console.log('Chat.jsx: handleEndCall triggered by VoiceCallComponent. Resetting state.');
//     setIsCallActive(false); // Hide the call UI
//     setIsMakingCall(false); // Reset the caller flag
//     setCallStatus('idle');  // Reset status
//     setIncomingCall(null);  // Clear any incoming call data
//   };

//   // --- UI Handlers & Formatters ---

//   // Toggle sidebar visibility (for mobile)
//   const toggleSidebar = () => {
//     setShowSidebar(!showSidebar);
//   };

//   // Handle selecting a user from the list
//   const selectUserChat = (username) => {
//      if (username === selectedUser) return; // Avoid re-selecting the same user

//     console.log("Selected chat:", username);
//     setSelectedUser(username); // Set the active chat partner
//     setMessages([]); // Clear messages from the previous chat immediately
//     setSearchQuery(''); // Clear search input
//     setSearchResults([]); // Clear search results list
//     // Hide sidebar on mobile after selection
//     if (window.innerWidth < 768) {
//       setShowSidebar(false);
//     }
//     // Chat history fetching is handled by the useEffect watching selectedUser
//   };

//   // Format timestamp for display (e.g., 10:30 AM)
//   const formatTime = (timestamp) => {
//     if (!timestamp) return '';
//     try {
//       const date = new Date(timestamp);
//       // Adjust options as needed for desired format
//       return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
//     } catch (e) {
//         console.error("Error formatting time:", e);
//         return "Invalid time";
//     }
//   };

//   // Format date for message grouping headers (e.g., Today, Yesterday, MM/DD/YYYY)
//   const formatMessageDate = (timestamp) => {
//      if (!timestamp) return '';
//      try {
//         const date = new Date(timestamp);
//         const today = new Date();
//         const yesterday = new Date();
//         yesterday.setDate(today.getDate() - 1);

//         if (date.toDateString() === today.toDateString()) return 'Today';
//         if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
//         // Adjust options for desired date format
//         return date.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
//     } catch(e) {
//         console.error("Error formatting message date:", e);
//         return "Invalid date";
//     }
//   };
  

//   return (
//     <div className="chat-container">
//       {/* Incoming Call Notification (overlay) */}
//       {incomingCall && callStatus === 'incoming' && (
//         <div className="incoming-call-overlay">
//           <div className="incoming-call-box">
//             <h3>Incoming Call</h3>
//             <p>{incomingCall.from} is calling you</p>
//             <div className="call-actions">
//               <button className="accept-call-btn" onClick={handleAcceptCall}>
//                 <PhoneCall size={20} /> Accept
//               </button>
//               <button className="reject-call-btn" onClick={handleRejectCall}>
//                 <PhoneOff size={20} /> Reject
//               </button>
//             </div>
//           </div>
//         </div>
//       )}

//       {/* Sidebar Section */}
//       <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
//         <div className="sidebar-header">
//           <h2>Chats</h2>
//           <div className="header-icons">
//             <MoreVertical size={20} className="icon" /> {/* Placeholder Icon */}
//           </div>
//         </div>

//         {/* Search Input */}
//         <div className="search-container">
//           <div className="search-wrapper">
//             <Search size={18} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search or start new chat"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="search-input"
//             />
//           </div>
//         </div>

//         {/* Chat List (Shows search results or recent chats) */}
//         {searchResults.length > 0 ? (
//           <ul className="chat-list search-results">
//             {searchResults.map((u) => (
//               <li key={u.username} onClick={() => selectUserChat(u.username)} className="chat-list-item">
//                 <div className="avatar">{u.username?.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{u.username}</div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <ul className="chat-list">
//             {recentChats.map((chat) => (
//               <li
//                 key={chat.username}
//                 onClick={() => selectUserChat(chat.username)}
//                 className={`chat-list-item ${selectedUser === chat.username ? 'active' : ''}`}
//               >
//                 <div className="avatar">{chat.username?.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{chat.username}</div>
//                   <div className="chat-last-message">{chat.lastMessage || 'No messages yet'}</div> {/* Display last message */}
//                 </div>
//                 <div className="chat-meta">
//                   <span className="chat-time">{formatTime(chat.timestamp)}</span>
//                   {/* Optional: Unread count display */}
//                   {/* {chat.unreadCount > 0 && <span className="unread-count">{chat.unreadCount}</span>} */}
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div> {/* End Sidebar */}

//       {/* Main Chat Area Section */}
//       <div className="chat-main">
//         {selectedUser ? (
//           // View when a chat is selected
//           <>
//             {/* Chat Header */}
//             <div className="chat-header">
//               {window.innerWidth < 768 && (
//                 <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
//               )}
//               <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
//               <div className="user-info">
//                 <h3>{selectedUser}</h3>
//                 <span className="user-status">Online</span> {/* TODO: Implement presence system */}
//               </div>
//               <div className="header-actions">
//                 {/* Call Button - Shows different state based on call status */}
//                 {callStatus === 'idle' ? (
//                   <PhoneCall
//                     size={20}
//                     className="call-icon"
//                     onClick={handleInitiateCall}
//                     title="Start voice call"
//                   />
//                 ) : callStatus === 'outgoing' ? (
//                   <PhoneOff
//                     size={20}
//                     className="call-icon cancel"
//                     onClick={handleCancelCall}
//                     title="Cancel call"
//                   />
//                 ) : (
//                   <PhoneCall
//                     size={20}
//                     className="call-icon disabled"
//                     title="Call in progress"
//                   />
//                 )}
//                 <MoreVertical size={20} className="icon" /> {/* Placeholder */}
//               </div>
//             </div>

//             {/* Messages Container */}
//             <div className="messages-container">
//               {messages.length > 0 ? (
//                 <div className="messages-list">
//                   {messages.map((msg, idx) => {
//                     const isCurrentUser = msg.sender === user?.username;
//                     const messageDate = formatMessageDate(msg.timestamp);
//                     // Determine if the date header should be shown for this message
//                     const showDateHeader = idx === 0 || formatMessageDate(messages[idx - 1]?.timestamp) !== messageDate;

//                     return (
//                       <React.Fragment key={msg.id || idx}> {/* Use message ID if available, fallback to index */}
//                         {showDateHeader && (
//                           <div className="date-separator"><span>{messageDate}</span></div>
//                         )}
//                         <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
//                           <div className="message-content">
//                             {msg.message || msg.content} {/* Handle potential variations in message field name */}
//                             <span className="message-time">{formatTime(msg.timestamp)}</span>
//                           </div>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}
//                   {/* Invisible div to target for scrolling */}
//                   <div ref={messagesEndRef} />
//                 </div>
//               ) : (
//                 <div className="empty-chat"><p>Start the conversation with {selectedUser}!</p></div>
//               )}
//             </div> {/* End Messages Container */}

//             {/* Message Input Area */}
//             <div className="message-input-container">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 // Send on Enter key press
//                 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), sendMessage()) : null}
//                 placeholder="Type a message..."
//                 className="message-input"
//                 disabled={isCallActive} // Optionally disable input during call
//               />
//               <button
//                 onClick={sendMessage}
//                 className="send-button"
//                 disabled={!message.trim() || isCallActive} // Disable if no message or during call
//               >
//                 <Send size={20} />
//               </button>
//             </div> {/* End Message Input Area */}

//             {/* --- Voice Call UI Overlay --- */}
//             {/* Conditionally render the call component when isCallActive is true */}
//             {isCallActive && selectedUser && user?.username && (
//               <div className="call-ui-overlay">
//                 <div className="call-box">
//                   {/* Ensure a stable key for the component instance */}
//                   <VoiceCallComponent
//                     key={`${user.username}-call-${selectedUser}`} // Unique key for this call pairing
//                     username={user.username} // Current user's username
//                     receiver={selectedUser} // The user being called
//                     onEndCall={handleEndCall} // Callback function when call ends
//                     isCaller={isMakingCall} // Boolean: true if we initiated, false if receiving
//                     initialOffer={!isMakingCall && incomingCall?.offer} // Pass the offer if we're receiving a call
//                   />
//                   {/* Note: The "End Call" button is now managed *inside* VoiceCallComponent */}
//                 </div>
//               </div>
//             )}
//             {/* --- End Voice Call UI Overlay --- */}

//           </> // End selected chat view
//         ) : (
//           // View when no chat is selected
//           <div className="no-chat-selected">
//             <div className="welcome-message">
//               <h3>Welcome, {user?.username || 'Guest'}!</h3>
//               <p>Select a chat from the sidebar to start messaging or calling.</p>
//               {/* You could add an illustration or more info here */}
//             </div>
//           </div>
//         )} {/* End conditional rendering for selectedUser */}
//       </div> {/* End Main Chat Area */}
//     </div> // End Chat Container
//   );
// };

// export default Chat;

// import React, { useEffect, useState, useRef } from 'react';
// import { useAuth } from '../../assets/AuthContext'; // Assuming AuthContext provides { user: { username, accessToken } }
// import axios from 'axios';
// import { PhoneCall, Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
// import './chat.css'; // Ensure this CSS file exists and is styled
// import VoiceCallComponent from '../VoiceCall/VoiceCallComponent'; // Import the call component
// const Chat = () => {
//   const { user } = useAuth(); // Get user info from context
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null); // The user being chatted with/called
//   const [message, setMessage] = useState(''); // Current message input
//   const [messages, setMessages] = useState([]); // History/live messages for selectedUser
//   const [showSidebar, setShowSidebar] = useState(true); // For mobile responsiveness
//   const [recentChats, setRecentChats] = useState([]); // List of recent chat partners
//   const chatSocketRef = useRef(null); // Ref for the chat WebSocket connection
//   const callSocketRef = useRef(null); // Ref for the call signaling WebSocket connection
//   const messagesEndRef = useRef(null); // Ref to scroll to the bottom of messages
//   const [isCallActive, setIsCallActive] = useState(false); // Is the call UI currently visible?
//   const [isMakingCall, setIsMakingCall] = useState(false); // Are *we* the one who initiated the call?
//   const [incomingCall, setIncomingCall] = useState(null); // Store incoming call information
//   // Auto-scroll messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);
//   // Fetch recent chats when user logs in
//   useEffect(() => {
//     if (user && user.accessToken) {
//       fetchRecentChats();
//     } else {
//       setRecentChats([]); // Clear if no user
//     }
//   }, [user]); // Dependency: user object
//   // Fetch chat history when a user is selected
//   useEffect(() => {
//     if (selectedUser && user?.accessToken) {
//       fetchChatHistory(selectedUser);
//     } else {
//        setMessages([]); // Clear messages if no user selected or no token
//     }
//     // No need to include fetchChatHistory in dependencies if defined outside/stable
//   }, [selectedUser, user?.accessToken]); // Dependency: selectedUser, user token
//   // Handle Chat WebSocket connection
//   useEffect(() => {
//     // Ensure we have a logged-in user and a selected chat partner
//     if (!user?.username || !selectedUser) {
//       // Close existing connection if user logs out or deselects chat
//       if (chatSocketRef.current) {
//         console.log("Closing chat WebSocket (no user/selection).");
//         chatSocketRef.current.close();
//         chatSocketRef.current = null;
//       }
//       return; // Exit effect
//     }

//     // Close previous connection if selectedUser changes
//     if (chatSocketRef.current) {
//       console.log(`Chat user changed to ${selectedUser}, closing previous chat WebSocket.`);
//       chatSocketRef.current.close();
//     }

//     // Establish WebSocket connection to the user's own endpoint
//     // Assumes backend consumer routes based on sender/receiver in message payload
//     const wsUrl = `ws://127.0.0.1:8000/ws/chat/${user.username}/`;
//     console.log(`Establishing chat WebSocket connection: ${wsUrl}`);
//     const ws = new WebSocket(wsUrl);
//     chatSocketRef.current = ws;

//     ws.onopen = () => {
//       console.log(`Chat WebSocket connected for ${user.username}`);
//       // Optional: Send a message indicating user is online or ready
//     };

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("Chat message received:", data);

//         // Check if the message belongs to the currently active chat window
//         const isCurrentChat = (data.sender === user.username && data.receiver === selectedUser) ||
//                               (data.sender === selectedUser && data.receiver === user.username);

//         if (isCurrentChat) {
//           // Add message to the current chat window
//           // Ensure message object has a unique key if rendering directly from this data later
//           setMessages((prevMessages) => [...prevMessages, data]);
//         } else {
//           console.log("Received message for a different chat.");
//           // TODO: Implement notification/unread count logic for other chats
//           // You might need to update the `recentChats` state here
//         }
//       } catch (error) {
//         console.error("Failed to parse incoming chat message:", error);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error("Chat WebSocket error:", error);
//       // Optional: Add user feedback about connection issues
//     };

//     ws.onclose = (event) => {
//       console.log(`Chat WebSocket disconnected for ${user.username}. Code: ${event.code}, Reason: ${event.reason}`);
//       chatSocketRef.current = null; // Clear the ref
//       // Optional: Implement reconnection logic if needed
//     };

//     // Cleanup function: Close WebSocket when component unmounts or dependencies change
//     return () => {
//       if (ws && ws.readyState === WebSocket.OPEN) {
//         console.log(`Closing chat WebSocket for ${user.username}.`);
//         ws.close();
//       }
//       chatSocketRef.current = null;
//     };
//     // Dependencies: Reconnect if user logs in/out or selectedUser changes
//   }, [user, selectedUser]);

//   // Handle Call WebSocket connection for signaling
//   useEffect(() => {
//     // Only establish call socket if we have a logged-in user
//     if (!user?.username) {
//       // Close existing connection if user logs out
//       if (callSocketRef.current) {
//         console.log("Closing call WebSocket (no user).");
//         callSocketRef.current.close();
//         callSocketRef.current = null;
//       }
//       return; // Exit effect
//     }

//     // Establish WebSocket connection for call signaling
//     const wsCallUrl = `ws://127.0.0.1:8000/ws/call/${user.username}/`;
//     console.log(`Establishing call signaling WebSocket connection: ${wsCallUrl}`);
//     const wsCall = new WebSocket(wsCallUrl);
//     callSocketRef.current = wsCall;

//     wsCall.onopen = () => {
//       console.log(`Call signaling WebSocket connected for ${user.username}`);
//     };

//     wsCall.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("Call signaling message received:", data);

//         // Handle different types of call signals
//         switch(data.type) {
//           case 'call-request':
//             // Handle incoming call request
//             handleIncomingCall(data);
//             break;
//           default:
//             // Other signal types (offer, answer, ice, etc.) are handled directly by VoiceCallComponent
//             // They will be passed on when the component is active
//             break;
//         }
//       } catch (error) {
//         console.error("Failed to parse incoming call signaling message:", error);
//       }
//     };
//     wsCall.onerror = (error) => {
//       console.error("Call signaling WebSocket error:", error);
//     };
//     wsCall.onclose = (event) => {
//       console.log(`Call signaling WebSocket disconnected for ${user.username}. Code: ${event.code}, Reason: ${event.reason}`);
//       callSocketRef.current = null; // Clear the ref
//     };
//     return () => {
//       if (wsCall && wsCall.readyState === WebSocket.OPEN) {
//         console.log(`Closing call signaling WebSocket for ${user.username}.`);
//         wsCall.close();
//       }
//       callSocketRef.current = null;
//     };
//   }, [user?.username]); // Dependency: user.username only

//   // Handle User Search (debounced)
//   useEffect(() => {
//     const fetchUsers = async () => {
//       if (!searchQuery.trim() || !user?.accessToken) {
//         setSearchResults([]);
//         return;
//       }
//       try {
//         const res = await axios.get(`http://127.0.0.1:8000/chat/search-users/?q=${searchQuery}`, {
//           headers: { Authorization: `Bearer ${user.accessToken}` },
//         });
//         setSearchResults(res.data);
//       } catch (error) {
//         console.error('Search error:', error);
//         setSearchResults([]); // Clear results on error
//       }
//     };
//     // Debounce API call
//     const delayDebounce = setTimeout(fetchUsers, 300);
//     return () => clearTimeout(delayDebounce); // Cleanup timeout

//   }, [searchQuery, user?.accessToken]); // Dependencies: search query, user token

//   // --- Functions ---

//   // Fetch recent chat partners
//   const fetchRecentChats = async () => {
//     if (!user?.accessToken) return;
//     try {
//       console.log("Fetching recent chats...");
//       const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       setRecentChats(res.data);
//     } catch (error) {
//       console.error('Error fetching recent chats:', error);
//       setRecentChats([]); // Clear on error
//     }
//   };

//   // Fetch message history for the selected user
//   const fetchChatHistory = async (username) => {
//      if (!username || !user?.accessToken) {
//          console.warn("fetchChatHistory skipped: no username or access token.");
//          setMessages([]); // Ensure messages are cleared
//          return;
//      }
//     console.log(`Fetching chat history with ${username}...`);
//     try {
//       const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       console.log(`History received for ${username}:`, res.data.length, "messages");
//       setMessages(res.data); // Update messages state
//     } catch (error) {
//       console.error(`Error fetching chat history for ${username}:`, error);
//       setMessages([]); // Clear messages on error
//     }
//   };
//   // Send a chat message via WebSocket
//   const sendMessage = () => {
//     const trimmedMessage = message.trim();
//     if (!trimmedMessage || !selectedUser || !user?.username) return;

//     if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
//       const messageData = {
//         sender: user.username,
//         receiver: selectedUser,
//         message: trimmedMessage,
//         // Add timestamp client-side for optimistic update if needed
//         // timestamp: new Date().toISOString()
//       };
//       console.log("Sending chat message:", messageData);
//       try {
//         chatSocketRef.current.send(JSON.stringify(messageData));
//         // Optimistic UI update (optional but improves perceived speed)
//         // setMessages((prev) => [...prev, { ...messageData, timestamp: new Date().toISOString() }]);
//         setMessage(''); // Clear input field
//       } catch (error) {
//           console.error("Error sending message via WebSocket:", error);
//           alert("Failed to send message. Connection issue?");
//       }
//     } else {
//       console.error('Chat WebSocket is not open. Cannot send message.');
//       alert('Cannot send message. Connection lost. Please refresh or try again.');
//     }
//   };
//   // --- Call Handling Functions ---
//   // Handle incoming call
//   const handleIncomingCall = (data) => {
//     if (isCallActive) {
//       // We're already in a call, send a busy signal back
//       sendCallSignal(data.sender, 'call-busy', { reason: 'User is already in another call' });
//       return;
//     }

//     console.log(`Incoming call from ${data.sender}`);
//     // Store the incoming call details
//     setIncomingCall({
//       from: data.sender,
//       timestamp: new Date(),
//     });

//     // Automatically select the user in the chat if not already selected
//     if (selectedUser !== data.sender) {
//       selectUserChat(data.sender);
//     }

//     // Show the call interface with incoming call state
//     setIsCallActive(true);
//     setIsMakingCall(false); // We're the receiver, not the caller
//   };
//   // Initiate the call process
//   const handleInitiateCall = () => {
//     if (!selectedUser) {
//       alert('Please select a user to call.');
//       return;
//     }
//     if (isCallActive) {
//       // Should ideally not happen due to button disabling, but good failsafe
//       alert('A call is already in progress.');
//       return;
//     }
//     console.log(`Initiating call with ${selectedUser}. Setting call state...`);
//     // Send call request signal
//     sendCallSignal(selectedUser, 'call-request', { caller: user.username });
    
//     setIsMakingCall(true); // Set flag indicating *we* are the caller
//     setIsCallActive(true); // Set flag to show the VoiceCallComponent UI
//   };
//   const sendCallSignal = (receiver, type, payload) => {
//     if (callSocketRef.current && callSocketRef.current.readyState === WebSocket.OPEN) {
//       const signalData = {
//         receiver: receiver,
//         type: type,
//         payload: payload
//       };
//       console.log(`Sending call signal (${type}) to ${receiver}:`, signalData);
//       try {
//         callSocketRef.current.send(JSON.stringify(signalData));
//       } catch (error) {
//         console.error("Error sending call signal via WebSocket:", error);
//         alert("Failed to send call signal. Connection issue?");
//       }
//     } else {
//       console.error('Call WebSocket is not open. Cannot send call signal.');
//       alert('Cannot initiate call. Connection lost. Please refresh or try again.');
//     }
//   };
//   const handleEndCall = () => {
//     console.log('Chat.jsx: handleEndCall triggered by VoiceCallComponent. Resetting state.');
//     setIsCallActive(false); // Hide the call UI
//     setIsMakingCall(false); // Reset the caller flag
//     setIncomingCall(null); // Clear any incoming call state
//   };
//   const toggleSidebar = () => {
//     setShowSidebar(!showSidebar);
//   };
//   const selectUserChat = (username) => {
//      if (username === selectedUser) return; // Avoid re-selecting the same user

//     console.log("Selected chat:", username);
//     setSelectedUser(username); // Set the active chat partner
//     setMessages([]); // Clear messages from the previous chat immediately
//     setSearchQuery(''); // Clear search input
//     setSearchResults([]); // Clear search results list
//     if (window.innerWidth < 768) {
//       setShowSidebar(false);
//     }
//   };
//   const formatTime = (timestamp) => {
//     if (!timestamp) return '';
//     try {
//       const date = new Date(timestamp);
//       // Adjust options as needed for desired format
//       return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
//     } catch (e) {
//         console.error("Error formatting time:", e);
//         return "Invalid time";
//     }
//   };
//   const formatMessageDate = (timestamp) => {
//      if (!timestamp) return '';
//      try {
//         const date = new Date(timestamp);
//         const today = new Date();
//         const yesterday = new Date();
//         yesterday.setDate(today.getDate() - 1);

//         if (date.toDateString() === today.toDateString()) return 'Today';
//         if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
//         // Adjust options for desired date format
//         return date.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
//     } catch(e) {
//         console.error("Error formatting message date:", e);
//         return "Invalid date";
//     }
//   };
//   return (
//     <div className="chat-container">
//       {/* Sidebar Section */}
//       <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
//         <div className="sidebar-header">
//           <h2>Chats</h2>
//           <div className="header-icons">
//             <MoreVertical size={20} className="icon" /> {/* Placeholder Icon */}
//           </div>
//         </div>
//         <div className="search-container">
//           <div className="search-wrapper">
//             <Search size={18} className="search-icon" />
//             <input
//               type="text"
//               placeholder="Search or start new chat"
//               value={searchQuery}
//               onChange={(e) => setSearchQuery(e.target.value)}
//               className="search-input"
//             />
//           </div>
//         </div>
//         {searchResults.length > 0 ? (
//           <ul className="chat-list search-results">
//             {searchResults.map((u) => (
//               <li key={u.username} onClick={() => selectUserChat(u.username)} className="chat-list-item">
//                 <div className="avatar">{u.username?.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{u.username}</div>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         ) : (
//           <ul className="chat-list">
//             {recentChats.map((chat) => (
//               <li
//                 key={chat.username}
//                 onClick={() => selectUserChat(chat.username)}
//                 className={`chat-list-item ${selectedUser === chat.username ? 'active' : ''}`}
//               >
//                 <div className="avatar">{chat.username?.charAt(0).toUpperCase()}</div>
//                 <div className="chat-info">
//                   <div className="chat-name">{chat.username}</div>
//                   <div className="chat-last-message">{chat.lastMessage || 'No messages yet'}</div> {/* Display last message */}
//                 </div>
//                 <div className="chat-meta">
//                   <span className="chat-time">{formatTime(chat.timestamp)}</span>
//                 </div>
//               </li>
//             ))}
//           </ul>
//         )}
//       </div> {/* End Sidebar */}
//       <div className="chat-main">
//         {selectedUser ? (
//           <>
//             {/* Chat Header */}
//             <div className="chat-header">
//               {window.innerWidth < 768 && (
//                 <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
//               )}
//               <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
//               <div className="user-info">
//                 <h3>{selectedUser}</h3>
//                 <span className="user-status">Online</span> {/* TODO: Implement presence system */}
//               </div>
//               <div className="header-actions">
//                 <PhoneCall
//                   size={20}
//                   className={`call-icon ${isCallActive ? 'disabled' : ''}`}
//                   onClick={!isCallActive ? handleInitiateCall : undefined} // Only clickable when not in call
//                   title={isCallActive ? "Call in progress" : "Start voice call"}
//                 />
//                 <MoreVertical size={20} className="icon" /> {/* Placeholder */}
//               </div>
//             </div>
//             <div className="messages-container">
//               {messages.length > 0 ? (
//                 <div className="messages-list">
//                   {messages.map((msg, idx) => {
//                     const isCurrentUser = msg.sender === user?.username;
//                     const messageDate = formatMessageDate(msg.timestamp);
//                     // Determine if the date header should be shown for this message
//                     const showDateHeader = idx === 0 || formatMessageDate(messages[idx - 1]?.timestamp) !== messageDate;

//                     return (
//                       <React.Fragment key={msg.id || idx}> {/* Use message ID if available, fallback to index */}
//                         {showDateHeader && (
//                           <div className="date-separator"><span>{messageDate}</span></div>
//                         )}
//                         <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
//                           <div className="message-content">
//                             {msg.message || msg.content} {/* Handle potential variations in message field name */}
//                             <span className="message-time">{formatTime(msg.timestamp)}</span>
//                           </div>
//                         </div>
//                       </React.Fragment>
//                     );
//                   })}
//                   <div ref={messagesEndRef} />
//                 </div>
//               ) : (
//                 <div className="empty-chat"><p>Start the conversation with {selectedUser}!</p></div>
//               )}
//             </div> {/* End Messages Container */}
//             <div className="message-input-container">
//               <input
//                 type="text"
//                 value={message}
//                 onChange={(e) => setMessage(e.target.value)}
//                 onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), sendMessage()) : null}
//                 placeholder="Type a message..."
//                 className="message-input"
//                 disabled={isCallActive} // Optionally disable input during call
//               />
//               <button
//                 onClick={sendMessage}
//                 className="send-button"
//                 disabled={!message.trim() || isCallActive} // Disable if no message or during call
//               >
//                 <Send size={20} />
//               </button>
//             </div> {/* End Message Input Area */}
//           {isCallActive && selectedUser && user?.username && (
//               <div className="call-ui-overlay">
//                 <div className="call-box">
//                   {/* Pass the callSocket to the VoiceCallComponent */}
//                   <VoiceCallComponent
//                     key={`${user.username}-call-${selectedUser}`} // Unique key for this call pairing
//                     username={user.username} // Current user's username
//                     receiver={selectedUser} // The user being called
//                     onEndCall={handleEndCall} // Callback function when call ends
//                     isCaller={isMakingCall} // Boolean: true if we initiated, false if receiving
//                     callSocket={callSocketRef.current} // Pass the WebSocket connection
//                     incomingCall={incomingCall} // Pass incoming call details if available
//                   />
//                 </div>
//               </div>
//             )}
//           </> // End selected chat view
//         ) : (
//           <div className="no-chat-selected">
//             <div className="welcome-message">
//               <h3>Welcome, {user?.username || 'Guest'}!</h3>
//               <p>Select a chat from the sidebar to start messaging or calling.</p>
//             </div>
//           </div>
//         )} {/* End conditional rendering for selectedUser */}
//       </div> {/* End Main Chat Area */}
//     </div> // End Chat Container
//   );
// };
// export default Chat;

//claude pre
// import React, { useEffect, useState, useRef } from 'react';
// import { useAuth } from '../../assets/AuthContext'; // Assuming AuthContext provides { user: { username, accessToken } }
// import axios from 'axios';
// import { PhoneCall, Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
// import './chat.css'; // Ensure this CSS file exists and is styled
// import VoiceCallComponent from '../VoiceCall/VoiceCallComponentv2'; // Import the call component

// const Chat = () => {
//   const { user } = useAuth(); // Get user info from context
//   const [searchQuery, setSearchQuery] = useState('');
//   const [searchResults, setSearchResults] = useState([]);
//   const [selectedUser, setSelectedUser] = useState(null); // The user being chatted with/called
//   const [message, setMessage] = useState(''); // Current message input
//   const [messages, setMessages] = useState([]); // History/live messages for selectedUser
//   const [showSidebar, setShowSidebar] = useState(true); // For mobile responsiveness
//   const [recentChats, setRecentChats] = useState([]); // List of recent chat partners
//   const chatSocketRef = useRef(null); // Ref for the chat WebSocket connection
//   const messagesEndRef = useRef(null); // Ref to scroll to the bottom of messages
//   const [isCallActive, setIsCallActive] = useState(false); // Is the call UI currently visible?

//   // Auto-scroll messages
//   useEffect(() => {
//     messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
//   }, [messages]);

//   // Fetch recent chats when user logs in
//   useEffect(() => {
//     if (user && user.accessToken) {
//       fetchRecentChats();
//     } else {
//       setRecentChats([]); // Clear if no user
//     }
//   }, [user]); // Dependency: user object

//   // Fetch chat history when a user is selected
//   useEffect(() => {
//     if (selectedUser && user?.accessToken) {
//       fetchChatHistory(selectedUser);
//     } else {
//        setMessages([]); // Clear messages if no user selected or no token
//     }
//     // No need to include fetchChatHistory in dependencies if defined outside/stable
//   }, [selectedUser, user?.accessToken]); // Dependency: selectedUser, user token

//   // Handle Chat WebSocket connection
//   useEffect(() => {
//     // Ensure we have a logged-in user and a selected chat partner
//     if (!user?.username || !selectedUser) {
//       // Close existing connection if user logs out or deselects chat
//       if (chatSocketRef.current) {
//         console.log("Closing chat WebSocket (no user/selection).");
//         chatSocketRef.current.close();
//         chatSocketRef.current = null;
//       }
//       return; // Exit effect
//     }

//     // Close previous connection if selectedUser changes
//     if (chatSocketRef.current) {
//       console.log(`Chat user changed to ${selectedUser}, closing previous chat WebSocket.`);
//       chatSocketRef.current.close();
//     }

//     // Establish WebSocket connection to the user's own endpoint
//     // Assumes backend consumer routes based on sender/receiver in message payload
//     const wsUrl = `ws://127.0.0.1:8000/ws/chat/${user.username}/`;
//     console.log(`Establishing chat WebSocket connection: ${wsUrl}`);
//     const ws = new WebSocket(wsUrl);
//     chatSocketRef.current = ws;

//     ws.onopen = () => {
//       console.log(`Chat WebSocket connected for ${user.username}`);
//       // Optional: Send a message indicating user is online or ready
//     };

//     ws.onmessage = (event) => {
//       try {
//         const data = JSON.parse(event.data);
//         console.log("Chat message received:", data);

//         // Check if the message belongs to the currently active chat window
//         const isCurrentChat = (data.sender === user.username && data.receiver === selectedUser) ||
//                               (data.sender === selectedUser && data.receiver === user.username);

//         if (isCurrentChat) {
//           // Add message to the current chat window
//           // Ensure message object has a unique key if rendering directly from this data later
//           setMessages((prevMessages) => [...prevMessages, data]);
//         } else {
//           console.log("Received message for a different chat.");
//           // TODO: Implement notification/unread count logic for other chats
//           // You might need to update the `recentChats` state here
//         }
//       } catch (error) {
//         console.error("Failed to parse incoming chat message:", error);
//       }
//     };

//     ws.onerror = (error) => {
//       console.error("Chat WebSocket error:", error);
//       // Optional: Add user feedback about connection issues
//     };

//     ws.onclose = (event) => {
//       console.log(`Chat WebSocket disconnected for ${user.username}. Code: ${event.code}, Reason: ${event.reason}`);
//       chatSocketRef.current = null; // Clear the ref
//       // Optional: Implement reconnection logic if needed
//     };

//     // Cleanup function: Close WebSocket when component unmounts or dependencies change
//     return () => {
//       if (ws && ws.readyState === WebSocket.OPEN) {
//         console.log(`Closing chat WebSocket for ${user.username}.`);
//         ws.close();
//       }
//       chatSocketRef.current = null;
//     };
//     // Dependencies: Reconnect if user logs in/out or selectedUser changes
//   }, [user, selectedUser]);

//   // --- Functions ---

//   // Fetch recent chat partners
//   const fetchRecentChats = async () => {
//     if (!user?.accessToken) return;
//     try {
//       console.log("Fetching recent chats...");
//       const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       setRecentChats(res.data);
//     } catch (error) {
//       console.error('Error fetching recent chats:', error);
//       setRecentChats([]); // Clear on error
//     }
//   };

//   // Fetch message history for the selected user
//   const fetchChatHistory = async (username) => {
//      if (!username || !user?.accessToken) {
//          console.warn("fetchChatHistory skipped: no username or access token.");
//          setMessages([]); // Ensure messages are cleared
//          return;
//      }
//     console.log(`Fetching chat history with ${username}...`);
//     try {
//       const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
//         headers: { Authorization: `Bearer ${user.accessToken}` },
//       });
//       console.log(`History received for ${username}:`, res.data.length, "messages");
//       setMessages(res.data); // Update messages state
//     } catch (error) {
//       console.error(`Error fetching chat history for ${username}:`, error);
//       setMessages([]); // Clear messages on error
//     }
//   };

//   // Send a chat message via WebSocket
//   const sendMessage = () => {
//     const trimmedMessage = message.trim();
//     if (!trimmedMessage || !selectedUser || !user?.username) return;

//     if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
//       const messageData = {
//         sender: user.username,
//         receiver: selectedUser,
//         message: trimmedMessage,
//         // Add timestamp client-side for optimistic update if needed
//         // timestamp: new Date().toISOString()
//       };
//       console.log("Sending chat message:", messageData);
//       try {
//         chatSocketRef.current.send(JSON.stringify(messageData));
//         // Optimistic UI update (optional but improves perceived speed)
//         // setMessages((prev) => [...prev, { ...messageData, timestamp: new Date().toISOString() }]);
//         setMessage(''); // Clear input field
//       } catch (error) {
//           console.error("Error sending message via WebSocket:", error);
//           alert("Failed to send message. Connection issue?");
//       }
//     } else {
//       console.error('Chat WebSocket is not open. Cannot send message.');
//       alert('Cannot send message. Connection lost. Please refresh or try again.');
//     }
//   };

//   // --- Call Handling Functions ---
//   const handleInitiateCall = () => {
//     if (!selectedUser) {
//       alert('Please select a user to call.');
//       return;
//     }
//     if (isCallActive) {
//       alert('A call is already in progress.');
//       return;
//     }
    
//     console.log(`Initiating call with ${selectedUser}`);
//     setIsCallActive(true);
//   };

//   const handleEndCall = () => {
//     console.log('Call ended');
//     setIsCallActive(false);
//   };

//   const toggleSidebar = () => {
//     setShowSidebar(!showSidebar);
//   };

//   const selectUserChat = (username) => {
//      if (username === selectedUser) return; // Avoid re-selecting the same user

//     console.log("Selected chat:", username);
//     setSelectedUser(username); // Set the active chat partner
//     setMessages([]); // Clear messages from the previous chat immediately
//     setSearchQuery(''); // Clear search input
//     setSearchResults([]); // Clear search results list
//     if (window.innerWidth < 768) {
//       setShowSidebar(false);
//     }
//   };

//   const formatTime = (timestamp) => {
//     if (!timestamp) return '';
//     try {
//       const date = new Date(timestamp);
//       // Adjust options as needed for desired format
//       return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
//     } catch (e) {
//         console.error("Error formatting time:", e);
//         return "Invalid time";
//     }
//   };

//   const formatMessageDate = (timestamp) => {
//      if (!timestamp) return '';
//      try {
//         const date = new Date(timestamp);
//         const today = new Date();
//         const yesterday = new Date();
//         yesterday.setDate(today.getDate() - 1);

//         if (date.toDateString() === today.toDateString()) return 'Today';
//         if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
//         // Adjust options for desired date format
//         return date.toLocaleDateString([], { year: 'numeric', month: 'numeric', day: 'numeric' });
//     } catch(e) {
//         console.error("Error formatting message date:", e);
//         return "Invalid date";
//     }
//   };

  // return (
  //   <div className="chat-container">
  //     {/* Sidebar Section */}
  //     <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
  //       <div className="sidebar-header">
  //         <h2>Chats</h2>
  //         <div className="header-icons">
  //           <MoreVertical size={20} className="icon" /> {/* Placeholder Icon */}
  //         </div>
  //       </div>
  //       <div className="search-container">
  //         <div className="search-wrapper">
  //           <Search size={18} className="search-icon" />
  //           <input
  //             type="text"
  //             placeholder="Search or start new chat"
  //             value={searchQuery}
  //             onChange={(e) => setSearchQuery(e.target.value)}
  //             className="search-input"
  //           />
  //         </div>
  //       </div>
  //       {searchResults.length > 0 ? (
  //         <ul className="chat-list search-results">
  //           {searchResults.map((u) => (
  //             <li key={u.username} onClick={() => selectUserChat(u.username)} className="chat-list-item">
  //               <div className="avatar">{u.username?.charAt(0).toUpperCase()}</div>
  //               <div className="chat-info">
  //                 <div className="chat-name">{u.username}</div>
  //               </div>
  //             </li>
  //           ))}
  //         </ul>
  //       ) : (
  //         <ul className="chat-list">
  //           {recentChats.map((chat) => (
  //             <li
  //               key={chat.username}
  //               onClick={() => selectUserChat(chat.username)}
  //               className={`chat-list-item ${selectedUser === chat.username ? 'active' : ''}`}
  //             >
  //               <div className="avatar">{chat.username?.charAt(0).toUpperCase()}</div>
  //               <div className="chat-info">
  //                 <div className="chat-name">{chat.username}</div>
  //                 <div className="chat-last-message">{chat.lastMessage || 'No messages yet'}</div> {/* Display last message */}
  //               </div>
  //               <div className="chat-meta">
  //                 <span className="chat-time">{formatTime(chat.timestamp)}</span>
  //               </div>
  //             </li>
  //           ))}
  //         </ul>
  //       )}
  //     </div> {/* End Sidebar */}
  //     <div className="chat-main">
  //       {selectedUser ? (
  //         <>
  //           {/* Chat Header */}
  //           <div className="chat-header">
  //             {window.innerWidth < 768 && (
  //               <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
  //             )}
  //             <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
  //             <div className="user-info">
  //               <h3>{selectedUser}</h3>
  //               <span className="user-status">Online</span> {/* TODO: Implement presence system */}
  //             </div>
  //             <div className="header-actions">
  //               <PhoneCall
  //                 size={20}
  //                 className={`call-icon ${isCallActive ? 'disabled' : ''}`}
  //                 onClick={!isCallActive ? handleInitiateCall : undefined} // Only clickable when not in call
  //                 title={isCallActive ? "Call in progress" : "Start voice call"}
  //               />
  //               <MoreVertical size={20} className="icon" /> {/* Placeholder */}
  //             </div>
  //           </div>
  //           <div className="messages-container">
  //             {messages.length > 0 ? (
  //               <div className="messages-list">
  //                 {messages.map((msg, idx) => {
  //                   const isCurrentUser = msg.sender === user?.username;
  //                   const messageDate = formatMessageDate(msg.timestamp);
  //                   // Determine if the date header should be shown for this message
  //                   const showDateHeader = idx === 0 || formatMessageDate(messages[idx - 1]?.timestamp) !== messageDate;

  //                   return (
  //                     <React.Fragment key={msg.id || idx}> {/* Use message ID if available, fallback to index */}
  //                       {showDateHeader && (
  //                         <div className="date-separator"><span>{messageDate}</span></div>
  //                       )}
  //                       <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
  //                         <div className="message-content">
  //                           {msg.message || msg.content} {/* Handle potential variations in message field name */}
  //                           <span className="message-time">{formatTime(msg.timestamp)}</span>
  //                         </div>
  //                       </div>
  //                     </React.Fragment>
  //                   );
  //                 })}
  //                 <div ref={messagesEndRef} />
  //               </div>
  //             ) : (
  //               <div className="empty-chat"><p>Start the conversation with {selectedUser}!</p></div>
  //             )}
  //           </div> {/* End Messages Container */}
  //           <div className="message-input-container">
  //             <input
  //               type="text"
  //               value={message}
  //               onChange={(e) => setMessage(e.target.value)}
  //               onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), sendMessage()) : null}
  //               placeholder="Type a message..."
  //               className="message-input"
  //               disabled={isCallActive} // Optionally disable input during call
  //             />
  //             <button
  //               onClick={sendMessage}
  //               className="send-button"
  //               disabled={!message.trim() || isCallActive} // Disable if no message or during call
  //             >
  //               <Send size={20} />
  //             </button>
  //           </div> {/* End Message Input Area */}
            
  //           {/* Call UI Overlay */}
  //           {isCallActive && user?.username && (
  //             <div className="call-ui-overlay">
  //               <div className="call-box">
  //                 <VoiceCallComponent
  //                   myName={user.username}
  //                   onEndCall={handleEndCall}
  //                 />
  //               </div>
  //             </div>
  //           )}
  //         </> // End selected chat view
  //       ) : (
  //         <div className="no-chat-selected">
  //           <div className="welcome-message">
  //             <h3>Welcome, {user?.username || 'Guest'}!</h3>
  //             <p>Select a chat from the sidebar to start messaging or calling.</p>
  //           </div>
  //         </div>
  //       )} {/* End conditional rendering for selectedUser */}
  //     </div> {/* End Main Chat Area */}
  //   </div> // End Chat Container
  // );
// };
// export default Chat;


import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../assets/AuthContext'; 
import axios from 'axios';
import { Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
import './chat.css'; 

const Chat = () => {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null); 
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [showSidebar, setShowSidebar] = useState(true);
  const [recentChats, setRecentChats] = useState([]);
  const chatSocketRef = useRef(null);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (user && user.accessToken) {
      fetchRecentChats();
    } else {
      setRecentChats([]);
    }
  }, [user]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (searchQuery.trim() === '') {
        setSearchResults([]);
        return;
      }
  
      try {
        const res = await axios.get(`http://127.0.0.1:8000/chat/search-users/?q=${searchQuery}`, {
          headers: { Authorization: `Bearer ${user.accessToken}` },
        });
        setSearchResults(res.data);
      } catch (err) {
        console.error('Search error:', err);
        setSearchResults([]);
      }
    };
  
    const delayDebounce = setTimeout(fetchSearchResults, 300); // debounce typing
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user?.accessToken]);
  

  useEffect(() => {
    if (selectedUser && user?.accessToken) {
      fetchChatHistory(selectedUser);
    } else {
       setMessages([]);
    }
  }, [selectedUser, user?.accessToken]);

  useEffect(() => {
    if (!user?.username || !selectedUser) {
      if (chatSocketRef.current) {
        chatSocketRef.current.close();
        chatSocketRef.current = null;
      }
      return;
    }

    if (chatSocketRef.current) {
      chatSocketRef.current.close();
    }

    const wsUrl = `ws://127.0.0.1:8000/ws/chat/${user.username}/`;
    const ws = new WebSocket(wsUrl);
    chatSocketRef.current = ws;

    ws.onopen = () => {
      console.log(`Chat WebSocket connected for ${user.username}`);
    };

    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      const isCurrentChat = (data.sender === user.username && data.receiver === selectedUser) || 
                            (data.sender === selectedUser && data.receiver === user.username);

      if (isCurrentChat) {
        setMessages((prevMessages) => [...prevMessages, data]);
      } else {
        console.log("Received message for a different chat.");
      }
    };

    ws.onerror = (error) => {
      console.error("Chat WebSocket error:", error);
    };

    ws.onclose = (event) => {
      chatSocketRef.current = null;
    };

    return () => {
      if (ws && ws.readyState === WebSocket.OPEN) {
        ws.close();
      }
      chatSocketRef.current = null;
    };
  }, [user, selectedUser]);

  const fetchRecentChats = async () => {
    if (!user?.accessToken) return;
    try {
      const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      setRecentChats(res.data);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
      setRecentChats([]);
    }
  };

  const fetchChatHistory = async (username) => {
    if (!username || !user?.accessToken) {
      setMessages([]);
      return;
    }
    try {
      const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
        headers: { Authorization: `Bearer ${user.accessToken}` },
      });
      setMessages(res.data);
    } catch (error) {
      setMessages([]);
    }
  };

  const sendMessage = () => {
    const trimmedMessage = message.trim();
    if (!trimmedMessage || !selectedUser || !user?.username) return;

    if (chatSocketRef.current && chatSocketRef.current.readyState === WebSocket.OPEN) {
      const messageData = {
        sender: user.username,
        receiver: selectedUser,
        message: trimmedMessage,
      };
      chatSocketRef.current.send(JSON.stringify(messageData));
      setMessage('');
    } else {
      alert('Cannot send message. Connection lost.');
    }
  };

  const selectUserChat = (username) => {
    setSelectedUser(username);
    setMessages([]);
    setSearchQuery('');
    setSearchResults([]);
  };

  const formatMessageDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    const today = new Date();

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    }

    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    }

    return date.toLocaleDateString();
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  return (
    <div className="chat-container">
      {/* Sidebar Section */}
      <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <div className="header-icons">
            <MoreVertical size={20} className="icon" /> {/* Placeholder Icon */}
          </div>
        </div>
        <div className="search-container">
          <div className="search-wrapper">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>
        </div>
        {searchResults.length > 0 ? (
          <ul className="chat-list search-results">
            {searchResults.map((u) => (
              <li key={u.username} onClick={() => selectUserChat(u.username)} className="chat-list-item">
                <div className="avatar">{u.username?.charAt(0).toUpperCase()}</div>
                <div className="chat-info">
                  <div className="chat-name">{u.username}</div>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="chat-list">
            {recentChats.map((chat) => (
              <li
                key={chat.username}
                onClick={() => selectUserChat(chat.username)}
                className={`chat-list-item ${selectedUser === chat.username ? 'active' : ''}`}
              >
                <div className="avatar">{chat.username?.charAt(0).toUpperCase()}</div>
                <div className="chat-info">
                  <div className="chat-name">{chat.username}</div>
                  <div className="chat-last-message">{chat.lastMessage || 'No messages yet'}</div>
                </div>
                <div className="chat-meta">
                  <span className="chat-time">{formatTime(chat.timestamp)}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div> {/* End Sidebar */}
      
      <div className="chat-main">
        {selectedUser ? (
          <>
            {/* Chat Header */}
            <div className="chat-header">
              {window.innerWidth < 768 && (
                <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
              )}
              <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <h3>{selectedUser}</h3>
                <span className="user-status">Online</span> {/* TODO: Implement presence system */}
              </div>
              <div className="header-actions">
                <MoreVertical size={20} className="icon" /> {/* Placeholder */}
              </div>
            </div>
            
            <div className="messages-container">
              {messages.length > 0 ? (
                <div className="messages-list">
                  {messages.map((msg, idx) => {
                    const isCurrentUser = msg.sender === user?.username;
                    const messageDate = formatMessageDate(msg.timestamp);
                    const showDateHeader = idx === 0 || formatMessageDate(messages[idx - 1]?.timestamp) !== messageDate;
  
                    return (
                      <React.Fragment key={msg.id || idx}>
                        {showDateHeader && (
                          <div className="date-separator"><span>{messageDate}</span></div>
                        )}
                        <div className={`message ${isCurrentUser ? 'sent' : 'received'}`}>
                          <div className="message-content">
                            {msg.message || msg.content}
                            <span className="message-time">{formatTime(msg.timestamp)}</span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="empty-chat"><p>Start the conversation with {selectedUser}!</p></div>
              )}
            </div> {/* End Messages Container */}
            
            <div className="message-input-container">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey ? (e.preventDefault(), sendMessage()) : null}
                placeholder="Type a message..."
                className="message-input"
              />
              <button
                onClick={sendMessage}
                className="send-button"
                disabled={!message.trim()} // Disable if no message
              >
                <Send size={20} />
              </button>
            </div> {/* End Message Input Area */}
          </> // End selected chat view
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h3>Welcome, {user?.username || 'Guest'}!</h3>
              <p>Select a chat from the sidebar to start messaging.</p>
            </div>
          </div>
        )} {/* End conditional rendering for selectedUser */}
      </div>
    </div>
  );
};

export default Chat;
