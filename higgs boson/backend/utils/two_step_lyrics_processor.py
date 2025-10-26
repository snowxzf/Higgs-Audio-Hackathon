#!/usr/bin/env python3
"""
Two-step lyrics processing system:
1. LLM analyzes and generates clean lyrics in utils directory
2. LLM reviews its output and saves only final clean lyrics to text files
"""

import os
import sys
from openai import OpenAI
from dotenv import load_dotenv

# Add utils directory to path
sys.path.append(os.path.join(os.path.dirname(__file__), 'backend', 'utils'))

from boson_client import client

def post_process_clean_lyrics(text):
    """
    Post-process to remove any remaining reasoning or analysis, including <think> tags.
    """
    if not text:
        return ""
    
    # First, remove <think> tags and their content
    import re
    text = re.sub(r'<think>.*?</think>', '', text, flags=re.DOTALL)
    
    lines = text.split('\n')
    clean_lines = []
    
    for line in lines:
        line = line.strip()
        # Skip empty lines
        if not line:
            continue
        # Skip lines that contain reasoning or analysis
        if any(phrase in line.lower() for phrase in [
            'okay', 'let me', 'first', 'looking at', 'i need to', 'i should',
            'the user', 'provided', 'text', 'task', 'extract', 'find',
            'reasoning', 'thinking', 'analysis', 'process', 'instructions',
            'critical', 'output', 'requirements', 'do not', 'include',
            'start immediately', 'translated lyrics', 'clean lyrics',
            'redacted_reasoning', '<think>', '</think>'
        ]):
            continue
        # Skip lines that start with analysis phrases
        if line.startswith(('I ', 'The ', 'This ', 'In ', 'For ', 'To ', 'With ', 'Okay', 'Let', 'First', 'Looking', 'I need', 'I should')):
            continue
        # Skip lines that contain <think> tags
        if '<think>' in line or '</think>' in line:
            continue
        # Keep the line if it looks like actual lyrics
        clean_lines.append(line)
    
    return '\n'.join(clean_lines)

def step1_analyze_and_generate_clean_lyrics(transcription, target_language="Spanish"):
    """
    Step 1: LLM analyzes the transcription and generates clean lyrics.
    This happens in the utils directory.
    """
    print(f"🧠 Step 1: LLM analyzing and generating clean {target_language} lyrics...")
    
    system_prompt = f"""You are a professional song translator. Your task is to analyze the given transcription and generate clean, translated lyrics.

ANALYSIS PHASE (do this internally):
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

OUTPUT REQUIREMENTS:
- Output ONLY the clean translated lyrics in {target_language}
- Do NOT include any analysis, reasoning, or explanations
- Do NOT include any metadata or formatting
- Maintain the exact same line structure as the original
- Each line should be a direct translation of the corresponding original line
- Start immediately with the first translated line, no introduction"""

    try:
        response = client.chat.completions.create(
            model="Qwen3-32B-thinking-Hackathon",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Translate these lyrics to {target_language}:\n\n{transcription}"}
            ],
            max_completion_tokens=2048,
            temperature=0.3,
        )
        
        raw_translation = response.choices[0].message.content.strip()
        print(f"✅ Step 1 completed - Generated raw translation")
        return raw_translation
        
    except Exception as e:
        print(f"❌ Step 1 failed: {e}")
        return None

def step2_review_and_extract_final_lyrics(raw_translation, target_language):
    """
    Step 2: LLM reviews its own output and extracts only the final clean lyrics.
    """
    print(f"🔍 Step 2: LLM reviewing and extracting final {target_language} lyrics...")
    
    system_prompt = f"""You are a lyrics extraction specialist. Your task is to extract ONLY the final clean lyrics from the given text.

CRITICAL INSTRUCTIONS:
- Look at the provided text and find the actual translated lyrics
- Extract ONLY the translated lyrics, nothing else
- Do NOT include any analysis, reasoning, explanations, or metadata
- Do NOT include any text that is not part of the actual translated lyrics
- Do NOT include phrases like "Here is the translation" or "The lyrics are"
- Do NOT include any thinking process or reasoning
- Start immediately with the first translated line
- Output ONLY the clean translated lyrics in {target_language}"""

    try:
        response = client.chat.completions.create(
            model="Qwen3-32B-thinking-Hackathon",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": f"Extract only the final clean {target_language} lyrics from this text:\n\n{raw_translation}"}
            ],
            max_completion_tokens=1024,
            temperature=0.1,
        )
        
        final_lyrics = response.choices[0].message.content.strip()
        
        # Post-process to remove any remaining reasoning
        final_lyrics = post_process_clean_lyrics(final_lyrics)
        
        print(f"✅ Step 2 completed - Extracted final lyrics")
        return final_lyrics
        
    except Exception as e:
        print(f"❌ Step 2 failed: {e}")
        return raw_translation  # Fallback to raw translation

def process_transcription_with_two_steps(transcription, target_language="Spanish"):
    """
    Process transcription using the two-step system.
    """
    print(f"🎵 Processing {target_language} translation with two-step system")
    print("=" * 60)
    
    # Step 1: Generate clean lyrics
    raw_translation = step1_analyze_and_generate_clean_lyrics(transcription, target_language)
    if not raw_translation:
        return None
    
    # Step 2: Extract final lyrics
    final_lyrics = step2_review_and_extract_final_lyrics(raw_translation, target_language)
    if not final_lyrics:
        return raw_translation
    
    print(f"🎉 Two-step process completed for {target_language}")
    print("=" * 60)
    return final_lyrics

def main():
    """Test the two-step system."""
    print("🎵 Two-Step Lyrics Processing System")
    print("=" * 50)
    
    # Load environment
    load_dotenv()
    
    # Test transcription
    test_transcription = """I go up to work on Monday morning Tuesday I go up to honeymoon. I'll be back again before it's time for sunny down. I'll be lacing on the Sunday afternoon. Bicecling on every Wednesday evening. Thursday I go to the zoo. I come from London town. I'm just an ordinary guy. Fridays I go painting in the moon. I'm bound to be proposing on a Saturday night. I'm leaving on a Sunday. Thursday I go to the zoo."""
    
    # Test with Spanish
    spanish_lyrics = process_transcription_with_two_steps(test_transcription, "Spanish")
    if spanish_lyrics:
        print(f"\n📝 Final Spanish Lyrics:")
        print(spanish_lyrics)
        
        # Save to utils directory
        utils_file = "backend/utils/spanish_lyrics.txt"
        with open(utils_file, "w", encoding="utf-8") as f:
            f.write(spanish_lyrics)
        print(f"\n💾 Saved to: {utils_file}")
    
    print("\n" + "=" * 50)

if __name__ == "__main__":
    main()
