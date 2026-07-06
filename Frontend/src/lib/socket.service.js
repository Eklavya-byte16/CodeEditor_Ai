import { io } from 'socket.io-client';

const BACKEND_URL = 'http://localhost:5000';
let socket = null;

export const socketService = {
  // 1. Establish the connection securely
  connect: () => {
    // If socket already exists and is connected, don't create a new one
    if (socket && socket.connected) {
      console.log('🔌 Socket is already active and connected.');
      return socket;
    }

    if (!socket) {
      socket = io(BACKEND_URL, {
        reconnectionAttempts: 5,
        timeout: 10000,
      });
      
      socket.on('connect', () => {
        console.log(`✅ Success: Browser connected to MERN with ID: ${socket.id}`);
      });
    } else {
      // If it exists but was manually closed, just reconnect it
      socket.connect();
    }
    return socket;
  },

  // 2. Send prompts safely
  sendPrompt: (text) => {
    if (socket && socket.connected) {
      socket.emit('frontend_send', { text });
    } else {
      console.error("🚨 Cannot send: Socket is not connected!");
    }
  },

  // 3. Listen for incoming AI data
  onMessageReceived: (callback) => {
    if (socket) {
      // Remove any existing listeners first to prevent duplication
      socket.off('frontend_receive'); 
      socket.on('frontend_receive', (data) => {
        callback(data.reply);
      });
    }
  },

  onStatusChanged: (callback) => {
  if (socket) {
    socket.off('frontend_status_receive'); // Clear duplicate stacks
    socket.on('frontend_status_receive', (data) => {
      callback(data.status);
    });
  }
},

  // 4. Soft Disconnect (Don't destroy the engine completely during React mounts)
  disconnect: () => {
    if (socket) {
      // Just turn off listeners during minor UI re-renders instead of hard destroying the connection
      socket.off('frontend_receive');
      console.log('🧹 Cleaned up frontend active socket listeners');
    }
  }
};
