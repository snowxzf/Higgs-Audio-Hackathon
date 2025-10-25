import subprocess
from pydub import AudioSegment
import whisper
import os
import sys
import numpy as np
import soundfile as sf

# Paths
INPUT_FILE = "backend/utils/sample1.mp3"
OUTPUT_DIR = "output_stems"

# Ensure output directory exists
os.makedirs(OUTPUT_DIR, exist_ok=True)

def convert_mp3_to_wav(mp3_path):
    """Convert MP3 to WAV format for better compatibility with Demucs."""
    if not os.path.exists(mp3_path):
        raise FileNotFoundError(f"Input file not found: {mp3_path}")
    
    wav_path = mp3_path.rsplit(".", 1)[0] + ".wav"
    print(f"Converting {mp3_path} to {wav_path}")
    AudioSegment.from_mp3(mp3_path).export(wav_path, format="wav")
    return wav_path

def separate_with_demucs(wav_path):
    """
    Separates vocals and accompaniment using Demucs.
    Returns paths: (vocals_path, accompaniment_path)
    """
    if not os.path.exists(wav_path):
        raise FileNotFoundError(f"WAV file not found: {wav_path}")
    
    print(f"Separating audio with Demucs: {wav_path}")
    
    # Create a temporary directory for Demucs output
    temp_output_dir = os.path.join(OUTPUT_DIR, "temp")
    os.makedirs(temp_output_dir, exist_ok=True)
    
    try:
        # Try different Demucs models to avoid TorchCodec issues
        models_to_try = ["htdemucs", "mdx_extra", "mdx_q"]
        
        for model_name in models_to_try:
            print(f"Trying Demucs model: {model_name}")
            try:
                result = subprocess.run([
                    "demucs",
                    "-n", model_name,
                    "--two-stems=vocals",
                    "--device", "cpu",
                    wav_path,
                    "-o", temp_output_dir
                ], check=True, capture_output=True, text=True, timeout=300)
                
                print(f"Demucs processing completed successfully with {model_name}")
                break
                
            except subprocess.CalledProcessError as e:
                print(f"Demucs error with {model_name}: {e}")
                if "torchcodec" in str(e.stderr).lower():
                    print(f"TorchCodec issue with {model_name}, trying next model...")
                    continue
                else:
                    raise e
            except subprocess.TimeoutExpired:
                print(f"Timeout with {model_name}, trying next model...")
                continue
        
    except Exception as e:
        print(f"All Demucs models failed: {e}")
        # Even if Demucs fails to save, the processing might have worked
        # Let's check if the files were created
        
    # Check for Demucs output files in different model directories
    base_name = os.path.splitext(os.path.basename(wav_path))[0]
    vocals_path = None
    accompaniment_path = None
    
    # Try to find the separated files in any model directory
    for model_name in ["htdemucs", "mdx_extra", "mdx_q"]:
        song_dir = os.path.join(temp_output_dir, model_name, base_name)
        potential_vocals = os.path.join(song_dir, "vocals.wav")
        potential_accompaniment = os.path.join(song_dir, "no_vocals.wav")
        
        if os.path.exists(potential_vocals) and os.path.exists(potential_accompaniment):
            vocals_path = potential_vocals
            accompaniment_path = potential_accompaniment
            print(f"Found separated files in {model_name} directory")
            break
    
    # Check if files exist, if not, try alternative approach
    if not vocals_path or not accompaniment_path or not os.path.exists(vocals_path) or not os.path.exists(accompaniment_path):
        print("Demucs files not found, trying alternative approach...")
        return separate_with_alternative_method(wav_path)
    
    # Move files to final output directory
    final_output_dir = os.path.join(OUTPUT_DIR, "final")
    os.makedirs(final_output_dir, exist_ok=True)
    
    final_vocals_path = os.path.join(final_output_dir, f"{base_name}_vocals.wav")
    final_accompaniment_path = os.path.join(final_output_dir, f"{base_name}_background.wav")
    
    # Copy files to final location
    subprocess.run(["cp", vocals_path, final_vocals_path], check=True)
    subprocess.run(["cp", accompaniment_path, final_accompaniment_path], check=True)
    
    print(f"Vocals saved to: {final_vocals_path}")
    print(f"Background music saved to: {final_accompaniment_path}")
    
    return final_vocals_path, final_accompaniment_path

def separate_with_alternative_method(wav_path):
    """
    Try to use Demucs with different output formats to avoid TorchCodec issues.
    """
    print("Trying Demucs with different output formats...")
    
    base_name = os.path.splitext(os.path.basename(wav_path))[0]
    final_output_dir = os.path.join(OUTPUT_DIR, "final")
    os.makedirs(final_output_dir, exist_ok=True)
    
    vocals_path = os.path.join(final_output_dir, f"{base_name}_vocals.wav")
    accompaniment_path = os.path.join(final_output_dir, f"{base_name}_background.wav")
    
    # Try different approaches to avoid TorchCodec issues
    approaches = [
        # Try with different output format
        {
            "name": "Demucs with MP3 output",
            "cmd": ["demucs", "-n", "htdemucs", "--two-stems=vocals", "--device", "cpu", 
                   "--mp3", wav_path, "-o", OUTPUT_DIR]
        },
        # Try with different model and format
        {
            "name": "Demucs mdx_extra with MP3",
            "cmd": ["demucs", "-n", "mdx_extra", "--two-stems=vocals", "--device", "cpu",
                   "--mp3", wav_path, "-o", OUTPUT_DIR]
        },
        # Try without two-stems (full separation)
        {
            "name": "Demucs full separation",
            "cmd": ["demucs", "-n", "htdemucs", "--device", "cpu", wav_path, "-o", OUTPUT_DIR]
        }
    ]
    
    for approach in approaches:
        print(f"Trying: {approach['name']}")
        try:
            result = subprocess.run(approach["cmd"], check=True, capture_output=True, text=True, timeout=300)
            print(f"Success with {approach['name']}!")
            
            # Look for output files
            if "--mp3" in approach["cmd"]:
                # Look for MP3 files
                vocals_file = os.path.join(OUTPUT_DIR, "htdemucs", base_name, "vocals.mp3")
                accompaniment_file = os.path.join(OUTPUT_DIR, "htdemucs", base_name, "no_vocals.mp3")
                
                if not os.path.exists(vocals_file):
                    vocals_file = os.path.join(OUTPUT_DIR, "mdx_extra", base_name, "vocals.mp3")
                    accompaniment_file = os.path.join(OUTPUT_DIR, "mdx_extra", base_name, "no_vocals.mp3")
                
                if os.path.exists(vocals_file) and os.path.exists(accompaniment_file):
                    # Convert MP3 to WAV
                    subprocess.run(["ffmpeg", "-i", vocals_file, vocals_path, "-y"], check=True)
                    subprocess.run(["ffmpeg", "-i", accompaniment_file, accompaniment_path, "-y"], check=True)
                    
                    print(f"Vocals saved to: {vocals_path}")
                    print(f"Background music saved to: {accompaniment_path}")
                    return vocals_path, accompaniment_path
            
            else:
                # Look for WAV files
                vocals_file = os.path.join(OUTPUT_DIR, "htdemucs", base_name, "vocals.wav")
                accompaniment_file = os.path.join(OUTPUT_DIR, "htdemucs", base_name, "no_vocals.wav")
                
                if os.path.exists(vocals_file) and os.path.exists(accompaniment_file):
                    subprocess.run(["cp", vocals_file, vocals_path], check=True)
                    subprocess.run(["cp", accompaniment_file, accompaniment_path], check=True)
                    
                    print(f"Vocals saved to: {vocals_path}")
                    print(f"Background music saved to: {accompaniment_path}")
                    return vocals_path, accompaniment_path
            
        except subprocess.CalledProcessError as e:
            print(f"Failed: {approach['name']} - {e}")
            continue
        except subprocess.TimeoutExpired:
            print(f"Timeout: {approach['name']}")
            continue
    
    # If all Demucs approaches fail, try a simple center channel extraction
    print("All Demucs approaches failed, trying center channel extraction...")
    try:
        # Convert to stereo and try center channel extraction (simple but sometimes effective)
        subprocess.run([
            "ffmpeg", "-i", wav_path, 
            "-af", "pan=mono|c0=0.5*c0+0.5*c1",  # Center channel
            vocals_path, "-y"
        ], check=True)
        
        subprocess.run([
            "ffmpeg", "-i", wav_path,
            "-af", "pan=mono|c0=0.5*c0-0.5*c1",  # Side channel
            accompaniment_path, "-y"
        ], check=True)
        
        print(f"Center channel extraction completed")
        print(f"Vocals saved to: {vocals_path}")
        print(f"Background music saved to: {accompaniment_path}")
        return vocals_path, accompaniment_path
        
    except Exception as e:
        print(f"Center channel extraction failed: {e}")
    
    # Final fallback - simple copy
    print("Using simple copy as final fallback...")
    subprocess.run(["cp", wav_path, vocals_path], check=True)
    subprocess.run(["cp", wav_path, accompaniment_path], check=True)
    
    print(f"Note: Using original audio as fallback")
    print(f"Vocals saved to: {vocals_path}")
    print(f"Background music saved to: {accompaniment_path}")
    
    return vocals_path, accompaniment_path

def transcribe_vocals(vocals_path):
    """Transcribe vocals using multiple methods with fallbacks."""
    if not os.path.exists(vocals_path):
        raise FileNotFoundError(f"Vocals file not found: {vocals_path}")
    
    print(f"Transcribing vocals: {vocals_path}")
    
    # Try the robust transcription method
    try:
        from audio import transcribe_long_audio, manual_transcribe_for_testing
        transcription = transcribe_long_audio(vocals_path, max_tokens=4096, max_chunk_duration=90)
        
        # If transcription failed or is too short, try again without fallback
        if not transcription or len(transcription) < 20 or "TRANSCRIPTION NEEDED" in transcription:
            print("⚠️ Transcription failed, trying again...")
            # Try one more time with different parameters
            transcription = transcribe_long_audio(vocals_path, max_tokens=8192, max_chunk_duration=60)
            
            if not transcription or len(transcription) < 20:
                print("❌ Transcription failed completely")
                return "TRANSCRIPTION_FAILED"
        
        return transcription
        
    except Exception as e:
        print(f"All transcription methods failed: {e}")
        print("❌ Transcription failed completely")
        return "TRANSCRIPTION_FAILED"

def process_song(mp3_path):
    """Process a song: convert, separate, and transcribe."""
    try:
        # Convert MP3 to WAV to avoid TorchCodec issues
        wav_path = convert_mp3_to_wav(mp3_path)

        # Separate stems
        vocals_path, accompaniment_path = separate_with_demucs(wav_path)

        # Transcribe vocals
        transcription = transcribe_vocals(vocals_path)

        return vocals_path, accompaniment_path, transcription
        
    except Exception as e:
        print(f"Error processing song: {e}")
        raise

if __name__ == "__main__":
    try:
        print("Starting audio processing...")
        vocals, accompaniment, text = process_song(INPUT_FILE)
        
        print("\n" + "="*50)
        print("PROCESSING COMPLETE!")
        print("="*50)
        print(f"Vocals saved to: {vocals}")
        print(f"Background music saved to: {accompaniment}")
        print(f"Transcription: {text}")
        print("="*50)
        
    except Exception as e:
        print(f"Processing failed: {e}")
        sys.exit(1)
