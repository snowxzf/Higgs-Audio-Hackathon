#!/usr/bin/env python3
"""
English Voice Generator
Generates English voice using the working simple_voice_clone approach.
"""

import os
import sys
import base64
import subprocess
from openai import OpenAI
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

class EnglishVoiceGenerator:
    def __init__(self):
        """Initialize the English voice generator."""
        self.BOSON_API_KEY = os.getenv("BOSON_API_KEY")
        if not self.BOSON_API_KEY:
            raise ValueError("BOSON_API_KEY environment variable not set")
        
        self.client = OpenAI(
            api_key=self.BOSON_API_KEY, 
            base_url="https://hackathon.boson.ai/v1"
        )
        self.model = "higgs-audio-generation-Hackathon"
    
    def b64(self, path):
        """Convert audio file to base64."""
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    
    def get_audio_duration(self, audio_path):
        """Get the duration of an audio file."""
        try:
            cmd = [
                'ffprobe', '-v', 'quiet',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                audio_path
            ]
            result = subprocess.run(cmd, capture_output=True, text=True)
            if result.returncode == 0:
                return float(result.stdout.strip())
            return None
        except Exception:
            return None
    
    def trim_audio_to_content(self, input_path, output_path, max_duration=30.0):
        """Trim audio to reasonable duration to cut off random noise."""
        try:
            cmd = [
                'ffmpeg', '-y',  # Overwrite output
                '-i', input_path,
                '-t', str(max_duration),  # Trim to max_duration seconds
                '-c', 'copy',  # Copy without re-encoding
                output_path
            ]
            
            result = subprocess.run(cmd, capture_output=True, text=True)
            return result.returncode == 0
        except Exception:
            return False
    
    def generate_english_voice(self, reference_audio_path, english_lyrics, output_path):
        """
        Generate English voice using the EXACT same approach as simple_voice_clone.wav.
        """
        print(f"🇺🇸 Generating English voice from {reference_audio_path}")
        print(f"📝 English lyrics: '{english_lyrics[:50]}...'")
        
        if not os.path.exists(reference_audio_path):
            raise FileNotFoundError(f"Reference audio file not found: {reference_audio_path}")
        
        # Use the EXACT same system prompt as the working simple_voice_clone
        system_prompt = (
            "You are an AI assistant designed to convert text into speech.\n"
            "You are reading English text. Pronounce English words naturally with proper English pronunciation, accent, and rhythm.\n"
            "If the user's message includes a [SPEAKER*] tag, do not read out the tag and generate speech for the following text, using the specified voice.\n"
            "Speak English naturally with authentic English pronunciation and intonation.\n\n"
            "<|scene_desc_start|>\nAudio is recorded from a quiet room. Reading English text with natural English pronunciation.\n<|scene_desc_end|>"
        )
        
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"[SPEAKER1] {english_lyrics}"},
                    {
                        "role": "assistant",
                        "content": [{
                            "type": "input_audio",
                            "input_audio": {"data": self.b64(reference_audio_path), "format": "wav"}
                        }],
                    },
                    {"role": "user", "content": f"[SPEAKER1] {english_lyrics}"},
                ],
                modalities=["text", "audio"],
                max_completion_tokens=4096,  # Same as working version
                temperature=1.0,  # Same as working version
                top_p=0.95,  # Same as working version
                stream=False,
                stop=["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"],
                extra_body={"top_k": 50},  # Same as working version
            )
            
            audio_b64 = resp.choices[0].message.audio.data
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the generated audio first
            temp_output = output_path.replace('.wav', '_temp.wav')
            with open(temp_output, "wb") as f:
                f.write(base64.b64decode(audio_b64))
            
            # Trim audio to cut off random noise (30 seconds max for English reading)
            print(f"✂️ Trimming audio to cut off random noise...")
            if self.trim_audio_to_content(temp_output, output_path, max_duration=30.0):
                os.remove(temp_output)  # Remove temp file
                print(f"✅ Audio trimmed successfully")
            else:
                # If trimming fails, just rename the temp file
                os.rename(temp_output, output_path)
                print(f"⚠️ Trimming failed, using original audio")
            
            # Check duration
            duration = self.get_audio_duration(output_path)
            if duration:
                print(f"📊 Generated audio duration: {duration:.1f} seconds")
            
            print(f"✅ English voice generated and saved to: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ English voice generation failed: {e}")
            return None

def test_english_voice_generator():
    """Test the English voice generator."""
    print("🧪 Testing English Voice Generator")
    print("=" * 50)
    
    generator = EnglishVoiceGenerator()
    
    # Test with English lyrics
    english_lyrics = "I go to work on Monday morning. Tuesday I go on honeymoon. I'll be back before sunset comes. I'll dress up on Sunday afternoon."
    
    # Use a sample reference audio (you'll need to provide this)
    reference_audio = "output_stems/final/sample1_vocals.wav"
    
    if not os.path.exists(reference_audio):
        print(f"❌ Reference audio file not found: {reference_audio}")
        print("Please run the audio separation first.")
        return
    
    output_file = "generated_vocals/english_voice_test.wav"
    
    result = generator.generate_english_voice(
        reference_audio_path=reference_audio,
        english_lyrics=english_lyrics,
        output_path=output_file
    )
    
    if result:
        print(f"✅ English voice generation test successful!")
        
        # Check final duration
        duration = generator.get_audio_duration(output_file)
        if duration:
            print(f"📊 Final audio duration: {duration:.1f} seconds")
            print("🇺🇸 Voice should read English clearly!")
    else:
        print(f"❌ English voice generation test failed!")

if __name__ == "__main__":
    test_english_voice_generator()
