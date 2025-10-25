#!/usr/bin/env python3
"""
Voice Cloning Module using Official Boson AI Higgs Audio Generation
Based on the official GitHub example for voice cloning
"""

import os
import base64
from openai import OpenAI

class VoiceCloner:
    """
    Voice cloning using Boson AI's Higgs Audio Generation model.
    Uses the official API approach for reliable voice cloning.
    """
    
    def __init__(self):
        """Initialize the voice cloner with Boson AI client."""
        self.boson_api_key = "bai-983X8jWnN1Acm57MI3t-d4BqmxkDX_DxMyNAJQBJyB9WEyZ8"
        if not self.boson_api_key:
            raise ValueError("BOSON_API_KEY environment variable not set")
        
        self.client = OpenAI(
            api_key=self.boson_api_key, 
            base_url="https://hackathon.boson.ai/v1"
        )
        self.model = "higgs-audio-generation-Hackathon"
    
    def b64_encode(self, file_path):
        """Encode audio file to base64."""
        return base64.b64encode(open(file_path, "rb").read()).decode("utf-8")
    
    def clone_voice(self, reference_audio_path, reference_transcript, target_text, output_path):
        """
        Clone voice using reference audio and generate new speech.
        
        Args:
            reference_audio_path (str): Path to reference audio file
            reference_transcript (str): Transcript of the reference audio
            target_text (str): Text to generate in the cloned voice
            output_path (str): Path to save the generated audio
            
        Returns:
            str: Path to the generated audio file
        """
        try:
            print(f"🎤 Cloning voice from: {reference_audio_path}")
            print(f"📝 Target text: {target_text[:50]}...")
            
            # System prompt for voice cloning
            system_prompt = (
                "You are an AI assistant designed to convert text into speech.\n"
                "If the user's message includes a [SPEAKER1] tag, do not read out the tag and generate speech for the following text, using the specified voice.\n"
                "If no speaker tag is present, select a suitable voice on your own.\n\n"
                "<|scene_desc_start|>\nAudio is recorded from a quiet room.\n<|scene_desc_end|>"
            )
            
            # Create messages for voice cloning
            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": reference_transcript},
                {
                    "role": "assistant",
                    "content": [{
                        "type": "input_audio",
                        "input_audio": {"data": self.b64_encode(reference_audio_path), "format": "wav"}
                    }],
                },
                {"role": "user", "content": f"[SPEAKER1] {target_text}"},
            ]
            
            print("🎯 Generating cloned voice...")
            
            # Generate audio using Boson AI
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
            audio_b64 = response.choices[0].message.audio.data
            audio_data = base64.b64decode(audio_b64)
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, "wb") as f:
                f.write(audio_data)
            
            print(f"✅ Voice cloned successfully: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Voice cloning failed: {e}")
            return None
    
    def clone_voice_simple(self, reference_audio_path, target_text, output_path):
        """
        Simplified voice cloning without reference transcript.
        
        Args:
            reference_audio_path (str): Path to reference audio file
            target_text (str): Text to generate in the cloned voice
            output_path (str): Path to save the generated audio
            
        Returns:
            str: Path to the generated audio file
        """
        try:
            print(f"🎤 Simple voice cloning from: {reference_audio_path}")
            print(f"📝 Target text: {target_text[:50]}...")
            
            # System prompt for voice cloning
            system_prompt = (
                "You are an AI assistant designed to convert text into speech.\n"
                "Generate speech using the provided reference voice.\n\n"
                "<|scene_desc_start|>\nAudio is recorded from a quiet room.\n<|scene_desc_end|>"
            )
            
            # Create messages for voice cloning
            messages = [
                {"role": "system", "content": system_prompt},
                {
                    "role": "user",
                    "content": [{
                        "type": "input_audio",
                        "input_audio": {"data": self.b64_encode(reference_audio_path), "format": "wav"}
                    }],
                },
                {"role": "user", "content": target_text},
            ]
            
            print("🎯 Generating cloned voice...")
            
            # Generate audio using Boson AI
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
            audio_b64 = response.choices[0].message.audio.data
            audio_data = base64.b64decode(audio_b64)
            
            # Ensure output directory exists
            os.makedirs(os.path.dirname(output_path), exist_ok=True)
            
            with open(output_path, "wb") as f:
                f.write(audio_data)
            
            print(f"✅ Voice cloned successfully: {output_path}")
            return output_path
            
        except Exception as e:
            print(f"❌ Voice cloning failed: {e}")
            return None

def test_voice_cloning():
    """Test the voice cloning functionality."""
    print("🧪 Testing Voice Cloning")
    print("=" * 40)
    
    try:
        # Initialize voice cloner
        cloner = VoiceCloner()
        
        # Test files
        reference_audio = "output_stems/final/sample1_vocals.wav"
        target_text = "Welcome to Boson AI's voice generation system. This is a test of voice cloning."
        output_path = "generated_vocals/test_cloned_voice.wav"
        
        if not os.path.exists(reference_audio):
            print(f"❌ Reference audio not found: {reference_audio}")
            return False
        
        # Test simple voice cloning
        result = cloner.clone_voice_simple(reference_audio, target_text, output_path)
        
        if result:
            print(f"✅ Voice cloning test successful!")
            print(f"📁 Generated audio: {result}")
            return True
        else:
            print(f"❌ Voice cloning test failed!")
            return False
            
    except Exception as e:
        print(f"❌ Voice cloning test failed: {e}")
        return False

if __name__ == "__main__":
    test_voice_cloning()
