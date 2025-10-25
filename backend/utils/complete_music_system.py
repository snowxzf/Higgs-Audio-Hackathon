#!/usr/bin/env python3
"""
Complete Music Translation System
Combines audio separation, transcription, translation, and voice generation.
"""

import os
import sys
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

def main():
    """Run the complete music translation system."""
    print("🎵 Complete Music Translation System")
    print("=" * 60)
    print("✅ Audio separation (Demucs)")
    print("✅ Transcription (Whisper)")
    print("✅ Translation (Higgs Boson LLM)")
    print("✅ Voice generation (Higgs V2)")
    print("=" * 60)
    
    # Load environment variables
    load_dotenv()
    
    # Set API key if available
    api_key_file = "api_key.env"
    if os.path.exists(api_key_file):
        with open(api_key_file, 'r') as f:
            for line in f:
                if line.startswith('BOSON_API_KEY='):
                    os.environ['BOSON_API_KEY'] = line.split('=', 1)[1].strip()
                    break
    
    try:
        # Import and run the clean pipeline
        from clean_pipeline import main as run_pipeline
        run_pipeline()
        
        print("\n" + "=" * 60)
        print("🎉 COMPLETE MUSIC TRANSLATION SYSTEM FINISHED!")
        print("=" * 60)
        
        # Display final results
        print("\n📁 Generated Files:")
        print("   🎤 Original Vocals: output_stems/final/sample1_vocals.wav")
        print("   🎼 Background Music: output_stems/final/sample1_background.wav")
        print("   📝 Transcription: translation_results/transcriptions/original_transcription.txt")
        
        # Check for generated singing voices
        generated_vocals_dir = "generated_vocals"
        if os.path.exists(generated_vocals_dir):
            print("\n🎵 Generated Singing Voices:")
            for filename in os.listdir(generated_vocals_dir):
                if filename.endswith('.wav'):
                    lang = filename.replace('sample1_', '').replace('_vocals.wav', '')
                    print(f"   🌍 {lang.title()}: {generated_vocals_dir}/{filename}")
        
        print("\n🌍 Translations:")
        translation_dir = "translation_results/translations"
        if os.path.exists(translation_dir):
            for filename in os.listdir(translation_dir):
                if filename.startswith("translation_") and filename.endswith(".txt"):
                    lang = filename.replace("translation_", "").replace(".txt", "")
                    print(f"   🌍 {lang.title()}: {translation_dir}/{filename}")
        
        print("\n✅ System completed successfully!")
        print("🎵 You now have complete music translations with generated singing voices!")
        
    except Exception as e:
        print(f"❌ System failed: {e}")
        print("Please check your setup and try again.")

if __name__ == "__main__":
    main()
