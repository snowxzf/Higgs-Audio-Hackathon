#!/usr/bin/env python3
"""
Modular Audio Generation Functions using Higgs V2
Separate functions for easier testing and debugging.
"""

import os
import base64
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()

class ModularVoiceGenerator:
    def __init__(self):
        self.client = OpenAI(
            api_key=os.getenv("BOSON_API_KEY"),
            base_url="https://hackathon.boson.ai/v1"
        )
        self.model = "higgs-audio-v2-generation-3B-sft-Hackathon"
        
        # System prompt for voice generation (using the working approach)
        self.system_prompt = (
            "You are an AI assistant designed to convert text into speech.\n"
            "Generate speech using the provided reference voice.\n\n"
            "<|scene_desc_start|>\nAudio is recorded from a quiet room.\n<|scene_desc_end|>"
        )
    
    def b64_encode(self, file_path):
        """Convert audio file to base64."""
        with open(file_path, "rb") as f:
            return base64.b64encode(f.read()).decode("utf-8")
    
    def generate_english_voice(self, english_text: str, reference_audio_path: str, output_path: str):
        """
        Generate English voice reading the translated text using Higgs V2.
        
        Args:
            english_text: The English translation to read
            reference_audio_path: Path to the original vocals for voice cloning
            output_path: Where to save the generated voice
        """
        print(f"🎤 Generating English voice with Higgs V2...")
        print(f"📝 Text: {english_text[:100]}...")
        print(f"🎵 Reference: {reference_audio_path}")
        
        if not os.path.exists(reference_audio_path):
            print(f"❌ Reference audio file not found: {reference_audio_path}")
            return False
        
        try:
            # Create the proper API request using the WORKING approach
            messages = [
                {"role": "system", "content": self.system_prompt},
                {
                    "role": "user",
                    "content": [{
                        "type": "input_audio",
                        "input_audio": {"data": self.b64_encode(reference_audio_path), "format": "wav"}
                    }],
                },
                {"role": "user", "content": english_text},
            ]
            
            response = self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                modalities=["text", "audio"],
                max_completion_tokens=4096,
                temperature=1.0,
                top_p=0.95,
                stream=False,
                stop=["<|eot_id|>", "<|end_of_text|>", "<|audio_eos|>"],
                extra_body={"top_k": 50},
            )
            
            # Save the generated audio
            if response.choices[0].message.audio and response.choices[0].message.audio.data:
                audio_data = base64.b64decode(response.choices[0].message.audio.data)
                
                # Ensure output directory exists
                os.makedirs(os.path.dirname(output_path), exist_ok=True)
                
                # Save raw audio first
                temp_path = output_path.replace('.wav', '_temp.wav')
                with open(temp_path, "wb") as f:
                    f.write(audio_data)
                
                # Amplify the audio (the generated audio is often very quiet)
                import subprocess
                try:
                    subprocess.run([
                        'ffmpeg', '-y',
                        '-i', temp_path,
                        '-af', 'volume=20dB',  # Amplify by 20dB
                        output_path
                    ], check=True, capture_output=True)
                    
                    # Remove temp file
                    os.remove(temp_path)
                    
                except subprocess.CalledProcessError:
                    # If amplification fails, just copy the original
                    import shutil
                    shutil.copy2(temp_path, output_path)
                    os.remove(temp_path)
                
                print(f"✅ English voice generated and amplified: {output_path}")
                return True
            else:
                print("❌ No audio content in response")
                return False
                
        except Exception as e:
            print(f"❌ Voice generation failed: {e}")
            return False
    
    def test_voice_generation(self):
        """Test voice generation with jojos data."""
        print("🧪 Testing Voice Generation")
        print("=" * 40)
        
        # Paths
        english_text_path = "enhanced_reverse_results/translations/english_translation.txt"
        reference_vocals_path = "enhanced_reverse_results/audio_separation/vocals.wav"
        output_path = "enhanced_reverse_results/generated_voices/english_voice.wav"
        
        # Check if files exist
        if not os.path.exists(english_text_path):
            print(f"❌ English translation not found: {english_text_path}")
            return False
            
        if not os.path.exists(reference_vocals_path):
            print(f"❌ Reference vocals not found: {reference_vocals_path}")
            return False
        
        # Read English translation
        with open(english_text_path, 'r', encoding='utf-8') as f:
            english_text = f.read().strip()
        
        # Clean the text (remove reasoning tags)
        english_text = self._clean_text(english_text)
        
        print(f"📖 English text: {english_text[:200]}...")
        
        # Create output directory
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Generate voice
        success = self.generate_english_voice(english_text, reference_vocals_path, output_path)
        
        if success:
            print(f"🎉 Voice generation test completed!")
            print(f"📁 Output: {output_path}")
        else:
            print("❌ Voice generation test failed")
        
        return success
    
    def _clean_text(self, text: str) -> str:
        """Clean text by removing reasoning tags and extra content."""
        lines = text.split('\n')
        clean_lines = []
        
        for line in lines:
            line = line.strip()
            if line and not line.startswith('<think>') and not line.startswith('</think>'):
                clean_lines.append(line)
        
        return '\n'.join(clean_lines)

def test_voice_generation():
    """Test the voice generation function."""
    generator = ModularVoiceGenerator()
    return generator.test_voice_generation()

if __name__ == "__main__":
    test_voice_generation()
