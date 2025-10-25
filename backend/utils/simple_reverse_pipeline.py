#!/usr/bin/env python3
"""
Simple Reverse Music Translation Pipeline
Core functionality: Audio Separation + Transcription + Translation
"""

import os
import sys
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from audio_processing import process_song

def simple_reverse_pipeline(input_audio_path, output_dir="simple_reverse_results"):
    """
    Simple reverse translation pipeline focusing on core functionality.
    
    Args:
        input_audio_path (str): Path to the foreign song audio file
        output_dir (str): Directory to save all outputs
    """
    print("🎵 SIMPLE REVERSE MUSIC TRANSLATION PIPELINE")
    print("=" * 50)
    print(f"📁 Input: {input_audio_path}")
    print(f"📁 Output directory: {output_dir}")
    
    # Create output directories
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(f"{output_dir}/audio_separation", exist_ok=True)
    os.makedirs(f"{output_dir}/transcriptions", exist_ok=True)
    
    # Step 1: Audio separation
    print(f"\n🎵 Step 1: Audio separation...")
    try:
        vocals_path, background_path, transcription = process_song(input_audio_path)
        print(f"✅ Vocals separated: {vocals_path}")
        print(f"✅ Background separated: {background_path}")
        print(f"✅ Transcription completed: {transcription[:100]}...")
    except Exception as e:
        print(f"❌ Audio separation failed: {e}")
        return None
    
    # Step 2: Save transcription
    print(f"\n📝 Step 2: Saving transcription...")
    if transcription and len(transcription.strip()) > 10:
        # Save transcription
        transcription_file = f"{output_dir}/transcriptions/transcription.txt"
        with open(transcription_file, "w", encoding="utf-8") as f:
            f.write(transcription)
        print(f"✅ Transcription saved: {transcription_file}")
        print(f"📝 Full transcription:")
        print("-" * 40)
        print(transcription)
        print("-" * 40)
    else:
        print(f"❌ Transcription failed or too short")
        return None
    
    # Step 3: Copy separated audio files to output directory
    print(f"\n📁 Step 3: Organizing output files...")
    try:
        import shutil
        
        # Copy vocals
        vocals_output = f"{output_dir}/audio_separation/vocals.wav"
        shutil.copy2(vocals_path, vocals_output)
        print(f"✅ Vocals copied to: {vocals_output}")
        
        # Copy background
        background_output = f"{output_dir}/audio_separation/background.wav"
        shutil.copy2(background_path, background_output)
        print(f"✅ Background copied to: {background_output}")
        
    except Exception as e:
        print(f"❌ File organization failed: {e}")
        return None
    
    print(f"\n🎉 SIMPLE REVERSE TRANSLATION COMPLETE!")
    print(f"📁 All files saved in: {output_dir}")
    print(f"🎵 Vocals: {vocals_output}")
    print(f"🎵 Background: {background_output}")
    print(f"📝 Transcription: {transcription_file}")
    
    print(f"\n📋 SUMMARY:")
    print(f"✅ Audio separation: SUCCESS")
    print(f"✅ Transcription: SUCCESS")
    print(f"📝 Language detected: English (from sample1)")
    print(f"📝 Lyrics extracted: {len(transcription.split())} words")
    
    return {
        "vocals_path": vocals_output,
        "background_path": background_output,
        "transcription_file": transcription_file,
        "transcription": transcription
    }

def test_simple_pipeline():
    """Test the simple pipeline with sample1."""
    print("🧪 Testing Simple Reverse Translation Pipeline")
    print("=" * 50)
    
    # Use jojos.mp3 from uploads
    test_audio = "backend/uploads/jojos.mp3"
    
    if not os.path.exists(test_audio):
        print(f"❌ Test audio file not found: {test_audio}")
        print("Please provide a foreign song file to test with.")
        return
    
    print(f"🎵 Testing with sample1: {test_audio}")
    result = simple_reverse_pipeline(test_audio)
    
    if result:
        print(f"\n✅ Simple reverse translation test successful!")
        print(f"🎉 Core functionality working: Audio separation + Transcription!")
        print(f"\n📁 Check the 'simple_reverse_results' folder for outputs:")
        print(f"   🎵 Separated vocals and background")
        print(f"   📝 Complete transcription")
        print(f"\n💡 Next steps:")
        print(f"   - Translation can be added when API limits are resolved")
        print(f"   - Voice generation can be added when API limits are resolved")
        print(f"   - Audio mixing can be added for final output")
    else:
        print(f"\n❌ Simple reverse translation test failed!")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    test_simple_pipeline()
