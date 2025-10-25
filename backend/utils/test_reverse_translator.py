#!/usr/bin/env python3
"""
Test Reverse Song Translator
Quick test of the reverse translation system.
"""

import os
import sys
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from reverse_song_translator import ReverseSongTranslator

def test_reverse_translator():
    """Test the reverse translator with sample foreign lyrics."""
    print("🧪 Testing Reverse Song Translator")
    print("=" * 50)
    
    translator = ReverseSongTranslator()
    
    # Test with Spanish lyrics
    spanish_lyrics = """Voy a trabajar el lunes por la mañana
El martes voy de luna de miel
Volveré antes de que llegue el atardecer
Me pondré elegante el domingo por la tarde"""
    
    print(f"📝 Testing with Spanish lyrics:")
    print(spanish_lyrics)
    print()
    
    # Detect language
    detected_lang = translator.detect_language(spanish_lyrics)
    print(f"🔍 Detected language: {detected_lang}")
    print()
    
    # Translate to English
    english_translation = translator.translate_to_english(spanish_lyrics, detected_lang)
    
    if english_translation:
        print(f"✅ Translation successful!")
        print(f"📝 English translation:")
        print(english_translation)
    else:
        print(f"❌ Translation failed!")

if __name__ == "__main__":
    # Load environment variables
    load_dotenv()
    
    # Check if BOSON_API_KEY is set
    if not os.getenv("BOSON_API_KEY"):
        print("❌ BOSON_API_KEY environment variable not set")
        print("Please set your Boson AI API key in the .env file")
        sys.exit(1)
    
    test_reverse_translator()
