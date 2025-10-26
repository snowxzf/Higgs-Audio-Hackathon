#!/usr/bin/env python3
"""
Enhanced Reverse Music Translation Pipeline
Complete pipeline: Foreign Song → Audio Separation → Transcription → Translation → English Voice → Final Mix
"""

import os
import sys
import subprocess
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from audio_processing import process_song
from audio import transcribe_long_audio
from reverse_song_translator import ReverseSongTranslator
from english_voice_generator import EnglishVoiceGenerator

def enhanced_reverse_translate_song(input_audio_path, output_dir="enhanced_reverse_results"):
    """
    Enhanced reverse translation pipeline with audio mixing.
    
    Args:
        input_audio_path (str): Path to the foreign song audio file
        output_dir (str): Directory to save all outputs
    """
    print("🎵 ENHANCED REVERSE MUSIC TRANSLATION PIPELINE")
    print("=" * 60)
    print(f"📁 Input: {input_audio_path}")
    print(f"📁 Output directory: {output_dir}")
    
    # Create output directories
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(f"{output_dir}/audio_separation", exist_ok=True)
    os.makedirs(f"{output_dir}/transcriptions", exist_ok=True)
    os.makedirs(f"{output_dir}/translations", exist_ok=True)
    os.makedirs(f"{output_dir}/generated_voices", exist_ok=True)
    os.makedirs(f"{output_dir}/final_mixes", exist_ok=True)
    
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
    
    # Step 2: Use the transcription from audio processing
    print(f"\n📝 Step 2: Using transcription from audio processing...")
    foreign_transcription = transcription
    
    if foreign_transcription and len(foreign_transcription.strip()) > 10:
        # Save transcription
        transcription_file = f"{output_dir}/transcriptions/foreign_transcription.txt"
        with open(transcription_file, "w", encoding="utf-8") as f:
            f.write(foreign_transcription)
        print(f"✅ Foreign transcription saved: {transcription_file}")
        print(f"📝 Preview: {foreign_transcription[:100]}...")
    else:
        print(f"❌ Transcription failed or too short")
        return None
    
    # Step 3: Language detection and translation
    print(f"\n🌍 Step 3: Language detection and translation...")
    try:
        translator = ReverseSongTranslator()
        
        # Detect source language
        detected_language = translator.detect_language(foreign_transcription)
        
        # Translate to English
        english_translation = translator.translate_to_english(foreign_transcription, detected_language)
        
        if english_translation:
            # Save translation
            translation_file = f"{output_dir}/translations/english_translation.txt"
            with open(translation_file, "w", encoding="utf-8") as f:
                f.write(english_translation)
            print(f"✅ English translation saved: {translation_file}")
            print(f"📝 Preview: {english_translation[:100]}...")
        else:
            print(f"❌ Translation failed")
            return None
            
    except Exception as e:
        print(f"❌ Translation failed: {e}")
        return None
    
    # Step 4: English voice generation
    print(f"\n🇺🇸 Step 4: Generating English voice...")
    try:
        generator = EnglishVoiceGenerator()
        
        english_voice_path = f"{output_dir}/generated_voices/english_voice.wav"
        
        result = generator.generate_english_voice(
            reference_audio_path=vocals_path,
            english_lyrics=english_translation,
            output_path=english_voice_path
        )
        
        if result:
            print(f"✅ English voice generated: {english_voice_path}")
        else:
            print(f"❌ English voice generation failed")
            return None
            
    except Exception as e:
        print(f"❌ English voice generation failed: {e}")
        return None
    
    # Step 5: Create final audio mix
    print(f"\n🎼 Step 5: Creating final audio mix...")
    try:
        final_mix_path = f"{output_dir}/final_mixes/final_song_with_english_voice.wav"
        
        # Mix background music + English voice
        success = mix_audio_tracks(
            background_path=background_path,
            voice_path=english_voice_path,
            output_path=final_mix_path
        )
        
        if success:
            print(f"✅ Final mix created: {final_mix_path}")
        else:
            print(f"❌ Audio mixing failed")
            return None
            
    except Exception as e:
        print(f"❌ Audio mixing failed: {e}")
        return None
    
    print(f"\n🎉 ENHANCED REVERSE TRANSLATION COMPLETE!")
    print(f"📁 All files saved in: {output_dir}")
    print(f"🎵 Original vocals: {vocals_path}")
    print(f"🎵 Background music: {background_path}")
    print(f"📝 Foreign transcription: {transcription_file}")
    print(f"📝 English translation: {translation_file}")
    print(f"🇺🇸 English voice: {english_voice_path}")
    print(f"🎼 Final mix: {final_mix_path}")
    
    return {
        "vocals_path": vocals_path,
        "background_path": background_path,
        "transcription_file": transcription_file,
        "translation_file": translation_file,
        "english_voice_path": english_voice_path,
        "final_mix_path": final_mix_path
    }

def mix_audio_tracks(background_path, voice_path, output_path):
    """
    Mix background music with English voice using FFmpeg.
    """
    try:
        print(f"🎼 Mixing background music + English voice...")
        
        # Use FFmpeg to mix the tracks
        # Background music at 70% volume, voice at 100% volume
        cmd = [
            'ffmpeg', '-y',  # Overwrite output
            '-i', background_path,  # Background music
            '-i', voice_path,        # English voice
            '-filter_complex', '[0:a]volume=0.7[bg];[1:a]volume=1.0[voice];[bg][voice]amix=inputs=2:duration=longest[out]',
            '-map', '[out]',
            '-c:a', 'pcm_s16le',  # 16-bit PCM
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Audio mixing successful")
            return True
        else:
            print(f"❌ FFmpeg mixing failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Audio mixing error: {e}")
        return False

def test_enhanced_pipeline():
    """Test the enhanced pipeline with sample1."""
    print("🧪 Testing Enhanced Reverse Translation Pipeline")
    print("=" * 60)
    
    # Use jojos.mp3 from uploads
    test_audio = "backend/uploads/jojos.mp3"
    
    if not os.path.exists(test_audio):
        print(f"❌ Test audio file not found: {test_audio}")
        print("Please provide a foreign song file to test with.")
        return
    
    print(f"🎵 Testing with sample1: {test_audio}")
    result = enhanced_reverse_translate_song(test_audio)
    
    if result:
        print(f"\n✅ Enhanced reverse translation test successful!")
        print(f"🎉 Complete pipeline: Foreign song → English voice + background mix!")
        print(f"\n📁 Check the 'enhanced_reverse_results' folder for all outputs:")
        print(f"   🎵 Separated vocals and background")
        print(f"   📝 Original transcription")
        print(f"   📝 English translation")
        print(f"   🇺🇸 English voice reading the lyrics")
        print(f"   🎼 Final mix: background + English voice")
    else:
        print(f"\n❌ Enhanced reverse translation test failed!")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Check if BOSON_API_KEY is set
    if not os.getenv("BOSON_API_KEY"):
        print("❌ BOSON_API_KEY environment variable not set")
        print("Please set your Boson AI API key in the .env file")
        sys.exit(1)
    
    test_enhanced_pipeline()
