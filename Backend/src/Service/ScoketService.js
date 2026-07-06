import { Server } from "socket.io";

let pythonAgentSocket = null; // Track our Python agent socket globally

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Allows React and Python microservices to safely connect
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log(`🔌 New socket connection: ${socket.id}`);

    // 1. Python identifies itself
    socket.on('identify_service', (data) => {
      if (data.type === 'ai_agent') {
        pythonAgentSocket = socket;
        console.log(`🤖 Microservice Registered: Python AI Agent is online!`);
      }
    });

    // 2. React UI sends a prompt
    socket.on('frontend_send', (data) => {
      console.log(`💬 Prompt received from Frontend: "${data.text}"`);

      if (pythonAgentSocket) {
        pythonAgentSocket.emit('ask_agent', { 
          question: data.text,
          userSocketId: socket.id // Attaches user ID so python knows who to respond to
        });
      } else {
        socket.emit('frontend_receive', { reply: "🚨 Error: AI Agent microservice is offline." });
      }
    });

    // 3. Python sends back the generated result
socket.on('agent_response', (data) => {
  console.log(`📥 Received from Agent. Routing back to user ${data.userSocketId}`);
  // Pass along BOTH the reply text and the audioData string payload
  io.to(data.userSocketId).emit('frontend_receive', { 
    reply: data.reply, 
    audioData: data.audioData 
  });
});


    socket.on('agent_status_change', (data) => {
  console.log(`⏳ State Change: [${data.status}] for client ${data.userSocketId}`);
  // Pass the state flag straight to the browser tab
  io.to(data.userSocketId).emit('frontend_status_receive', { status: data.status });
});

    socket.on('disconnect', () => {
      if (pythonAgentSocket && socket.id === pythonAgentSocket.id) {
        pythonAgentSocket = null;
        console.log("❌ Warning: Python AI Agent went offline!");
      } else {
        console.log(`🔌 Closed socket connection: ${socket.id}`);
      }
    });
  });

  return io;
};
