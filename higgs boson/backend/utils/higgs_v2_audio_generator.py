#!/usr/bin/env python3
"""
Higgs V2 Audio Generator using the official Boson AI example.
This module implements voice cloning and generation using Higgs Audio V2.
"""

import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class HiggsV2AudioGenerator:
    def __init__(self):
        """Initialize the Higgs V2 Audio Generator."""
        self.BOSON_API_KEY = os.getenv("BOSON_API_KEY")
        if not self.BOSON_API_KEY:
            raise ValueError("BOSON_API_KEY environment variable not set")
        
        self.client = OpenAI(
            api_key=self.BOSON_API_KEY, 
            base_url="https://hackathon.boson.ai/v1"
        )
        self.model = "higgs-audio-generation-Hackathon"
        
        # System prompt for voice generation
        self.system_prompt = (
            "You are an AI assistant designed to convert text into speech.\n"
            "If the user's message includes a [SPEAKER*] tag, do not read out the tag and generate speech for the following text, using the specified voice.\n"
            "If no speaker tag is present, select a suitable voice on your own.\n\n"
            "<|scene_desc_start|>\nAudio is recorded from a quiet room.\n<|scene_desc_end|>"
        )
    
    def b64(self, path):
        """Convert audio file to base64."""
        with open(path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    
    def clone_voice_simple(self, reference_audio_path, text_to_clone, output_path):
        """
        Clone a voice from a reference audio and generate speech for the given text.
        Based on the official Boson AI example.
        """
        print(f"🎤 Cloning voice from {reference_audio_path}")
        print(f"📝 Text to clone: '{text_to_clone[:50]}...'")
        
        if not os.path.exists(reference_audio_path):
            raise FileNotFoundError(f"Reference audio file not found: {reference_audio_path}")
        
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": self.system_prompt},
                    {"role": "user", "content": f"[SPEAKER1] {text_to_clone}"},
                    {
                        "role": "assistant",
                        "content": [{
                            "type": "input_audio",
                            "input_audio": {"data": self.b64(reference_audio_path), "format": "wav"}
                        }],
                    },
                    {"role": "user", "content": f"[SPEAKER1] {text_to_clone}"},
                ],
                modalities=["text", "audio"],
                max_completion_tokens=4096,
                temperature=1.0,
                top_p=0.95,
                stream=False,
                stop=["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"],
                extra_body={"top_k": 50},
            )
            
            audio_b64 = resp.choices[0].message.audio.data
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the generated audio
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(audio_b64))
            
            print(f"✅ Voice cloned and saved to: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Voice cloning failed: {e}")
            return None
    
    def generate_singing_voice(self, reference_vocals_path, lyrics, output_path):
        """
        Generate singing voice using reference vocals with improved timing control.
        """
        print(f"🎵 Generating singing voice from {reference_vocals_path}")
        print(f"📝 Lyrics: '{lyrics[:50]}...'")
        
        if not os.path.exists(reference_vocals_path):
            raise FileNotFoundError(f"Reference vocals file not found: {reference_vocals_path}")
        
        # Split lyrics into shorter chunks for better timing control
        lyrics_lines = lyrics.split('\n')
        if len(lyrics_lines) > 4:  # If too many lines, take first few
            lyrics = '\n'.join(lyrics_lines[:4])
            print(f"📝 Using first 4 lines for timing control: '{lyrics[:50]}...'")
        
        # Enhanced system prompt for singing with timing control
        singing_system_prompt = (
            "You are an AI assistant designed to convert text into singing voice.\n"
            "Generate natural singing with appropriate melody, rhythm, and emotion.\n"
            "IMPORTANT: Match the timing and pace of the reference audio. Do not generate overly long audio.\n"
            "Keep the singing concise and match the original vocal timing.\n"
            "If the user's message includes a [SPEAKER*] tag, do not read out the tag and generate singing for the following text, using the specified voice.\n"
            "Maintain the musical flow and emotional expression of the original voice.\n\n"
            "<|scene_desc_start|>\nAudio is recorded from a quiet room with musical context. Keep timing natural and concise.\n<|scene_desc_end|>"
        )
        
        try:
            resp = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": singing_system_prompt},
                    {"role": "user", "content": f"[SPEAKER1] {lyrics}"},
                    {
                        "role": "assistant",
                        "content": [{
                            "type": "input_audio",
                            "input_audio": {"data": self.b64(reference_vocals_path), "format": "wav"}
                        }],
                    },
                    {"role": "user", "content": f"[SPEAKER1] {lyrics}"},
                ],
                modalities=["text", "audio"],
                max_completion_tokens=1024,  # Further reduced for shorter audio
                temperature=0.7,  # Lower temperature for more consistent timing
                top_p=0.95,
                stream=False,
                stop=["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"],
                extra_body={"top_k": 50},
            )
            
            audio_b64 = resp.choices[0].message.audio.data
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            # Save the generated audio
            with open(output_path, "wb") as f:
                f.write(base64.b64decode(audio_b64))
            
            print(f"✅ Singing voice generated and saved to: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Singing voice generation failed: {e}")
            return None

def test_higgs_v2_generation():
    """Test the Higgs V2 audio generation."""
    print("🧪 Testing Higgs V2 Audio Generation")
    print("=" * 50)
    
    try:
        generator = HiggsV2AudioGenerator()
        
        # Test with simple voice cloning
        reference_audio = "output_stems/final/sample1_vocals.wav"
        if not os.path.exists(reference_audio):
            print(f"❌ Reference audio file not found: {reference_audio}")
            print("Please run the pipeline first to generate vocals.")
            return
        
        # Test 1: Simple voice cloning
        print("\n🎤 Test 1: Simple Voice Cloning")
        test_text = "Welcome to Boson AI's voice generation system. We are excited to help you create amazing audio experiences."
        output_file = "generated_vocals/simple_voice_clone.wav"
        
        result = generator.clone_voice_simple(reference_audio, test_text, output_file)
        if result:
            print(f"✅ Simple voice cloning test successful!")
        else:
            print(f"❌ Simple voice cloning test failed!")
        
        # Test 2: Singing voice generation (very short lyrics for better timing)
        print("\n🎵 Test 2: Singing Voice Generation (Very Short)")
        test_lyrics = "Me levanto a trabajar el lunes por la mañana"
        
        singing_output = "generated_vocals/singing_voice_test.wav"
        result = generator.generate_singing_voice(reference_audio, test_lyrics, singing_output)
        if result:
            print(f"✅ Singing voice generation test successful!")
        else:
            print(f"❌ Singing voice generation test failed!")
        
    except ValueError as e:
        print(f"❌ Setup failed: {e}")
        print("Please ensure BOSON_API_KEY is set in your environment.")
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_higgs_v2_generation()
