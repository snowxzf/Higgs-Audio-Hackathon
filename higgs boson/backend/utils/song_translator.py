import os
import sys
from boson_client import client

class SongTranslator:
    """
    Translates song lyrics while preserving poeticism and rhymes using Higgs Boson LLM.
    """
    
    def __init__(self):
        self.model = "Qwen3-32B-thinking-Hackathon"
    
    def translate_song(self, original_transcript, target_language, source_language="English", preserve_style=True):
        """
        Translate song lyrics while preserving poeticism and rhymes.
        Uses thinking model to analyze syllables, rhymes, and rhythm internally,
        then outputs only the clean translated lyrics.
        
        Args:
            original_transcript (str): The original song transcript
            target_language (str): Target language for translation (e.g., "Spanish", "French", "German")
            source_language (str): Source language of the original transcript (e.g., "English", "Spanish", "French")
            preserve_style (bool): Whether to preserve poetic style and rhymes
            
        Returns:
            str: Clean translated song lyrics (no reasoning or analysis)
        """
        
        if preserve_style:
            system_prompt = f"""You are a professional song translator. Your task is to translate {source_language} song lyrics to {target_language} while preserving poeticism, rhymes, and musical flow.

INTERNAL THINKING PROCESS (do this internally, don't output it):
1. Analyze the original lyrics for:
   - Rhyme scheme and patterns
   - Syllable count per line
   - Rhythm and meter
   - Emotional tone and themes
   - Cultural context

2. Plan your translation strategy:
   - How to maintain rhyme patterns in {target_language}
   - How to preserve syllable count and rhythm
   - How to adapt cultural references appropriately
   - How to maintain the emotional impact

3. Execute the translation with careful attention to:
   - Preserving the musical structure
   - Maintaining natural flow in {target_language}
   - Keeping the same emotional resonance

CRITICAL OUTPUT REQUIREMENTS:
- Output ONLY the translated lyrics in {target_language}
- Do NOT include any reasoning, analysis, explanations, or metadata
- Do NOT include phrases like 'Here is the translation' or 'The translation is'
- Do NOT include any text that is not part of the actual translated lyrics
- Do NOT include speaker tags, formatting, or special characters
- Maintain the exact same line structure as the original
- The output should be ONLY clean lyrics, nothing else
- Each line should be a direct translation of the corresponding original line
- Start immediately with the first translated line, no introduction"""
        else:
            system_prompt = f"""Translate the following song lyrics from {source_language} to {target_language}. Maintain the meaning and emotional tone while making it sound natural in {target_language}. 

Output only the translated lyrics with no additional text."""
        
        user_prompt = f"""Translate these {source_language} song lyrics to {target_language}:

{original_transcript}

Output only the translated lyrics in {target_language}."""

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=1024,
                temperature=0.7,  # Slightly higher for creativity while maintaining accuracy
            )
            
            translated_lyrics = response.choices[0].message.content.strip()
            
            # Clean up any remaining reasoning or analysis that might have leaked through
            translated_lyrics = self._clean_translation_output(translated_lyrics)
            
            return translated_lyrics
            
        except Exception as e:
            print(f"Translation failed: {e}")
            return f"Translation failed: {str(e)}"
    
    def _clean_translation_output(self, text):
        """
        Clean up translation output to remove any reasoning or analysis that might have leaked through.
        
        Args:
            text (str): Raw translation output
            
        Returns:
            str: Clean translation with only lyrics
        """
        lines = text.split('\n')
        clean_lines = []
        
        for line in lines:
            line = line.strip()
            # Skip empty lines
            if not line:
                continue
            # Skip lines that look like reasoning, analysis, or metadata
            if any(phrase in line.lower() for phrase in [
                'translation:', 'analysis:', 'reasoning:', 'thinking:', 
                'here is', 'here are', 'the translation', 'translated lyrics',
                'original:', 'source:', 'target:', 'language:', 'okay',
                'let me', 'i need to', 'first', 'next', 'then', 'finally',
                'continuing', 'adjusting', 'ensuring', 'checking',
                '<think>', '</think>'
            ]):
                continue
            # Skip lines that start with common analysis phrases
            if line.startswith(('I ', 'The ', 'This ', 'In ', 'For ', 'To ', 'With ', 'Okay', 'Let', 'First', 'Next', 'Then', 'Finally')):
                continue
            # Skip lines that are clearly analysis (contain words like "rhyme", "syllable", "meter")
            if any(word in line.lower() for word in ['rhyme', 'syllable', 'meter', 'rhythm', 'structure', 'pattern']):
                continue
            # Keep the line if it looks like actual lyrics
            clean_lines.append(line)
        
        return '\n'.join(clean_lines)
    
    def translate_with_analysis(self, original_transcript, target_language, source_language="English"):
        """
        Translate song with detailed analysis of the translation choices.
        
        Args:
            original_transcript (str): The original song transcript
            target_language (str): Target language for translation
            source_language (str): Source language of the original transcript
            
        Returns:
            dict: Contains translation and analysis
        """
        
        system_prompt = f"""You are a professional song translator and linguistic expert. Translate the song lyrics from {source_language} to {target_language} while preserving poeticism and rhymes.

After the translation, provide a brief analysis of:
1. Key translation choices made
2. How rhymes were preserved
3. Any cultural adaptations
4. Challenges faced in maintaining the poetic style

Format your response as:
TRANSLATION:
[translated lyrics]
"""

        user_prompt = f"""Original {source_language} lyrics:
{original_transcript}

Please translate these lyrics to {target_language} and provide analysis of your translation choices."""

        try:
            response = client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                max_completion_tokens=1536,
                temperature=0.7,
            )
            
            result = response.choices[0].message.content.strip()
            
            # Parse the response
            if "TRANSLATION:" in result and "ANALYSIS:" in result:
                parts = result.split("ANALYSIS:")
                translation = parts[0].replace("TRANSLATION:", "").strip()
                analysis = parts[1].strip()
                
                return {
                    "translation": translation,
                    "analysis": analysis,
                    "success": True
                }
            else:
                return {
                    "translation": result,
                    "analysis": "Analysis not provided",
                    "success": True
                }
                
        except Exception as e:
            return {
                "translation": f"Translation failed: {str(e)}",
                "analysis": "Analysis failed",
                "success": False
            }

def translate_song_simple(original_transcript, target_language, source_language="English"):
    """
    Simple function to translate song lyrics.
    
    Args:
        original_transcript (str): The original song transcript
        target_language (str): Target language for translation
        source_language (str): Source language of the original transcript
        
    Returns:
        str: Translated song lyrics
    """
    translator = SongTranslator()
    return translator.translate_song(original_transcript, target_language, source_language)

def detect_language(text):
    """
    Detect the language of the input text using the LLM.
    
    Args:
        text (str): Text to detect language for
        
    Returns:
        str: Detected language name
    """
    try:
        response = client.chat.completions.create(
            model="Qwen3-32B-thinking-Hackathon",
            messages=[
                {"role": "system", "content": "You are a language detection expert. Identify the language of the given text and return only the language name in English (e.g., 'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese', 'Russian', 'Chinese', 'Japanese', 'Korean', etc.)."},
                {"role": "user", "content": f"Detect the language of this text:\n\n{text[:500]}"}  # Limit to first 500 chars
            ],
            max_completion_tokens=50,
            temperature=0.1,
        )
        
        detected_language = response.choices[0].message.content.strip()
        return detected_language
        
    except Exception as e:
        print(f"Language detection failed: {e}")
        return "Unknown"

def get_supported_languages():
    """
    Get a list of commonly supported languages for translation.
    
    Returns:
        list: List of supported language names
    """
    return [
        "English", "Spanish", "French", "German", "Italian", "Portuguese", 
        "Russian", "Chinese", "Japanese", "Korean", "Arabic", "Hindi",
        "Dutch", "Swedish", "Norwegian", "Danish", "Finnish", "Polish",
        "Czech", "Hungarian", "Romanian", "Bulgarian", "Croatian", "Serbian",
        "Turkish", "Greek", "Hebrew", "Thai", "Vietnamese", "Indonesian",
        "Malay", "Tagalog", "Ukrainian", "Belarusian", "Lithuanian", "Latvian",
        "Estonian", "Slovak", "Slovenian", "Macedonian", "Albanian", "Maltese"
    ]

if __name__ == "__main__":
    # Test the translation functionality
    sample_lyrics = """I go out to work on Monday morning
Tuesday I go off to honeymoon
I'll be back again before it's time for sundown
I'll be lazing on Sunday afternoon
Bicycling on every Wednesday afternoon"""
    
    translator = SongTranslator()
    
    print("Testing song translation...")
    print("=" * 50)
    print("Original lyrics:")
    print(sample_lyrics)
    print("=" * 50)
    
    # Test language detection
    print("Detecting language:")
    detected_lang = detect_language(sample_lyrics)
    print(f"Detected language: {detected_lang}")
    print("=" * 50)
    
    # Test Spanish translation
    print("Spanish translation:")
    spanish_translation = translator.translate_song(sample_lyrics, "Spanish", "English")
    print(spanish_translation)
    print("=" * 50)
    
    # Test French translation
    print("French translation:")
    french_translation = translator.translate_song(sample_lyrics, "French", "English")
    print(french_translation)
    print("=" * 50)
    
    # Test with analysis
    print("German translation with analysis:")
    german_result = translator.translate_with_analysis(sample_lyrics, "German", "English")
    print("TRANSLATION:")
    print(german_result["translation"])
    print("\nANALYSIS:")
    print(german_result["analysis"])
    print("=" * 50)
    
    # Test supported languages
    print("Supported languages:")
    supported_langs = get_supported_languages()
    print(f"Total: {len(supported_langs)} languages")
    print("First 10:", supported_langs[:10])
