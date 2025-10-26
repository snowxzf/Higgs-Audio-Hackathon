#!/usr/bin/env python3
"""
Reverse Song Translator
Translates foreign songs TO English using Boson AI.
"""

import os
import sys
from dotenv import load_dotenv
from openai import OpenAI

# Load environment variables
load_dotenv()

class ReverseSongTranslator:
    def __init__(self):
        """Initialize the reverse song translator."""
        self.client = OpenAI(
            api_key=os.getenv("BOSON_API_KEY"),
            base_url="https://hackathon.boson.ai/v1"
        )
    
    def detect_language(self, text):
        """
        Detect the source language of the text.
        """
        print(f"🔍 Detecting source language...")
        
        system_prompt = """You are a language detection expert. Analyze the given text and identify the language it is written in.

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY the language name (e.g., "Spanish", "French", "German", "Italian", "Portuguese", "Japanese", "Korean", "Chinese", "Arabic", "Russian", "English")
- Do NOT include any explanations, analysis, or additional text
- Do NOT include phrases like "The language is" or "This text is in"
- Output ONLY the clean language name, nothing else"""
        
        try:
            response = self.client.chat.completions.create(
                model="Qwen3-32B-thinking-Hackathon",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Detect the language of this text: {text[:200]}..."}
                ],
                max_completion_tokens=50,
                temperature=0.1
            )
            
            detected_language = response.choices[0].message.content.strip()
            print(f"✅ Detected source language: {detected_language}")
            return detected_language
            
        except Exception as e:
            print(f"❌ Language detection failed: {e}")
            return "Unknown"
    
    def translate_to_english(self, foreign_lyrics, source_language):
        """
        Translate foreign lyrics to English with proper poetic structure.
        """
        print(f"🌍 Translating {source_language} lyrics to English...")
        
        system_prompt = f"""You are a professional song translator specializing in translating {source_language} songs to English.

Your task is to translate the given {source_language} lyrics into natural, poetic English while preserving:
- The emotional tone and meaning
- The rhythm and flow
- The poetic structure
- The overall message and sentiment

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY the translated English lyrics
- Do NOT include any explanations, analysis, or metadata
- Do NOT include phrases like 'Here is the translation' or 'The English version is'
- Do NOT include any text that is not part of the actual translated lyrics
- Maintain the exact same line structure as the original
- The output should be ONLY clean English lyrics, nothing else
- Each line should be a direct translation of the corresponding original line
- Start immediately with the first translated line, no introduction"""
        
        try:
            response = self.client.chat.completions.create(
                model="Qwen3-32B-thinking-Hackathon",
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Translate these {source_language} lyrics to English:\n\n{foreign_lyrics}"}
                ],
                max_completion_tokens=2048,
                temperature=0.7
            )
            
            translation = response.choices[0].message.content.strip()
            
            # Clean the translation output
            clean_translation = self._clean_translation_output(translation)
            
            if clean_translation and len(clean_translation) > 10:
                print(f"✅ {source_language} to English translation completed!")
                print(f"   Preview: {clean_translation[:100]}...")
                return clean_translation
            else:
                print(f"❌ {source_language} to English translation failed - output too short")
                return None
                
        except Exception as e:
            print(f"❌ {source_language} to English translation failed: {e}")
            return None
    
    def _clean_translation_output(self, text):
        """
        Clean up translation output to remove any reasoning or analysis that might have leaked through.
        """
        lines = text.split('\n')
        clean_lines = []
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            if any(phrase in line.lower() for phrase in [
                'translation:', 'analysis:', 'reasoning:', 'thinking:', 
                'here is', 'here are', 'the translation', 'translated lyrics',
                'original:', 'source:', 'target:', 'language:', 'okay',
                'let me', 'i need to', 'first', 'next', 'then', 'finally',
                'continuing', 'adjusting', 'ensuring', 'checking',
                'english version', 'english lyrics', 'translated to english'
            ]):
                continue
            if line.startswith(('I ', 'The ', 'This ', 'In ', 'For ', 'To ', 'With ', 'Okay', 'Let', 'First', 'Next', 'Then', 'Finally')):
                continue
            if any(word in line.lower() for word in ['rhyme', 'syllable', 'meter', 'rhythm', 'structure', 'pattern']):
                continue
            clean_lines.append(line)
        
        return '\n'.join(clean_lines)

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
    
    print(f"📝 Testing with Spanish lyrics: '{spanish_lyrics[:30]}...'")
    
    # Detect language
    detected_lang = translator.detect_language(spanish_lyrics)
    
    # Translate to English
    english_translation = translator.translate_to_english(spanish_lyrics, detected_lang)
    
    if english_translation:
        print(f"\n✅ Translation successful!")
        print(f"📝 English translation:")
        print(english_translation)
    else:
        print(f"\n❌ Translation failed!")

if __name__ == "__main__":
    test_reverse_translator()
