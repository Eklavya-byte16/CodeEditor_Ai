import React from "react";
import "../../Pages/Dasktop.css";
import ColorBends from "../ui/ColorBends.jsx";
import { useState, useEffect } from "react";

import { socketService } from "../../lib/socket.service.js";

function Greating() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([]);
  
  // 1. New React status tracker variable state
  const [status, setStatus] = useState('idle'); 

  useEffect(() => {
    socketService.connect();

       socketService.onMessageReceived((data) => {
      setMessages((prev) => [...prev, { 
        sender: 'AI Agent', 
        text: data.reply,
        audio: data.audioData // Save it right inside this message object block
      }]);
    });

    // 2. Attach our newly created state stream listener
socketService.onStatusChanged((currentStatus) => {
      setStatus(currentStatus);
    });

    return () => {
      socketService.disconnect();
    };
  }, []);

  const playAudioTrack = (base64AudioUri) => {
    if (!base64AudioUri) return;
    const audioPlayer = new Audio(base64AudioUri);
    audioPlayer.play();
  };

 const getStatusMessage = () => {
    switch (status) {
      case 'recording': return '🎙️ Recording... Speak into your mic!';
      case 'processing_audio': return '⚙️ Processing your voice...';
      case 'ai_thinking': return '🤖 Agent is formulating response...';
      case 'speaking': return '🔊 Speaking response out loud...';
      default: return '✅ Ready';
    }
  };

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    setMessages((prev) => [...prev, { sender: 'You', text: input }]);
    socketService.sendPrompt(input);
    setInput('');
  };


  return (
    <section className="Background" style={{ position: "relative" }}>
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          zIndex: 1,
        }}
      >
        <ColorBends
          colors={["#A855F7"]}
          rotation={-113}
          speed={0.13}
          scale={1}
          frequency={2}
          warpStrength={0.92}
          mouseInfluence={0}
          noise={0.01}
          parallax={1.35}
          iterations={0}
          intensity={1.6}
          bandWidth={10}
          transparent
          autoRotate={1}
          color="#A855F7"
        />
      </div>

      <div
        style={{
          position: "relative",
          zIndex: 10,
          padding: "20px",
          maxWidth: "500px",
          margin: "100px auto 0 auto",
          background: "#fff",
          borderRadius: "8px",
        }}
      >
        <h3 style={{ color: "#000", marginTop: 0 }}>
          🤖 Python AI Agent Bridge
        </h3>

        
        <div style={{ border: '1px solid #ccc', height: '300px', overflowY: 'scroll', padding: '10px', color: '#000' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ textAlign: msg.sender === 'You' ? 'right' : 'left', margin: '10px 0' }}>
              <div><strong>{msg.sender}:</strong> {msg.text}</div>
              
              {/* 3. Add a dedicated contextual playback button ONLY on AI messages containing audio tracks */}
              {msg.sender === 'AI Agent' && msg.audio && (
                <button 
                  onClick={() => playAudioTrack(msg.audio)}
                  style={{ marginTop: '5px', padding: '4px 8px', fontSize: '12px', background: '#A855F7', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
                >
                  🔊 Listen
                </button>
              )}
            </div>
          ))}
        </div>

        {/* 3. Visual notification banner to tell user what is happening */}
        <div
          style={{
            padding: "8px",
            marginBottom: "10px",
            borderRadius: "4px",
            fontSize: "14px",
            fontWeight: "bold",
            background: status === "idle" ? "#E1F5FE" : "#FFF3E0",
            color: status === "idle" ? "#0288D1" : "#F57C00",
          }}
        >
          Status: {getStatusMessage()}
        </div>
        <div
          style={{
            border: "1px solid #ccc",
            height: "300px",
            overflowY: "scroll",
            padding: "10px",
            color: "#000",
          }}
        >
          {messages.map((msg, idx) => (
            <div
              key={idx}
              style={{
                textAlign: msg.sender === "You" ? "right" : "left",
                margin: "5px",
              }}
            >
              <strong>{msg.sender}:</strong> {msg.text}
            </div>
          ))}
        </div>



        <form
          onSubmit={handleSend}
          style={{ marginTop: "10px", display: "flex", gap: "5px" }}
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask Python AI..."
            disabled={status !== "idle"} // Disables writing inputs while AI handles processes
            style={{ flexGrow: 1, padding: "8px" }}
          />
          
          <button
            type="button"
            onClick={() => socketService.sendPrompt("__start_voice_capture__")}
            disabled={status !== "idle"}
            style={{
              padding: "8px",
              background: "#EF4444",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            🎙️ Speak
          </button>

          <button
            type="submit"
            disabled={status !== "idle"}
            style={{
              padding: "8px",
              background: "#A855F7",
              color: "#fff",
              border: "none",
              cursor: "pointer",
            }}
          >
            Send
          </button>
        </form>
      </div>
    </section>
  );
}

export default Greating;
