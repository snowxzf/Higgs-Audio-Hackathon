#!/usr/bin/env python3
"""
Translation script for text translation
"""

import sys
import os
import json
from dotenv import load_dotenv

# Add utils to path
sys.path.append(os.path.join(os.path.dirname(__file__)))

def translate_text(text, from_lang, to_lang):
    """Translate text using a real translation API"""
    try:
        # Import OpenAI client for translation
        import openai
        
        # Load environment variables
        load_dotenv()
        
        # Initialize OpenAI client
        client = openai.OpenAI(
            api_key=os.getenv('OPENAI_API_KEY'),
            base_url="https://hackathon.boson.ai/v1"
        )
        
        # Create translation prompt
        translation_prompt = f"""You are a friendly, professional translator. Translate the following text from {from_lang} to {to_lang}.
        
        IMPORTANT INSTRUCTIONS FOR YOUR REASONING:
        - Think through the translation process in a friendly way
        - Use second person ("you", "your") when referring to the reader
        - Be conversational and approachable in your thinking
        - Return ONLY the translated text in your final output
        - Do NOT include any explanations, reasoning, or thinking in the final translation
        - Just provide the clean translation
        
        Text to translate: {text}
        
        Translation:"""
        
        # Call the translation API
        response = client.chat.completions.create(
            model="Qwen3-32B-thinking-Hackathon",
            messages=[
                {"role": "system", "content": "You are a friendly and helpful translator. When thinking through translations, use second person ('you' and 'your') when talking to readers. Be conversational and approachable."},
                {"role": "user", "content": translation_prompt}
            ],
            max_tokens=1000,
            temperature=0.3
        )
        
        translated_text = response.choices[0].message.content.strip()
        
        # Parse the output to separate reasoning from translation
        import re
        # Check if the output contains <think> tags
        reasoning_pattern = r'<think>(.*?)</think>\s*(.*)'
        match = re.search(reasoning_pattern, translated_text, re.DOTALL)
        
        if match:
            # Everything after </think> is the clean translation
            clean_translation = match.group(2).strip() if len(match.groups()) >= 2 and match.group(2) else ""
            
            # Also extract the reasoning for potential display
            reasoning_text = match.group(1).strip() if len(match.groups()) >= 1 and match.group(1) else ""
            
            # Store both values (we'll return the clean translation but could also return reasoning)
            print(f"Translation successful: {from_lang} -> {to_lang}", file=sys.stderr)
            print(f"Clean translation extracted (length: {len(clean_translation)})", file=sys.stderr)
            return clean_translation if clean_translation else "Translation not found in output"
        else:
            # No reasoning tags found, try to find just the clean text
            # Sometimes the output is just clean text at the end
            lines = translated_text.split('\n')
            if len(lines) > 1:
                # Return the last line which is usually the translation
                clean_translation = lines[-1].strip()
                print(f"Translation successful: {from_lang} -> {to_lang}", file=sys.stderr)
                return clean_translation
            else:
                # No reasoning tags found, return as-is (but still clean any stray tags)
                translated_text = re.sub(r'<[^>]*>', '', translated_text)
                translated_text = translated_text.strip()
                print(f"Translation successful: {from_lang} -> {to_lang}", file=sys.stderr)
                return translated_text
        
    except Exception as e:
        print(f"Translation failed: {e}", file=sys.stderr)
        # Fallback: return placeholder
        return f"[Translation to {to_lang} failed] {text}"

if __name__ == "__main__":
    if len(sys.argv) < 4:
        print("Usage: python translate_text.py <text> <from_language> <to_language>", file=sys.stderr)
        sys.exit(1)
    
    text = sys.argv[1]
    from_lang = sys.argv[2]
    to_lang = sys.argv[3]
    
    try:
        translated_text = translate_text(text, from_lang, to_lang)
        
        result = {
            "success": True,
            "translated_text": translated_text,
            "from_language": from_lang,
            "to_language": to_lang
        }
        
        # Output JSON result
        print(json.dumps(result, indent=2))
        
    except Exception as e:
        result = {
            "success": False,
            "error": str(e),
            "translated_text": f"[Translation failed] {text}",
            "from_language": from_lang,
            "to_language": to_lang
        }
        
        # Output JSON result
        print(json.dumps(result, indent=2))
