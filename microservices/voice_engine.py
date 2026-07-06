import os
import asyncio
import base64
import sounddevice as sd
import soundfile as sf
import edge_tts

def speak_text(text: str, groq_client=None) -> str:
    """Converts text into an MP3 file and returns it as a Base64 string wrapper for React."""
    print(f"🔊 Rendering audio text tracks...")
    try:
        output_file = "response.mp3"
        
        # Build the high-quality Edge TTS voice file
        communicate = edge_tts.Communicate(text, "en-US-EmmaMultilingualNeural")
        
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        loop.run_until_complete(communicate.save(output_file))
        loop.close()

        # Read the raw MP3 file and convert it into a Base64 string wrapper
        if os.path.exists(output_file):
            with open(output_file, "rb") as audio_file:
                encoded_string = base64.b64encode(audio_file.read()).decode('utf-8')
            
            # Clean up the physical file on the disk instantly
            os.remove(output_file)
            
            # Return it wrapped as an executable HTML5 Data URI string
            return f"data:audio/mp3;base64,{encoded_string}"
            
    except Exception as e:
        print(f"⚠️ Voice generation failed: {e}")
    return ""

def listen_to_microphone(groq_client) -> str:
    """Records microphone tracks using sounddevice."""
    SAMPLE_RATE = 16000
    DURATION = 4  
    FILENAME = "voice.wav"

    print("\n🎙️ Listening... Speak into your microphone now!")
    try:
        recording = sd.rec(int(DURATION * SAMPLE_RATE), samplerate=SAMPLE_RATE, channels=1, dtype='int16')
        sd.wait()  
        print("🛑 Recording stopped. Processing speech channels...")

        sf.write(FILENAME, recording, SAMPLE_RATE)

        with open(FILENAME, "rb") as file_asset:
            transcription = groq_client.audio.transcriptions.create(
                file=file_asset,
                model="whisper-large-v3-turbo",
                language="en"
            )
        
        if os.path.exists(FILENAME):
            os.remove(FILENAME)
            
        return transcription.text
    except Exception as e:
        print(f"⚠️ Speech-to-text failed: {e}")
        return ""
