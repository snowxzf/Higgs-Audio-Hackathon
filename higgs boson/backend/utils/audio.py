import base64
import os
import subprocess
from boson_client import client

def encode_audio(file_path: str) -> str:
    """Convert audio file to base64."""
    with open(file_path, "rb") as f:
        return base64.b64encode(f.read()).decode("utf-8")

def get_audio_duration(file_path: str) -> float:
    """Get the duration of an audio file in seconds."""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
            "-of", "csv=p=0", file_path
        ], capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception as e:
        print(f"Error getting audio duration: {e}")
        return 0.0

def split_audio_file(file_path: str, max_duration: int = 60) -> list:
    """
    Split a long audio file into smaller chunks.
    
    Args:
        file_path (str): Path to the audio file
        max_duration (int): Maximum duration per chunk in seconds
        
    Returns:
        list: List of paths to the split audio files
    """
    duration = get_audio_duration(file_path)
    if duration <= max_duration:
        return [file_path]
    
    base_name = os.path.splitext(file_path)[0]
    extension = os.path.splitext(file_path)[1]
    output_dir = os.path.dirname(file_path)
    chunk_files = []
    
    num_chunks = int(duration // max_duration) + 1
    
    for i in range(num_chunks):
        start_time = i * max_duration
        chunk_file = os.path.join(output_dir, f"{os.path.basename(base_name)}_chunk_{i+1}{extension}")
        
        try:
            subprocess.run([
                "ffmpeg", "-i", file_path, "-ss", str(start_time), 
                "-t", str(max_duration), "-c", "copy", chunk_file, "-y"
            ], check=True, capture_output=True)
            chunk_files.append(chunk_file)
        except Exception as e:
            print(f"Error creating chunk {i+1}: {e}")
    
    return chunk_files

def transcribe_long_audio(file_path: str, max_tokens=4096, max_chunk_duration=90):
    """
    Transcribe a potentially long audio file by splitting it if necessary.
    
    Args:
        file_path (str): Path to the audio file
        max_tokens (int): Maximum tokens per transcription request
        max_chunk_duration (int): Maximum duration per chunk in seconds
        
    Returns:
        str: Complete transcription
    """
    duration = get_audio_duration(file_path)
    
    if duration <= max_chunk_duration:
        # File is short enough, transcribe directly
        return transcribe_audio(file_path, max_tokens)
    
    # File is too long, split it
    print(f"Audio file is {duration:.1f} seconds long, splitting into chunks...")
    chunk_files = split_audio_file(file_path, max_chunk_duration)
    
    transcriptions = []
    for i, chunk_file in enumerate(chunk_files):
        print(f"Transcribing chunk {i+1}/{len(chunk_files)}...")
        try:
            chunk_transcription = transcribe_audio(chunk_file, max_tokens)
            transcriptions.append(chunk_transcription)
        except Exception as e:
            print(f"Error transcribing chunk {i+1}: {e}")
            transcriptions.append(f"[Error transcribing chunk {i+1}]")
    
    # Clean up chunk files
    for chunk_file in chunk_files:
        if chunk_file != file_path:  # Don't delete the original file
            try:
                os.remove(chunk_file)
            except Exception as e:
                print(f"Error removing chunk file {chunk_file}: {e}")
    
    # Combine transcriptions
    complete_transcription = " ".join(transcriptions)
    return complete_transcription

def transcribe_audio(file_path: str, max_tokens=4096):
    """Transcribe an audio file using multiple fallback methods."""
    print(f"🎤 Transcribing audio: {file_path}")
    
    # Method 1: Try Higgs Audio Understanding
    try:
        print("📝 Method 1: Trying Higgs Audio Understanding...")
        audio_b64 = encode_audio(file_path)
        fmt = file_path.split(".")[-1].lower()

        response = client.chat.completions.create(
            model="higgs-audio-understanding-Hackathon",
            messages=[
                {"role": "system", "content": "You are a professional audio transcriptionist. Transcribe this audio file COMPLETELY from start to finish.\n\nCRITICAL OUTPUT REQUIREMENTS:\n- Output ONLY the transcribed lyrics\n- Do NOT include any explanations, analysis, or metadata\n- Do NOT include phrases like 'Here is the transcription' or 'The lyrics are'\n- Do NOT include any text that is not part of the actual song lyrics\n- Transcribe EVERY SINGLE WORD from beginning to end\n- Include ALL lyrics, verses, choruses, and repetitions\n- If any part is unclear, mark it as [UNCLEAR] but continue\n- Preserve the exact structure and line breaks\n- Return ONLY the clean lyrics, nothing else"},
                {"role": "user", "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {"data": audio_b64, "format": fmt}
                    }
                ]},
            ],
            max_completion_tokens=8192,
            temperature=0.0,
        )

        transcription = response.choices[0].message.content.strip()
        if transcription and len(transcription) > 10:  # Basic validation
            print("✅ Higgs Audio Understanding successful!")
            return clean_transcription_output(transcription)
        else:
            print("⚠️ Higgs Audio Understanding returned empty/short result")
            raise Exception("Empty transcription result")
            
    except Exception as e:
        print(f"❌ Higgs Audio Understanding failed: {e}")
    
    # Method 2: Try Whisper via Boson AI
    try:
        print("📝 Method 2: Trying Whisper via Boson AI...")
        audio_b64 = encode_audio(file_path)
        fmt = file_path.split(".")[-1].lower()

        response = client.chat.completions.create(
            model="whisper-1",
            messages=[
                {"role": "system", "content": "Transcribe this audio completely and accurately.\n\nCRITICAL OUTPUT REQUIREMENTS:\n- Output ONLY the transcribed lyrics\n- Do NOT include any explanations or metadata\n- Do NOT include phrases like 'Here is the transcription'\n- Include ALL lyrics from beginning to end\n- Do not truncate or abbreviate\n- Return ONLY the clean lyrics, nothing else"},
                {"role": "user", "content": [
                    {
                        "type": "input_audio",
                        "input_audio": {"data": audio_b64, "format": fmt}
                    }
                ]},
            ],
            max_completion_tokens=4096,
            temperature=0.0,
        )

        transcription = response.choices[0].message.content.strip()
        if transcription and len(transcription) > 10:
            print("✅ Whisper transcription successful!")
            return clean_transcription_output(transcription)
        else:
            print("⚠️ Whisper returned empty/short result")
            raise Exception("Empty transcription result")
            
    except Exception as e:
        print(f"❌ Whisper transcription failed: {e}")
    
    # Method 3: Try local Whisper (if available)
    try:
        print("📝 Method 3: Trying local Whisper...")
        import whisper
        
        model = whisper.load_model("base")
        result = model.transcribe(file_path)
        transcription = result["text"].strip()
        
        if transcription and len(transcription) > 10:
            print("✅ Local Whisper successful!")
            return transcription
        else:
            print("⚠️ Local Whisper returned empty/short result")
            raise Exception("Empty transcription result")
            
    except ImportError:
        print("⚠️ Local Whisper not available (pip install openai-whisper)")
    except Exception as e:
        print(f"❌ Local Whisper failed: {e}")
    
    # Method 4: Fallback - return a placeholder with file info
    print("📝 Method 4: Using fallback transcription...")
    duration = get_audio_duration(file_path)
    fallback_text = f"[AUDIO TRANSCRIPTION NEEDED]\nFile: {os.path.basename(file_path)}\nDuration: {duration:.1f} seconds\n\nThis audio file needs manual transcription or the transcription service needs to be fixed.\n\nFor now, you can use this placeholder text for testing the translation pipeline."
    
    print("⚠️ All transcription methods failed, using fallback")
    return fallback_text

def clean_transcription_output(text):
    """
    Clean transcription output to remove any extra text or metadata.
    
    Args:
        text (str): Raw transcription output
        
    Returns:
        str: Clean transcription with only lyrics
    """
    lines = text.split('\n')
    clean_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip empty lines
        if not line:
            continue
        # Skip lines that look like metadata or explanations
        if any(phrase in line.lower() for phrase in [
            'transcription:', 'here is', 'here are', 'the lyrics', 'the song',
            'this is', 'audio file', 'duration:', 'file:', 'transcribed',
            'original:', 'source:', 'target:', 'language:', 'analysis:',
            'reasoning:', 'thinking:', 'okay', 'let me', 'i need to'
        ]):
            continue
        # Skip lines that start with common analysis phrases
        if line.startswith(('I ', 'The ', 'This ', 'In ', 'For ', 'To ', 'With ', 'Okay', 'Let')):
            continue
        # Keep the line if it looks like actual lyrics
        clean_lines.append(line)
    
    return '\n'.join(clean_lines)

def manual_transcribe_for_testing():
    """
    Manual transcription for testing purposes.
    This is the actual lyrics from the sample song.
    """
    return """I go out to work on Monday morning
Tuesday I go off to honeymoon
I'll be back again before it's time for sundown
I'll be lazing on Sunday afternoon
Bicycling on every Wednesday afternoon"""
