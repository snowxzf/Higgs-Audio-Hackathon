#!/usr/bin/env python3
"""
Reverse Music Translation Pipeline
Translates foreign songs TO English using Boson AI.
"""

import os
import sys
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from audio_processing import process_song
from audio import transcribe_long_audio
from reverse_song_translator import ReverseSongTranslator
from english_voice_generator import EnglishVoiceGenerator

def reverse_translate_song(input_audio_path, output_dir="reverse_translation_results"):
    """
    Complete reverse translation pipeline: Foreign Song → English.
    
    Args:
        input_audio_path (str): Path to the foreign song audio file
        output_dir (str): Directory to save all outputs
    """
    print("🌍 REVERSE MUSIC TRANSLATION PIPELINE")
    print("=" * 50)
    print(f"📁 Input: {input_audio_path}")
    print(f"📁 Output directory: {output_dir}")
    
    # Create output directories
    os.makedirs(output_dir, exist_ok=True)
    os.makedirs(f"{output_dir}/audio_separation", exist_ok=True)
    os.makedirs(f"{output_dir}/transcriptions", exist_ok=True)
    os.makedirs(f"{output_dir}/translations", exist_ok=True)
    os.makedirs(f"{output_dir}/generated_voices", exist_ok=True)
    
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
    
    print(f"\n🎉 REVERSE TRANSLATION COMPLETE!")
    print(f"📁 All files saved in: {output_dir}")
    print(f"🎵 Original vocals: {vocals_path}")
    print(f"🎵 Background music: {background_path}")
    print(f"📝 Foreign transcription: {transcription_file}")
    print(f"📝 English translation: {translation_file}")
    print(f"🇺🇸 English voice: {english_voice_path}")
    
    return {
        "vocals_path": vocals_path,
        "background_path": background_path,
        "transcription_file": transcription_file,
        "translation_file": translation_file,
        "english_voice_path": english_voice_path
    }

def test_reverse_pipeline():
    """Test the reverse pipeline with the Japanese sample."""
    print("🧪 Testing Reverse Translation Pipeline")
    print("=" * 50)
    
    # Use the sample1 from uploads
    test_audio = "backend/uploads/sample1.mp3"
    
    if not os.path.exists(test_audio):
        print(f"❌ Test audio file not found: {test_audio}")
        print("Please provide a foreign song file to test with.")
        return
    
    print(f"🎌 Testing with Japanese sample: {test_audio}")
    result = reverse_translate_song(test_audio)
    
    if result:
        print(f"\n✅ Reverse translation test successful!")
        print(f"🎉 Japanese song successfully translated to English!")
    else:
        print(f"\n❌ Reverse translation test failed!")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Check if BOSON_API_KEY is set
    if not os.getenv("BOSON_API_KEY"):
        print("❌ BOSON_API_KEY environment variable not set")
        print("Please set your Boson AI API key in the .env file")
        sys.exit(1)
    
    test_reverse_pipeline()
