#!/usr/bin/env python3
"""
FastAPI backend for Audio Translation and Karaoke App
Handles audio processing, lyrics synchronization, and API endpoints
"""

from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import sys
import json
from pathlib import Path

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'utils'))

from audio_processing import process_song, transcribe_vocals
from reverse_song_translator import ReverseSongTranslator

app = FastAPI(title="Audio Translation & Karaoke API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Pydantic models
class LyricsResponse(BaseModel):
    original_lyrics: list
    translated_lyrics: list
    audio_duration: float
    vocals_path: str
    background_path: str

class ProcessResponse(BaseModel):
    success: bool
    message: str
    vocals_path: str
    background_path: str
    lyrics: LyricsResponse = None

# Ensure output directories exist
UPLOAD_DIR = Path("uploads")
OUTPUT_DIR = Path("outputs")
UPLOAD_DIR.mkdir(exist_ok=True)
OUTPUT_DIR.mkdir(exist_ok=True)

@app.get("/")
async def root():
    return {"message": "Audio Translation & Karaoke API", "status": "running"}

@app.post("/process-audio", response_model=ProcessResponse)
async def process_audio(file: UploadFile = File(...)):
    """
    Process uploaded audio file for karaoke with synchronized lyrics
    """
    try:
        # Save uploaded file
        file_path = UPLOAD_DIR / file.filename
        with open(file_path, "wb") as buffer:
            content = await file.read()
            buffer.write(content)
        
        print(f"Processing audio file: {file_path}")
        
        # Process the song (separate vocals/background and transcribe)
        vocals_path, background_path, transcription = process_song(str(file_path), str(OUTPUT_DIR))
        
        if not vocals_path or not background_path:
            raise HTTPException(status_code=500, detail="Audio separation failed")
        
        # Get audio duration
        import subprocess
        try:
            result = subprocess.run([
                'ffprobe', '-v', 'error', '-show_entries', 'format=duration', 
                '-of', 'default=noprint_wrappers=1:nokey=1', str(file_path)
            ], capture_output=True, text=True, check=True)
            duration = float(result.stdout.strip())
        except:
            duration = 0.0
        
        # Create synchronized lyrics
        lyrics_response = None
        if transcription and transcription != "TRANSCRIPTION_FAILED":
            try:
                # Detect language and translate
                translator = ReverseSongTranslator()
                detected_language = translator.detect_language(transcription)
                
                if detected_language and detected_language.lower() != "english":
                    # Translate to English
                    english_translation = translator.translate_to_english(transcription, str(OUTPUT_DIR / "english_translation.txt"))
                    
                    # Create synchronized lyrics with timestamps
                    original_lyrics = create_timed_lyrics(transcription, duration)
                    translated_lyrics = create_timed_lyrics(english_translation, duration)
                    
                    lyrics_response = LyricsResponse(
                        original_lyrics=original_lyrics,
                        translated_lyrics=translated_lyrics,
                        audio_duration=duration,
                        vocals_path=str(vocals_path),
                        background_path=str(background_path)
                    )
                else:
                    # Already in English, create single language lyrics
                    english_lyrics = create_timed_lyrics(transcription, duration)
                    lyrics_response = LyricsResponse(
                        original_lyrics=english_lyrics,
                        translated_lyrics=english_lyrics,  # Same for English
                        audio_duration=duration,
                        vocals_path=str(vocals_path),
                        background_path=str(background_path)
                    )
            except Exception as e:
                print(f"Lyrics processing error: {e}")
                # Fallback: create basic lyrics without translation
                basic_lyrics = create_timed_lyrics(transcription, duration)
                lyrics_response = LyricsResponse(
                    original_lyrics=basic_lyrics,
                    translated_lyrics=basic_lyrics,
                    audio_duration=duration,
                    vocals_path=str(vocals_path),
                    background_path=str(background_path)
                )
        
        return ProcessResponse(
            success=True,
            message="Audio processed successfully",
            vocals_path=str(vocals_path),
            background_path=str(background_path),
            lyrics=lyrics_response
        )
        
    except Exception as e:
        print(f"Error processing audio: {e}")
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

def create_timed_lyrics(text: str, duration: float) -> list:
    """
    Create synchronized lyrics with timestamps
    """
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

@app.get("/download/{file_type}/{filename}")
async def download_file(file_type: str, filename: str):
    """
    Download processed audio files
    """
    file_path = OUTPUT_DIR / file_type / filename
    
    if not file_path.exists():
        raise HTTPException(status_code=404, detail="File not found")
    
    return FileResponse(
        path=str(file_path),
        filename=filename,
        media_type="audio/wav"
    )

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "API is running"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
