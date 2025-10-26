#!/usr/bin/env python3
"""
Simple audio processing script for Node.js backend
Processes audio file and returns JSON with lyrics and timing
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

def create_timed_lyrics(text, duration):
    """Create synchronized lyrics with timestamps"""
    if not text or duration <= 0:
        return []
    
    # Split text into lines/phrases
    lines = [line.strip() for line in text.split('\n') if line.strip()]
    
    if not lines:
        return []
    
    # Calculate timing for each line
    time_per_line = duration / len(lines)
    
    timed_lyrics = []
    for i, line in enumerate(lines):
        start_time = i * time_per_line
        end_time = (i + 1) * time_per_line
        
        timed_lyrics.append({
            "text": line,
            "start": round(start_time, 2),
            "end": round(end_time, 2),
            "duration": round(time_per_line, 2)
        })
    
    return timed_lyrics

def detect_language_from_filename(filename):
    """Simple language detection based on filename"""
    filename_lower = filename.lower()
    
    if 'jojos' in filename_lower or 'japanese' in filename_lower:
        return 'Japanese'
    elif 'spanish' in filename_lower:
        return 'Spanish'
    elif 'french' in filename_lower:
        return 'French'
    elif 'german' in filename_lower:
        return 'German'
    elif 'italian' in filename_lower:
        return 'Italian'
    else:
        return 'Unknown'

def process_audio_file(file_path):
    """Process audio file and return results"""
    try:
        # Import the processing functions
        from audio_processing import process_song
        from reverse_song_translator import ReverseSongTranslator
        
        # Get output directory
        output_dir = os.path.join(os.path.dirname(__file__), 'backend', 'outputs')
        os.makedirs(output_dir, exist_ok=True)
        
        print(f"Processing: {file_path}")
        
        # Process the song (separate vocals/background and transcribe)
        vocals_path, background_path, transcription = process_song(file_path, output_dir)
        
        if not vocals_path or not background_path:
            raise Exception("Audio separation failed")
        
        # Get audio duration
        duration = get_audio_duration(file_path)
        
        # Detect language
        detected_language = detect_language_from_filename(os.path.basename(file_path))
        
        # Create synchronized lyrics
        original_lyrics = []
        translated_lyrics = []
        
        if transcription and transcription != "TRANSCRIPTION_FAILED":
            try:
                # Translate to English if not already English
                if detected_language.lower() != 'english' and detected_language != 'Unknown':
                    translator = ReverseSongTranslator()
                    english_translation = translator.translate_to_english(
                        transcription, 
                        os.path.join(output_dir, "english_translation.txt")
                    )
                    
                    original_lyrics = create_timed_lyrics(transcription, duration)
                    translated_lyrics = create_timed_lyrics(english_translation, duration)
                else:
                    # Already in English
                    english_lyrics = create_timed_lyrics(transcription, duration)
                    original_lyrics = english_lyrics
                    translated_lyrics = english_lyrics
                    
            except Exception as e:
                print(f"Translation error: {e}")
                # Fallback: create basic lyrics
                basic_lyrics = create_timed_lyrics(transcription, duration)
                original_lyrics = basic_lyrics
                translated_lyrics = basic_lyrics
        
        # Return results
        result = {
            "success": True,
            "message": "Audio processed successfully",
            "vocals_path": str(vocals_path) if vocals_path else None,
            "background_path": str(background_path) if background_path else None,
            "lyrics": {
                "original_lyrics": original_lyrics,
                "translated_lyrics": translated_lyrics,
                "audio_duration": duration,
                "detected_language": detected_language,
                "vocals_path": str(vocals_path) if vocals_path else None,
                "background_path": str(background_path) if background_path else None
            }
        }
        
        return result
        
    except Exception as e:
        print(f"Error processing audio: {e}")
        return {
            "success": False,
            "error": str(e),
            "message": "Audio processing failed"
        }

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: python process_audio_simple.py <audio_file_path>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    
    if not os.path.exists(file_path):
        result = {
            "success": False,
            "error": f"File not found: {file_path}",
            "message": "File not found"
        }
    else:
        result = process_audio_file(file_path)
    
    # Output JSON result
    print(json.dumps(result, indent=2))
