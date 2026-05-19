import React, { useState, useEffect } from 'react';
import { motion, useMotionTemplate, useMotionValue, animate } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import { toast } from 'sonner';
import { BACKEND_URL } from '../config';

const Landing = () => {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Motion values for animated background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const radius = useMotionValue(400);

  // Animated gradient colors
  const colors = ['#667eea', '#764ba2', '#f093fb', '#f5576c', '#4facfe', '#00f2fe'];
  const [currentColorIndex, setCurrentColorIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentColorIndex((prev) => (prev + 1) % colors.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const backgroundImage = useMotionTemplate`
    radial-gradient(
      ${radius}px circle at ${mouseX}px ${mouseY}px,
      ${colors[currentColorIndex]}15,
      transparent 40%
    )
  `;

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left);
    mouseY.set(e.clientY - rect.top);
  };

  const createRoom = async () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await Axios.post(`${BACKEND_URL}/create-room`, {
        userName: userName.trim()
      });
      const newRoomId = response.data.roomName;
      navigate(`/playground/${newRoomId}`, { 
        state: { userName: userName.trim() } 
      });
      toast.success('Room created successfully!');
    } catch (error) {
      console.error('Error creating room:', error);
      toast.error('Failed to create room. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const joinRoom = () => {
    if (!userName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!roomId.trim()) {
      toast.error('Please enter a room ID');
      return;
    }
    
    navigate(`/playground/${roomId}`, { 
      state: { userName: userName.trim() } 
    });
  };

  const features = [
    {
      icon: "💻",
      title: "Real-time Collaboration",
      description: "Code together with your team in real-time"
    },
    {
      icon: "🚀",
      title: "Instant Setup",
      description: "No registration required, just enter your name and start coding"
    },
    {
      icon: "🔗",
      title: "Easy Sharing",
      description: "Share room IDs with your teammates instantly"
    },
    {
      icon: "⚡",
      title: "Lightning Fast",
      description: "Built with modern technologies for optimal performance"
    }
  ];

  return (
    <motion.div
      className="min-h-screen bg-gray-950 relative overflow-hidden"
      onMouseMove={handleMouseMove}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
    >
      {/* Animated Background */}
      <motion.div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage,
        }}
      />

      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950" />

      {/* Floating Particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(20)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full opacity-20"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
            animate={{
              y: [0, -100, 0],
              opacity: [0.2, 0.5, 0.2],
            }}
            transition={{
              duration: 3 + Math.random() * 2,
              repeat: Infinity,
              delay: Math.random() * 2,
            }}
          />
        ))}
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 py-12">
        {/* Hero Section */}
        <motion.div
          className="text-center mb-16"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          <motion.h1
            className="text-6xl md:text-8xl font-bold mb-6 bg-gradient-to-r from-blue-400 via-purple-500 to-pink-500 bg-clip-text text-transparent"
            animate={{
              backgroundPosition: ['0%', '100%'],
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              repeatType: 'reverse',
            }}
          >
            CodeSync
          </motion.h1>
          <motion.p
            className="text-xl md:text-2xl text-gray-300 max-w-3xl mx-auto leading-relaxed"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
          >
            The ultimate real-time code collaboration platform. 
            <span className="text-blue-400 font-semibold"> Create, share, and code together</span> with your team instantly.
          </motion.p>
        </motion.div>

        {/* Main Form Card */}
        <motion.div
          className="w-full max-w-md"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          <div className="bg-gray-900/50 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
            {/* User Name Input */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Your Name
              </label>
              <motion.input
                type="text"
                placeholder="Enter your name"
                value={userName}
                onChange={(e) => setUserName(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all duration-300"
                maxLength={20}
                whileFocus={{ scale: 1.02 }}
              />
            </div>

            {/* Create Room Button */}
            <motion.button
              onClick={createRoom}
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed mb-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {isLoading ? (
                <motion.div
                  className="flex items-center justify-center"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                </motion.div>
              ) : (
                "Create New Room"
              )}
            </motion.button>

            {/* Divider */}
            <div className="flex items-center my-6">
              <div className="flex-1 border-t border-gray-700" />
              <span className="px-4 text-gray-500 text-sm">or</span>
              <div className="flex-1 border-t border-gray-700" />
            </div>

            {/* Join Room Section */}
            <div className="space-y-4">
              <motion.input
                type="text"
                placeholder="Enter Room ID"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-green-500 focus:ring-2 focus:ring-green-500/20 transition-all duration-300"
                whileFocus={{ scale: 1.02 }}
              />
              <motion.button
                onClick={joinRoom}
                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 hover:shadow-lg"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Join Room
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div
          className="mt-20 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto"
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.8 }}
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              className="bg-gray-900/30 backdrop-blur-sm border border-gray-800 rounded-xl p-6 text-center hover:bg-gray-900/50 transition-all duration-300"
              whileHover={{ 
                y: -10,
                scale: 1.05,
                boxShadow: "0 20px 40px rgba(0,0,0,0.3)"
              }}
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.6, delay: 1 + index * 0.1 }}
            >
              <div className="text-4xl mb-4">{feature.icon}</div>
              <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
              <p className="text-gray-400 text-sm">{feature.description}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* Footer */}
        <motion.div
          className="mt-16 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 1.2 }}
        >
          <p className="text-gray-500 text-sm">
            Built with ❤️ for developers
          </p>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default Landing;
