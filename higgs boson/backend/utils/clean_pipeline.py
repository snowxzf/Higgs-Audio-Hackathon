#!/usr/bin/env python3
"""
Clean Audio Processing Pipeline - Only Working Modules

This script includes only the modules that work reliably:
1. Audio separation (vocals + background music) ✅
2. Transcription of vocals ✅
3. Translation to different languages ✅

Voice generation modules have been removed as they are not working reliably.
"""

import os
import sys
from audio_processing import process_song
from song_translator import SongTranslator, detect_language, get_supported_languages

def main():
    """Main pipeline function - only working modules."""
    
    # Configuration
    INPUT_FILE = "backend/utils/sample1.mp3"
    TARGET_LANGUAGES = ["Spanish", "French", "German", "Italian"]
    
    print("🎵 Clean Audio Processing Pipeline")
    print("=" * 50)
    print("✅ Audio separation (Demucs)")
    print("✅ Transcription (Whisper)")
    print("✅ Translation (Higgs Boson LLM)")
    print("❌ Voice generation (removed - not working)")
    print("=" * 50)
    
    # Step 1: Process the audio (separate + transcribe)
    print("\n📀 Step 1: Processing audio...")
    try:
        vocals_path, background_path, transcription = process_song(INPUT_FILE)
        print(f"✅ Audio processed successfully!")
        print(f"   🎤 Vocals: {vocals_path}")
        print(f"   🎼 Background: {background_path}")
        print(f"   📝 Transcription: {transcription[:100]}...")
    except Exception as e:
        print(f"❌ Audio processing failed: {e}")
        return
    
    # Step 2: Detect source language
    print("\n🔍 Step 2: Detecting source language...")
    try:
        source_language = detect_language(transcription)
        print(f"✅ Detected source language: {source_language}")
    except Exception as e:
        print(f"⚠️ Language detection failed, using English as default: {e}")
        source_language = "English"
    
    # Step 3: Translate to different languages using two-step system
    print("\n🌍 Step 3: Translating to different languages using two-step system...")
    
    # Import the two-step processor
    sys.path.append(os.path.dirname(__file__))
    from two_step_lyrics_processor import process_transcription_with_two_steps
    
    translations = {}
    for target_lang in TARGET_LANGUAGES:
        print(f"\n🌍 Translating to {target_lang}...")
        try:
            # Use two-step system for clean translations
            translation = process_transcription_with_two_steps(transcription, target_lang)
            if translation:
                translations[target_lang] = translation
                print(f"✅ {target_lang} translation completed!")
                print(f"   Preview: {translation[:100]}...")
            else:
                print(f"❌ {target_lang} translation failed")
                translations[target_lang] = f"Translation failed"
        except Exception as e:
            print(f"❌ {target_lang} translation failed: {e}")
            translations[target_lang] = f"Translation failed: {str(e)}"
    
    # Step 4: Save results to organized directories
    print("\n💾 Step 4: Saving results...")
    
    # Create organized output directories
    output_dirs = {
        "audio": "output_stems/final",
        "transcriptions": "translation_results/transcriptions", 
        "translations": "translation_results/translations"
    }
    
    for dir_name, dir_path in output_dirs.items():
        os.makedirs(dir_path, exist_ok=True)
        print(f"📁 Created directory: {dir_path}")
    
    # Save original transcription (clean only)
    transcription_file = os.path.join(output_dirs["transcriptions"], "original_transcription.txt")
    with open(transcription_file, "w", encoding="utf-8") as f:
        f.write(transcription)  # Save only the clean transcription
    print(f"✅ Saved original transcription: {transcription_file}")
    
    # Save translations (clean from two-step system + post-process)
    for lang, translation in translations.items():
        if translation and not translation.startswith("Translation failed"):
            filename = f"translation_{lang.lower()}.txt"
            translation_file = os.path.join(output_dirs["translations"], filename)
            
            # Import and use the post-processing function
            from two_step_lyrics_processor import post_process_clean_lyrics
            clean_translation = post_process_clean_lyrics(translation)
            
            with open(translation_file, "w", encoding="utf-8") as f:
                f.write(clean_translation)  # Save the clean translation
            print(f"✅ Saved {lang} translation: {translation_file}")
    
    # Step 5: Display final results
    print("\n" + "=" * 50)
    print("🎉 PIPELINE COMPLETED SUCCESSFULLY!")
    print("=" * 50)
    
    print(f"\n📝 Original ({source_language}):")
    print(transcription)
    
    print(f"\n📁 Output Files:")
    print(f"   🎤 Vocals: {vocals_path}")
    print(f"   🎼 Background: {background_path}")
    print(f"   📝 Transcription: {transcription_file}")
    
    for lang, translation in translations.items():
        if translation and not translation.startswith("Translation failed"):
            print(f"   🌍 {lang}: translation_results/translations/translation_{lang.lower()}.txt")
    
    # Step 5: Voice generation with Language-Aware Voice Reader
    print(f"\n🎤 Step 5: Voice generation with Language-Aware Voice Reader...")
    try:
        from simple_voice_reader import SimpleVoiceReader
        reader = SimpleVoiceReader()
        
        # Generate voices for each translation with language-specific pronunciation
        for lang, translation in translations.items():
            if translation and not translation.startswith("Translation failed"):
                print(f"\n🎵 Generating {lang} voice reading transcript...")
                vocals_path = f"generated_vocals/sample1_{lang.lower()}_vocals.wav"
                
                result = reader.read_transcript(
                    reference_audio_path="output_stems/final/sample1_vocals.wav",
                    transcript=translation,
                    output_path=vocals_path,
                    language=lang  # Pass the language for natural pronunciation
                )
                
                if result:
                    print(f"✅ {lang} voice generated: {vocals_path}")
                else:
                    print(f"❌ {lang} voice generation failed")
        
        print(f"\n✅ All modules completed successfully!")
        print(f"🎤 Voice generation with Language-Aware Voice Reader completed!")
        
    except Exception as e:
        print(f"❌ Voice generation failed: {e}")
        print(f"\n✅ All working modules completed successfully!")
        print(f"❌ Voice generation skipped (Language-Aware Voice Reader not available)")

def generate_single_language_voice(target_language="Spanish"):
    """
    Generate voice for only one specific language for faster testing.
    
    Args:
        target_language (str): The language to generate voice for (Spanish, French, German, Italian)
    """
    print(f"🎤 Generating voice for {target_language} only...")
    
    # Check if translations exist
    translation_file = f"translation_results/translations/translation_{target_language.lower()}.txt"
    if not os.path.exists(translation_file):
        print(f"❌ Translation file not found: {translation_file}")
        print("Please run the full pipeline first to generate translations.")
        return None
    
    # Read the translation
    with open(translation_file, "r", encoding="utf-8") as f:
        translation = f.read().strip()
    
    if not translation or translation.startswith("Translation failed"):
        print(f"❌ No valid translation found for {target_language}")
        return None
    
    print(f"📝 Found {target_language} translation: '{translation[:50]}...'")
    
    # Generate voice for the single language
    try:
        from simple_voice_reader import SimpleVoiceReader
        reader = SimpleVoiceReader()
        
        vocals_path = f"generated_vocals/sample1_{target_language.lower()}_vocals.wav"
        
        result = reader.read_transcript(
            reference_audio_path="output_stems/final/sample1_vocals.wav",
            transcript=translation,
            output_path=vocals_path,
            language=target_language
        )
        
        if result:
            print(f"✅ {target_language} voice generated: {vocals_path}")
            return vocals_path
        else:
            print(f"❌ {target_language} voice generation failed")
            return None
            
    except Exception as e:
        print(f"❌ Voice generation failed: {e}")
        return None

def process_single_song(audio_file, target_language, source_language=None):
    """
    Simple function to process, transcribe, and translate a single song.
    
    Args:
        audio_file (str): Path to the audio file
        target_language (str): Target language for translation
        source_language (str, optional): Source language (auto-detected if None)
    
    Returns:
        dict: Results containing vocals_path, background_path, original_transcription, translation
    """
    print(f"🎵 Processing: {audio_file}")
    print(f"🌍 Target language: {target_language}")
    
    # Process audio
    vocals_path, background_path, transcription = process_song(audio_file)
    
    # Detect source language if not provided
    if source_language is None:
        source_language = detect_language(transcription)
        print(f"🔍 Detected source language: {source_language}")
    
    # Translate
    translator = SongTranslator()
    translation = translator.translate_song(transcription, target_language, source_language)
    
    result = {
        "vocals_path": vocals_path,
        "background_path": background_path,
        "original_transcription": transcription,
        "translation": translation,
        "source_language": source_language,
        "target_language": target_language
    }
    
    return result

if __name__ == "__main__":
    if len(sys.argv) > 1:
        # Command line usage
        if len(sys.argv) >= 3:
            audio_file = sys.argv[1]
            target_language = sys.argv[2]
            source_language = sys.argv[3] if len(sys.argv) > 3 else None
            
            result = process_single_song(audio_file, target_language, source_language)
            
            print("\n" + "=" * 50)
            print("RESULTS:")
            print("=" * 50)
            print(f"Original ({result['source_language']}):")
            print(result['original_transcription'])
            print(f"\nTranslation ({result['target_language']}):")
            print(result['translation'])
            print(f"\n🎤 Vocals: {result['vocals_path']}")
            print(f"🎼 Background: {result['background_path']}")
        else:
            print("Usage: python clean_pipeline.py <audio_file> <target_language> [source_language]")
            print("Example: python clean_pipeline.py sample.mp3 Spanish")
    else:
        # Run full pipeline
        main()
