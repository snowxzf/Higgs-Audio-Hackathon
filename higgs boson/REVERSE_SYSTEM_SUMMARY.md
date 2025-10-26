# Reverse Music Translation System

## Overview
The system has been **reversed** to translate foreign songs **TO English** instead of English songs to foreign languages. This approach should work much better with Boson AI since it excels at English voice generation.

## Core Modules (Kept)

### Audio Processing (Working)
- **`audio_processing.py`** - Audio separation using Demucs (vocals/background)
- **`audio.py`** - Transcription using Higgs Audio Understanding with fallbacks
- **`boson_client.py`** - Boson AI API client

### New Reverse Translation Modules
- **`reverse_song_translator.py`** - Translates foreign lyrics TO English
- **`english_voice_generator.py`** - Generates English voice using the working simple_voice_clone approach
- **`reverse_translation_pipeline.py`** - Complete reverse translation pipeline

### Legacy Modules (Kept for Reference)
- **`song_translator.py`** - Original English→Foreign translator
- **`voice_cloner.py`** - Basic voice cloning
- **`clean_pipeline.py`** - Original pipeline
- **`two_step_lyrics_processor.py`** - Two-step LLM processing
- **`higgs_v2_audio_generator.py`** - Higgs V2 integration

## How It Works

1. **Audio Separation**: Extract vocals and background from foreign song
2. **Transcription**: Convert foreign vocals to text using Higgs Audio Understanding
3. **Language Detection**: Detect the source language (Spanish, French, etc.)
4. **Translation**: Translate foreign lyrics to English using Qwen3-32B
5. **Voice Generation**: Generate English voice using the working simple_voice_clone approach

## Usage

### Test Translation Only
```bash
python test_reverse_translator.py
```

### Full Pipeline
```bash
python backend/utils/reverse_translation_pipeline.py
```

## Key Advantages

1. **Better English Quality**: Boson AI excels at English voice generation
2. **Simpler Pipeline**: No complex timing or chunking needed
3. **Proven Voice Method**: Uses the exact same approach as `simple_voice_clone.wav`
4. **Clean Output**: Focuses on natural English pronunciation

## Files Structure

```
reverse_translation_results/
├── audio_separation/
│   ├── vocals.wav
│   └── background.wav
├── transcriptions/
│   └── foreign_transcription.txt
├── translations/
│   └── english_translation.txt
└── generated_voices/
    └── english_voice.wav
```

## Next Steps

1. Test with a foreign song file
2. Verify English voice quality
3. Fine-tune translation prompts if needed
4. Add support for more languages

The system is now ready to translate foreign songs to English with high-quality voice output!
