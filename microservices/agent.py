import asyncio
import os
import socketio
from groq import Groq
from dotenv import load_dotenv
from voice_engine import speak_text, listen_to_microphone 

load_dotenv()
groq_client = Groq(api_key=os.getenv("GROQ_API_KEY"))
sio = socketio.AsyncClient()

@sio.event
async def connect():
    print("\n✅ Success: Python Voice Agent connected to MERN Backend!")
    await sio.emit('identify_service', {'type': 'ai_agent'})

@sio.event
async def ask_agent(data):
    question = data.get('question')
    user_socket_id = data.get('userSocketId')
    
    if not question:
        return

    # 1. Triggered Voice Input
    if question.lower() == "__start_voice_capture__":
        await sio.emit('agent_status_change', {'status': 'recording', 'userSocketId': user_socket_id})
        
        question = listen_to_microphone(groq_client)
        
        if not question:
            await sio.emit('agent_status_change', {'status': 'idle', 'userSocketId': user_socket_id})
            await sio.emit('agent_response', {'reply': "I couldn't hear anything clearly.", 'userSocketId': user_socket_id})
            return
            
        await sio.emit('agent_status_change', {'status': 'processing_audio', 'userSocketId': user_socket_id})
        print(f"🗣️ Transcribed Speech: {question}")

    # 2. Querying LLM Brain
    await sio.emit('agent_status_change', {'status': 'ai_thinking', 'userSocketId': user_socket_id})
    print("🤖 Querying the Llama-3 AI model...")
    
    try:
        completion = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "user", "content": f"You are a short, concise voice assistant. Answer this question in 1 or 2 clear sentences: {question}"}
            ],
            temperature=0.7,
            max_tokens=150
        )
        
        ai_reply = completion.choices[0].message.content
        print(f"💡 Generated reply: {ai_reply}")

        # 🔧 UPDATE: Generate the Base64 audio string instead of executing system play triggers
        await sio.emit('agent_status_change', {'status': 'speaking', 'userSocketId': user_socket_id})
        audio_data_uri = await asyncio.to_thread(speak_text, ai_reply, groq_client)

    except Exception as e:
        print(f"❌ AI Error: {e}")
        ai_reply = f"Sorry, I ran into an error while processing your request: {e}"
        audio_data_uri = ""

    # 📤 Send both the raw markdown text AND the audio string up to MERN
    print("📤 Routing text and audio assets back to MERN backend...")
    await sio.emit('agent_response', {
        'reply': ai_reply,
        'audioData': audio_data_uri, // New variable key!
        'userSocketId': user_socket_id
    })
    
    await sio.emit('agent_status_change', {'status': 'idle', 'userSocketId': user_socket_id})

async def main():
    try:
        await sio.connect('http://localhost:5000')
        await sio.wait()
    except Exception as e:
        print(f"\n⚠️ Connection failed: {e}")

if __name__ == '__main__':
    asyncio.run(main())
