import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import Editor from "@monaco-editor/react";
import { useParams, useLocation } from 'react-router-dom';
import Axios from "axios"
import { toast } from 'sonner';

const socket = io(import.meta.env.VITE_BACKEND_URL || 'https://codesync-server-ymmg.onrender.com');

const LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', icon: '⚡' },
  { id: 'typescript', name: 'TypeScript', icon: '🔷' },
  { id: 'python', name: 'Python', icon: '🐍' },
  { id: 'java', name: 'Java', icon: '☕' },
  { id: 'cpp', name: 'C++', icon: '⚙️' },
  { id: 'csharp', name: 'C#', icon: '🎯' },
  { id: 'php', name: 'PHP', icon: '🐘' },
  { id: 'html', name: 'HTML', icon: '🌐' },
  { id: 'css', name: 'CSS', icon: '🎨' },
  { id: 'json', name: 'JSON', icon: '📄' },
  { id: 'sql', name: 'SQL', icon: '🗄️' },
  { id: 'rust', name: 'Rust', icon: '🦀' }
];

const THEMES = [
  { id: 'vs-dark', name: 'Dark', icon: '🌙' },
  { id: 'vs-light', name: 'Light', icon: '☀️' },
  { id: 'hc-black', name: 'High Contrast', icon: '⚫' }
];

function Playground() {
  const { id } = useParams();
  const location = useLocation();
  const userName = location.state?.userName || 'Anonymous';
  const [text, setText] = useState('');
  const [users, setUsers] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState('javascript');
  const [selectedTheme, setSelectedTheme] = useState('vs-dark');
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState([]);
  
  const getRoomContent = async (roomName) => {
    try {
      const res = await Axios.get(`${import.meta.env.VITE_BACKEND_URL || 'https://codesync-server-ymmg.onrender.com'}/get-room-content`, {
        params: {
          roomName
        }
      });
      setText(res.data.content || '');
    } catch (error) {
      console.error('Error getting room content:', error);
      toast.error('Failed to load room content');
    }
  }

  const getRoomUsers = async (roomName) => {
    try {
      const res = await Axios.get(`${import.meta.env.VITE_BACKEND_URL || 'https://codesync-server-ymmg.onrender.com'}/get-room-users`, {
        params: {
          roomName
        }
      });
      console.log('Fetched users:', res.data.users);
      setUsers(res.data.users || []);
    } catch (error) {
      console.error('Error getting room users:', error);
    }
  }

  useEffect(() => {
    getRoomContent(id);
    getRoomUsers(id);
    
    socket.on('connect', () => {
      setIsConnected(true);
      console.log('Connected to server');
    });
    
    socket.on('disconnect', () => {
      setIsConnected(false);
      console.log('Disconnected from server');
    });
    
    socket.on('textUpdated', (updatedText) => {
      setText(updatedText);
    });
    
    socket.on('userJoined', (message) => {
      console.log("User joined:", message);
      toast.info(message);
      getRoomUsers(id);
    });
    
    socket.on('userLeft', (message) => {
      console.log("User left:", message);
      toast.info(message);
      getRoomUsers(id);
    });
    
    socket.on('usersList', (usersList) => {
      console.log('Received users list:', usersList);
      setUsers(usersList || []);
    });
    
    socket.on('roomUsers', (usersList) => {
      console.log('Received room users:', usersList);
      setUsers(usersList || []);
    });

    // Chat functionality
    socket.on('chatMessage', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('userTyping', (data) => {
      if (data.userName !== userName) {
        setTypingUsers(prev => {
          const filtered = prev.filter(u => u.userName !== data.userName);
          return [...filtered, data];
        });
        
        setTimeout(() => {
          setTypingUsers(prev => prev.filter(u => u.userName !== data.userName));
        }, 3000);
      }
    });

    socket.on('userStoppedTyping', (data) => {
      setTypingUsers(prev => prev.filter(u => u.userName !== data.userName));
    });
    
    return () => {
      socket.off('textUpdated');
      socket.off('userJoined');
      socket.off('userLeft');
      socket.off('usersList');
      socket.off('roomUsers');
      socket.off('connect');
      socket.off('disconnect');
      socket.off('chatMessage');
      socket.off('userTyping');
      socket.off('userStoppedTyping');
    };
  }, [id, userName]);

  const handleTextChange = (value) => {
    setText(value);
    socket.emit('updateText', id, value);
    
    // Typing indicator
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('userTyping', { roomName: id, userName });
    }
    
    // Clear typing indicator after delay
    clearTimeout(window.typingTimeout);
    window.typingTimeout = setTimeout(() => {
      setIsTyping(false);
      socket.emit('userStoppedTyping', { roomName: id, userName });
    }, 1000);
  };

  const joinRoom = () => {
    console.log('Joining room:', id, 'with username:', userName);
    socket.emit('joinRoom', id, userName);
  };

  useEffect(() => {
    if (isConnected) {
      joinRoom();
    }
    
    return () => {
      socket.emit('leaveRoom', id);
    };
  }, [id, isConnected, userName]);

  // Refresh user list periodically to ensure accuracy
  useEffect(() => {
    const interval = setInterval(() => {
      if (isConnected) {
        getRoomUsers(id);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [id, isConnected]);

  const sendMessage = () => {
    if (newMessage.trim()) {
      const message = {
        id: Date.now(),
        userName,
        text: newMessage.trim(),
        timestamp: new Date().toLocaleTimeString()
      };
      
      socket.emit('sendMessage', { roomName: id, message });
      setNewMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(text);
    toast.success('Code copied to clipboard!');
  };

  const downloadCode = () => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `code-${id}.${selectedLanguage}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success('Code downloaded!');
  };

  const clearCode = () => {
    if (window.confirm('Are you sure you want to clear all code?')) {
      setText('');
      socket.emit('updateText', id, '');
      toast.success('Code cleared!');
    }
  };

  return (
    <div className="App h-screen flex flex-col">
      {/* Header with room info */}
      <div className='bg-gray-900 text-white p-4 border-b border-gray-700 flex items-center justify-between'>
        <div className='flex items-center space-x-4'>
          <div className='bg-zinc-800 px-4 py-2 rounded-lg'>
            <span className='text-sm text-gray-400'>Room:</span> {id}
          </div>
          <div className='flex items-center space-x-2'>
            <span className='text-sm text-gray-400'>Language:</span>
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className='bg-gray-800 border border-gray-600 rounded px-2 py-1 text-sm'
            >
              {LANGUAGES.map(lang => (
                <option key={lang.id} value={lang.id}>
                  {lang.icon} {lang.name}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className='flex items-center space-x-4'>
          <div className='text-sm'>
            <span className='text-gray-400'>You:</span> {userName}
          </div>
          
          {/* Action Buttons */}
          <div className='flex items-center space-x-2'>
            <button
              onClick={copyCode}
              className='bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-sm transition-colors'
              title="Copy Code"
            >
              📋 Copy
            </button>
            <button
              onClick={downloadCode}
              className='bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-sm transition-colors'
              title="Download Code"
            >
              💾 Download
            </button>
            <button
              onClick={clearCode}
              className='bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-sm transition-colors'
              title="Clear Code"
            >
              🗑️ Clear
            </button>
            <button
              onClick={() => setShowChat(!showChat)}
              className={`px-3 py-1 rounded text-sm transition-colors ${
                showChat ? 'bg-purple-600 hover:bg-purple-700' : 'bg-gray-600 hover:bg-gray-700'
              } text-white`}
              title="Toggle Chat"
            >
              💬 Chat
            </button>
            <button
              onClick={() => setShowSettings(!showSettings)}
              className='bg-gray-600 hover:bg-gray-700 text-white px-3 py-1 rounded text-sm transition-colors'
              title="Settings"
            >
              ⚙️ Settings
            </button>
            <button
              className='bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded'
              onClick={() => {
                navigator.clipboard.writeText(id);
                toast.success('Room ID copied to clipboard');
              }}
            >
              Copy Room ID
            </button>
          </div>
        </div>
      </div>
      
      {/* Settings Panel */}
      {showSettings && (
        <div className='bg-gray-800 border-b border-gray-700 p-4'>
          <div className='flex items-center space-x-6'>
            <div className='flex items-center space-x-2'>
              <span className='text-sm text-gray-300'>Theme:</span>
              <select
                value={selectedTheme}
                onChange={(e) => setSelectedTheme(e.target.value)}
                className='bg-gray-700 border border-gray-600 rounded px-2 py-1 text-sm'
              >
                {THEMES.map(theme => (
                  <option key={theme.id} value={theme.id}>
                    {theme.icon} {theme.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content Area */}
      <div className='flex-1 flex'>
        {/* Editor */}
        <div className={`flex-1 ${showChat ? 'w-2/3' : 'w-full'}`}>
          <Editor
            theme={selectedTheme}
            height="100%"
            value={text}
            language={selectedLanguage}
            onChange={handleTextChange}
            options={{
              minimap: { enabled: true },
              fontSize: 14,
              wordWrap: 'on',
              lineNumbers: 'on',
              roundedSelection: false,
              scrollBeyondLastLine: false,
              automaticLayout: true,
              suggestOnTriggerCharacters: true,
              quickSuggestions: true,
              parameterHints: true,
              formatOnPaste: true,
              formatOnType: true
            }}
          />
        </div>
        
        {/* Chat Panel */}
        {showChat && (
          <div className='w-1/3 bg-gray-800 border-l border-gray-700 flex flex-col'>
            {/* Chat Header */}
            <div className='p-4 border-b border-gray-700'>
              <h3 className='text-white font-semibold'>💬 Chat</h3>
              {typingUsers.length > 0 && (
                <p className='text-sm text-gray-400 mt-1'>
                  {typingUsers.map(u => u.userName).join(', ')} typing...
                </p>
              )}
            </div>
            
            {/* Chat Messages */}
            <div className='flex-1 overflow-y-auto p-4 space-y-3'>
              {chatMessages.map((message) => (
                <div key={message.id} className={`flex ${message.userName === userName ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-xs px-3 py-2 rounded-lg ${
                    message.userName === userName 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-200'
                  }`}>
                    <div className='text-xs opacity-75 mb-1'>{message.userName}</div>
                    <div className='text-sm'>{message.text}</div>
                    <div className='text-xs opacity-50 mt-1'>{message.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
            
            {/* Chat Input */}
            <div className='p-4 border-t border-gray-700'>
              <div className='flex space-x-2'>
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="Type a message..."
                  className='flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500'
                />
                <button
                  onClick={sendMessage}
                  className='px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded transition-colors'
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Active Users List */}
      {users.length > 0 && (
        <div className='bg-gray-900 border-t border-gray-700 p-3'>
          <div className='flex items-center space-x-2'>
            <span className='text-sm text-gray-400'>Active users:</span>
            <div className='flex flex-wrap gap-2'>
              {users.map((user, index) => (
                <span 
                  key={user.socketId} 
                  className={`text-xs px-2 py-1 rounded ${
                    user.userName === userName 
                      ? 'bg-blue-600 text-white' 
                      : 'bg-gray-700 text-gray-300'
                  }`}
                >
                  {user.userName}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Playground;
