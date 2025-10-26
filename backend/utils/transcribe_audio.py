#!/usr/bin/env python3
"""
Simple audio transcription script
Calls the actual transcription functions from your backend
"""

import sys
import os
import json
import subprocess
from pathlib import Path

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

def get_audio_duration(file_path):
    """Get audio duration using ffprobe"""
    try:
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
            '-of', 'default=noprint_wrappers=1:nokey=1', file_path
        ], capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except:
        return 0.0


def translate_text(text, from_lang, to_lang):
    """Translate text using a real translation API"""
    try:
        # Import OpenAI client for translation
        import openai
        from dotenv import load_dotenv
        
        # Load environment variables
        load_dotenv()
        
        # Initialize OpenAI client
        client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url="https://hackathon.boson.ai/v1"
        )
        
        # Create translation prompt
        translation_prompt = f"""Translate the following text from {from_lang} to {to_lang}. 
        Keep the same meaning and tone.

        Text to translate: {text}

        Translation:"""
        
        # Call the translation API
        response = client.chat.completions.create(
            model="Qwen3-32B-thinking-Hackathon",
            messages=[
                {"role": "system", "content": "You are a professional translator. Translate the given text accurately while preserving the original meaning and tone."},
                {"role": "user", "content": translation_prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        translated_text = response.choices[0].message.content.strip()
        print(f"Translation successful: {from_lang} -> {to_lang}", file=sys.stderr)
        return translated_text
        
    except Exception as e:
        print(f"Translation failed: {e}", file=sys.stderr)
        # Fallback: return placeholder
        return f"[Translation to {to_lang} failed] {text}"


def transcribe_audio_file(file_path, input_language=None, output_language=None):
    """Transcribe audio file using the actual transcription functions"""
    try:
        # Import the actual transcription functions
        from audio_processing import process_song
        
        # Get output directory
        output_dir = os.path.join(os.path.dirname(__file__), 'backend', 'outputs')
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"Transcribing: {file_path}", file=sys.stderr)
        if input_language:
            print(f"Input language: {input_language}", file=sys.stderr)
        if output_language:
            print(f"Output language: {output_language}", file=sys.stderr)
        
        # Process the song (separate vocals/background and transcribe)
        vocals_path, background_path, transcription = process_song(file_path)
        
        if not vocals_path or not background_path:
            raise Exception("Audio separation failed")
        
        # Get audio duration
        duration = get_audio_duration(file_path)
        
        # Use provided input language or default to "Unknown"
        detected_language = input_language if input_language else "Unknown"
        
        # Translate if needed
        translated_text = None
        if output_language and output_language != detected_language:
            translated_text = translate_text(transcription, detected_language, output_language)
        
        # Return results
        result = {
            "success": True,
            "transcription": transcription,
            "translated_transcription": translated_text,
            "detectedLanguage": detected_language,
            "duration": duration,
            "vocals_path": str(vocals_path) if vocals_path else None,
            "background_path": str(background_path) if background_path else None
        }
        
        return result
        
    except Exception as e:
        print(f"Error transcribing audio: {e}", file=sys.stderr)
        return {
            "success": False,
            "error": str(e),
            "transcription": "TRANSCRIPTION_FAILED",
            "detectedLanguage": input_language if input_language else "Unknown",
            "duration": 0
        }

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python transcribe_audio.py <audio_file_path> [input_language] [output_language]")
        sys.exit(1)
    
    file_path = sys.argv[1]
    input_language = sys.argv[2] if len(sys.argv) > 2 else None
    output_language = sys.argv[3] if len(sys.argv) > 3 else None
    
    if not os.path.exists(file_path):
        result = {
            "success": False,
            "error": f"File not found: {file_path}",
            "transcription": "TRANSCRIPTION_FAILED",
            "detectedLanguage": input_language if input_language else "Unknown",
            "duration": 0
        }
    else:
        result = transcribe_audio_file(file_path, input_language, output_language)
    
    # Output JSON result
    print(json.dumps(result, indent=2))
