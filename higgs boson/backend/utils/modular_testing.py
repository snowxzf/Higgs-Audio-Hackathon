#!/usr/bin/env python3
"""
Modular Testing Functions
Separate functions for each pipeline step for easier testing.
"""

import os
import subprocess
from backend.utils.audio_processing import process_song
from backend.utils.reverse_song_translator import ReverseSongTranslator
from backend.utils.modular_voice_generator import ModularVoiceGenerator

def test_audio_separation(audio_path: str):
    """Test just the audio separation step."""
    print("🎵 Testing Audio Separation")
    print("=" * 40)
    
    if not os.path.exists(audio_path):
        print(f"❌ Audio file not found: {audio_path}")
        return False
    
    print(f"📁 Processing: {audio_path}")
    
    try:
        vocals_path, background_path, transcription = process_song(audio_path)
        
        if vocals_path and background_path:
            print(f"✅ Vocals: {vocals_path}")
            print(f"✅ Background: {background_path}")
            print(f"✅ Transcription: {transcription[:100]}...")
            return True
        else:
            print("❌ Audio separation failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_transcription_only(vocals_path: str):
    """Test just the transcription step."""
    print("📝 Testing Transcription")
    print("=" * 40)
    
    if not os.path.exists(vocals_path):
        print(f"❌ Vocals file not found: {vocals_path}")
        return False
    
    try:
        from audio import transcribe_long_audio
        transcription = transcribe_long_audio(vocals_path, max_chunk_duration=45)
        
        if transcription and len(transcription) > 20:
            print(f"✅ Transcription: {transcription[:200]}...")
            return transcription
        else:
            print("❌ Transcription failed")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_language_detection(transcription: str):
    """Test just the language detection step."""
    print("🌍 Testing Language Detection")
    print("=" * 40)
    
    try:
        translator = ReverseSongTranslator()
        language = translator.detect_language(transcription)
        
        if language:
            print(f"✅ Detected language: {language}")
            return language
        else:
            print("❌ Language detection failed")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_translation(transcription: str, source_language: str):
    """Test just the translation step."""
    print("🔄 Testing Translation")
    print("=" * 40)
    
    try:
        translator = ReverseSongTranslator()
        english_translation = translator.translate_to_english(transcription, source_language)
        
        if english_translation and len(english_translation) > 20:
            print(f"✅ English translation: {english_translation[:200]}...")
            return english_translation
        else:
            print("❌ Translation failed")
            return None
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return None

def test_voice_generation(english_text: str, reference_vocals_path: str, output_path: str):
    """Test just the voice generation step."""
    print("🎤 Testing Voice Generation")
    print("=" * 40)
    
    try:
        generator = ModularVoiceGenerator()
        success = generator.generate_english_voice(english_text, reference_vocals_path, output_path)
        
        if success:
            print(f"✅ Voice generated: {output_path}")
            return True
        else:
            print("❌ Voice generation failed")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_audio_mixing(voice_path: str, background_path: str, output_path: str):
    """Test just the audio mixing step."""
    print("🎧 Testing Audio Mixing")
    print("=" * 40)
    
    if not os.path.exists(voice_path):
        print(f"❌ Voice file not found: {voice_path}")
        return False
        
    if not os.path.exists(background_path):
        print(f"❌ Background file not found: {background_path}")
        return False
    
    try:
        # Create output directory
        os.makedirs(os.path.dirname(output_path), exist_ok=True)
        
        # Mix voice and background
        cmd = [
            'ffmpeg', '-y',
            '-i', voice_path,
            '-i', background_path,
            '-filter_complex', '[0:a][1:a]amix=inputs=2:duration=first:dropout_transition=2[out]',
            '-map', '[out]',
            output_path
        ]
        
        result = subprocess.run(cmd, capture_output=True, text=True)
        
        if result.returncode == 0:
            print(f"✅ Mixed audio: {output_path}")
            return True
        else:
            print(f"❌ Mixing failed: {result.stderr}")
            return False
            
    except Exception as e:
        print(f"❌ Error: {e}")
        return False

def test_complete_pipeline(audio_path: str):
    """Test the complete pipeline step by step."""
    print("🚀 Testing Complete Pipeline")
    print("=" * 50)
    
    # Step 1: Audio Separation
    print("\n1️⃣ Audio Separation")
    vocals_path, background_path, transcription = process_song(audio_path)
    if not vocals_path:
        print("❌ Pipeline failed at audio separation")
        return False
    
    # Step 2: Language Detection
    print("\n2️⃣ Language Detection")
    translator = ReverseSongTranslator()
    language = translator.detect_language(transcription)
    if not language:
        print("❌ Pipeline failed at language detection")
        return False
    
    # Step 3: Translation
    print("\n3️⃣ Translation")
    english_translation = translator.translate_to_english(transcription, language)
    if not english_translation:
        print("❌ Pipeline failed at translation")
        return False
    
    # Step 4: Voice Generation
    print("\n4️⃣ Voice Generation")
    generator = ModularVoiceGenerator()
    voice_output = "enhanced_reverse_results/generated_voices/english_voice.wav"
    os.makedirs(os.path.dirname(voice_output), exist_ok=True)
    
    voice_success = generator.generate_english_voice(english_translation, vocals_path, voice_output)
    if not voice_success:
        print("❌ Pipeline failed at voice generation")
        return False
    
    # Step 5: Audio Mixing
    print("\n5️⃣ Audio Mixing")
    final_output = "enhanced_reverse_results/final_mixes/english_song.wav"
    mix_success = test_audio_mixing(voice_output, background_path, final_output)
    if not mix_success:
        print("❌ Pipeline failed at audio mixing")
        return False
    
    print(f"\n🎉 Complete pipeline successful!")
    print(f"📁 Final output: {final_output}")
    return True

if __name__ == "__main__":
    # Test with jojos.mp3
    audio_path = "backend/uploads/jojos.mp3"
    
    print("Choose test:")
    print("1. Audio Separation")
    print("2. Transcription Only")
    print("3. Language Detection")
    print("4. Translation")
    print("5. Voice Generation")
    print("6. Audio Mixing")
    print("7. Complete Pipeline")
    
    choice = input("Enter choice (1-7): ").strip()
    
    if choice == "1":
        test_audio_separation(audio_path)
    elif choice == "2":
        vocals_path = "enhanced_reverse_results/audio_separation/vocals.wav"
        test_transcription_only(vocals_path)
    elif choice == "3":
        transcription_path = "enhanced_reverse_results/transcriptions/foreign_transcription.txt"
        if os.path.exists(transcription_path):
            with open(transcription_path, 'r', encoding='utf-8') as f:
                transcription = f.read().strip()
            test_language_detection(transcription)
        else:
            print("❌ Transcription file not found")
    elif choice == "4":
        transcription_path = "enhanced_reverse_results/transcriptions/foreign_transcription.txt"
        if os.path.exists(transcription_path):
            with open(transcription_path, 'r', encoding='utf-8') as f:
                transcription = f.read().strip()
            test_translation(transcription, "Japanese")
        else:
            print("❌ Transcription file not found")
    elif choice == "5":
        english_path = "enhanced_reverse_results/translations/english_translation.txt"
        vocals_path = "enhanced_reverse_results/audio_separation/vocals.wav"
        if os.path.exists(english_path) and os.path.exists(vocals_path):
            with open(english_path, 'r', encoding='utf-8') as f:
                english_text = f.read().strip()
            test_voice_generation(english_text, vocals_path, "enhanced_reverse_results/generated_voices/test_voice.wav")
        else:
            print("❌ Required files not found")
    elif choice == "6":
        voice_path = "enhanced_reverse_results/generated_voices/english_voice.wav"
        background_path = "enhanced_reverse_results/audio_separation/background.wav"
        test_audio_mixing(voice_path, background_path, "enhanced_reverse_results/final_mixes/test_mix.wav")
    elif choice == "7":
        test_complete_pipeline(audio_path)
    else:
        print("Invalid choice")
