#!/usr/bin/env python3
"""
Smart Audio Chunking
Intelligently splits audio at natural speech boundaries and silence detection.
"""

import os
import subprocess
import numpy as np
import librosa
from typing import List, Tuple

def detect_speech_boundaries(audio_path: str, silence_threshold: float = 0.01, min_silence_duration: float = 1.0) -> List[Tuple[float, float]]:
    """
    Detect natural speech boundaries in audio.
    
    Args:
        audio_path: Path to audio file
        silence_threshold: Volume threshold below which is considered silence
        min_silence_duration: Minimum duration of silence to consider a boundary
        
    Returns:
        List of (start_time, end_time) tuples for speech segments
    """
    try:
        # Load audio
        y, sr = librosa.load(audio_path, sr=None)
        
        # Detect silence
        silence_frames = librosa.effects.split(y, top_db=20, frame_length=2048, hop_length=512)
        
        # Convert frames to time
        silence_times = [(frame[0] / sr, frame[1] / sr) for frame in silence_frames]
        
        # Find speech segments (between silence)
        speech_segments = []
        current_start = 0
        
        for silence_start, silence_end in silence_times:
            if silence_start - current_start > 0.5:  # Only if speech segment is meaningful
                speech_segments.append((current_start, silence_start))
            current_start = silence_end
            
        # Add final segment if there's speech after last silence
        if current_start < len(y) / sr - 0.5:
            speech_segments.append((current_start, len(y) / sr))
            
        return speech_segments
        
    except Exception as e:
        print(f"⚠️ Speech boundary detection failed: {e}")
        return []

def smart_chunk_audio(file_path: str, max_duration: int = 45) -> List[str]:
    """
    Intelligently chunk audio at natural speech boundaries.
    
    Args:
        file_path: Path to audio file
        max_duration: Maximum duration per chunk in seconds
        
    Returns:
        List of paths to chunk files
    """
    duration = get_audio_duration(file_path)
    if duration <= max_duration:
        return [file_path]
    
    print(f"🎯 Smart chunking audio ({duration:.1f}s) at natural boundaries...")
    
    # Detect speech boundaries
    speech_segments = detect_speech_boundaries(file_path)
    
    if not speech_segments:
        print("⚠️ Could not detect speech boundaries, using time-based chunking")
        return time_based_chunk(file_path, max_duration)
    
    print(f"📝 Detected {len(speech_segments)} speech segments")
    
    # Group segments into chunks
    chunks = []
    current_chunk_segments = []
    current_chunk_duration = 0
    
    base_name = os.path.splitext(file_path)[0]
    extension = os.path.splitext(file_path)[1]
    output_dir = os.path.dirname(file_path)
    
    chunk_index = 1
    
    for start_time, end_time in speech_segments:
        segment_duration = end_time - start_time
        
        # If adding this segment would exceed max_duration, create a chunk
        if current_chunk_duration + segment_duration > max_duration and current_chunk_segments:
            # Create chunk from current segments
            chunk_file = create_chunk_from_segments(file_path, current_chunk_segments, chunk_index, output_dir, base_name, extension)
            if chunk_file:
                chunks.append(chunk_file)
                chunk_index += 1
            
            # Start new chunk
            current_chunk_segments = [segment]
            current_chunk_duration = segment_duration
        else:
            # Add segment to current chunk
            current_chunk_segments.append((start_time, end_time))
            current_chunk_duration += segment_duration
    
    # Create final chunk if there are remaining segments
    if current_chunk_segments:
        chunk_file = create_chunk_from_segments(file_path, current_chunk_segments, chunk_index, output_dir, base_name, extension)
        if chunk_file:
            chunks.append(chunk_file)
    
    print(f"✅ Created {len(chunks)} smart chunks")
    return chunks

def create_chunk_from_segments(file_path: str, segments: List[Tuple[float, float]], chunk_index: int, output_dir: str, base_name: str, extension: str) -> str:
    """Create a chunk file from multiple segments."""
    try:
        chunk_file = os.path.join(output_dir, f"{os.path.basename(base_name)}_smart_chunk_{chunk_index}{extension}")
        
        # Calculate total duration
        total_duration = sum(end - start for start, end in segments)
        
        if total_duration < 0.5:  # Skip very short chunks
            return None
            
        # Create filter complex for multiple segments
        filter_parts = []
        for i, (start, end) in enumerate(segments):
            filter_parts.append(f"[0:a]atrim=start={start}:end={end},asetpts=PTS-STARTPTS[a{i}]")
        
        # Concatenate segments
        concat_parts = "".join(f"[a{i}]" for i in range(len(segments)))
        concat_filter = f"{concat_parts}concat=n={len(segments)}:v=0:a=1[out]"
        
        filter_complex = ";".join(filter_parts) + ";" + concat_filter
        
        cmd = [
            'ffmpeg', '-y',
            '-i', file_path,
            '-filter_complex', filter_complex,
            '-map', '[out]',
            chunk_file
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        if result.returncode == 0:
            print(f"✅ Created smart chunk {chunk_index}: {total_duration:.1f}s")
            return chunk_file
        else:
            print(f"❌ Failed to create chunk {chunk_index}: {result.stderr}")
            return None
            
    except Exception as e:
        print(f"❌ Error creating chunk {chunk_index}: {e}")
        return None

def time_based_chunk(file_path: str, max_duration: int) -> List[str]:
    """Fallback to simple time-based chunking."""
    duration = get_audio_duration(file_path)
    base_name = os.path.splitext(file_path)[0]
    extension = os.path.splitext(file_path)[1]
    output_dir = os.path.dirname(file_path)
    chunk_files = []
    
    num_chunks = int(duration // max_duration) + 1
    
    for i in range(num_chunks):
        start_time = i * max_duration
        chunk_file = os.path.join(output_dir, f"{os.path.basename(base_name)}_time_chunk_{i+1}{extension}")
        
        try:
            subprocess.run([
                'ffmpeg', '-y',
                '-i', file_path,
                '-ss', str(start_time),
                '-t', str(max_duration),
                chunk_file
            ], check=True, capture_output=True)
            chunk_files.append(chunk_file)
        except subprocess.CalledProcessError:
            break
    
    return chunk_files

def get_audio_duration(file_path: str) -> float:
    """Get audio duration in seconds."""
    try:
        result = subprocess.run([
            "ffprobe", "-v", "quiet", "-show_entries", "format=duration",
            "-of", "csv=p=0", file_path
        ], capture_output=True, text=True, check=True)
        return float(result.stdout.strip())
    except Exception:
        return 0.0

def test_smart_chunking():
    """Test the smart chunking system."""
    print("🧪 Testing Smart Audio Chunking")
    print("=" * 40)
    
    # Test with jojos vocals
    vocals_path = "simple_reverse_results/audio_separation/vocals.wav"
    
    if not os.path.exists(vocals_path):
        print(f"❌ Vocals file not found: {vocals_path}")
        return
    
    chunks = smart_chunk_audio(vocals_path, max_duration=45)
    
    print(f"\n📁 Created {len(chunks)} chunks:")
    for i, chunk in enumerate(chunks, 1):
        duration = get_audio_duration(chunk)
        print(f"   Chunk {i}: {os.path.basename(chunk)} ({duration:.1f}s)")

if __name__ == "__main__":
    test_smart_chunking()
