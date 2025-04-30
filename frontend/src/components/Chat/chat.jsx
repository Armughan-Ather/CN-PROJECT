import React, { useEffect, useState, useRef } from 'react';
import { useAuth } from '../../assets/AuthContext';
import axios from 'axios';
import { PhoneCall, Search, Send, ArrowLeft, MoreVertical } from 'lucide-react';
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
  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle WebSocket connection
  useEffect(() => {
    if (!user || !user.username || !selectedUser) return;

    const ws = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${selectedUser}/`);
    socketRef.current = ws;

    ws.onopen = () => console.log('WebSocket connected');
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessages(prev => [...prev, data]);
    };
    ws.onclose = () => console.log('WebSocket disconnected');

    // Fetch chat history when a user is selected
    fetchChatHistory(selectedUser);

    return () => ws.close();
  }, [selectedUser, user]);

  // Fetch recent chats on component mount
  useEffect(() => {
    if (user && user.accessToken) {
      fetchRecentChats();
    }
  }, [user]);

  // Handle user search
  useEffect(() => {
    const fetchUsers = async () => {
      if (!searchQuery.trim() || !user || !user.accessToken) {
        setSearchResults([]);
        return;
      }

      try {
        const res = await axios.get(`http://127.0.0.1:8000/chat/search-users/?q=${searchQuery}`, {
          headers: {
            Authorization: `Bearer ${user.accessToken}`,
          },
        });
        setSearchResults(res.data);
      } catch (error) {
        console.error('Search error:', error);
      }
    };

    const delayDebounce = setTimeout(fetchUsers, 300);
    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  // Fetch recent chats
  const fetchRecentChats = async () => {
    try {
      const res = await axios.get('http://127.0.0.1:8000/chat/recent-contacts/', {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
      setRecentChats(res.data);
    } catch (error) {
      console.error('Error fetching recent chats:', error);
    }
  };

  // Fetch chat history with a specific user
  const fetchChatHistory = async (username) => {
    try {
      const res = await axios.get(`http://127.0.0.1:8000/chat/chat-history/${username}/`, {
        headers: {
          Authorization: `Bearer ${user.accessToken}`,
        },
      });
      setMessages(res.data);
    } catch (error) {
      console.error('Error fetching chat history:', error);
      setMessages([]);
    }
  };

  // Send message
  const sendMessage = () => {
    if (!message.trim()) return;
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify({
        sender: user.username,
        message: message.trim(),
      }));
      setMessage('');
    }
  };

  // Handle call functionality
  const initiateCall = () => {
    // This would be implemented with your chosen video/voice call solution
    alert(`Initiating call with ${selectedUser}`);
    // Placeholder for actual call functionality
  };

  // Format timestamp
  const formatTime = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  // Format date for message grouping
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

  // Toggle mobile sidebar
  const toggleSidebar = () => {
    setShowSidebar(!showSidebar);
  };

  // Select a chat user
  const selectUserChat = (username) => {
    setSelectedUser(username);
    setMessages([]);
    if (window.innerWidth < 768) {
      setShowSidebar(false);
    }
  };

  return (
    <div className="chat-container">
      {/* Sidebar - Chat list */}
      <div className={`chat-sidebar ${showSidebar ? 'show' : 'hide'}`}>
        <div className="sidebar-header">
          <h2>Chats</h2>
          <div className="header-icons">
            <MoreVertical size={20} className="icon" />
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
              <li
                key={u.username}
                onClick={() => selectUserChat(u.username)}
                className="chat-list-item"
              >
                <div className="avatar">{u.username.charAt(0).toUpperCase()}</div>
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
                <div className="avatar">{chat.username.charAt(0).toUpperCase()}</div>
                <div className="chat-info">
                  <div className="chat-name">{chat.username}</div>
                  <div className="chat-last-message">{chat.lastMessage}</div>
                </div>
                <div className="chat-meta">
                  <span className="chat-time">{formatTime(chat.timestamp)}</span>
                  {chat.unreadCount > 0 && (
                    <span className="unread-count">{chat.unreadCount}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Main chat area */}
      <div className="chat-main">
        {selectedUser ? (
          <>
            <div className="chat-header">
              {window.innerWidth < 768 && (
                <ArrowLeft size={24} className="back-button" onClick={toggleSidebar} />
              )}
              <div className="avatar">{selectedUser.charAt(0).toUpperCase()}</div>
              <div className="user-info">
                <h3>{selectedUser}</h3>
                <span className="user-status">Online</span>
              </div>
              <div className="header-actions">
                <PhoneCall 
                  size={20} 
                  className="call-icon" 
                  onClick={initiateCall} 
                  title="Call"
                />
                <MoreVertical size={20} className="icon" />
              </div>
            </div>

            <div className="messages-container">
              {messages.length > 0 ? (
                <div className="messages-list">
                  {messages.map((msg, idx) => {
                    const isCurrentUser = msg.sender === user.username;
                    const messageDate = formatMessageDate(msg.timestamp);
                    const showDateHeader = idx === 0 || 
                      formatMessageDate(messages[idx-1]?.timestamp) !== messageDate;
                    
                    return (
                      <React.Fragment key={idx}>
                        {showDateHeader && (
                          <div className="date-separator">
                            <span>{messageDate}</span>
                          </div>
                        )}
                        <div
                          className={`message ${isCurrentUser ? 'sent' : 'received'}`}
                        >
                          <div className="message-content">
                            {msg.message}
                            <span className="message-time">
                              {formatTime(msg.timestamp)}
                            </span>
                          </div>
                        </div>
                      </React.Fragment>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              ) : (
                <div className="empty-chat">
                  <p>Start a conversation with {selectedUser}</p>
                </div>
              )}
            </div>

            <div className="message-input-container">
              <input
                type="text"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                placeholder="Type a message"
                className="message-input"
              />
              <button 
                onClick={sendMessage} 
                className="send-button"
                disabled={!message.trim()}
              >
                <Send size={20} />
              </button>
            </div>
          </>
        ) : (
          <div className="no-chat-selected">
            <div className="welcome-message">
              <h3>Welcome to the Chat</h3>
              <p>Select a user from the list to start chatting</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;