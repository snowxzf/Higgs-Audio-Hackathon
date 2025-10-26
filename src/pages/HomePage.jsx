import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import logo from '../assets/Cadence_AI.png';

function HomePage() {
  const navigate = useNavigate();
  const [uploadedFile, setUploadedFile] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [userName, setUserName] = useState('');
  const [audioUrl, setAudioUrl] = useState(null);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [translatedLanguage, setTranslatedLanguage] = useState('Spanish');
  const [showLanguageDropdown, setShowLanguageDropdown] = useState({ current: false, translated: false });
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(0);
  const [audioContext, setAudioContext] = useState(null);
  const [analyser, setAnalyser] = useState(null);
  const [showLogoPopup, setShowLogoPopup] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedData, setProcessedData] = useState(null);
  const [originalLyrics, setOriginalLyrics] = useState([]);
  const [translatedLyrics, setTranslatedLyrics] = useState([]);
  const [detectedLanguage, setDetectedLanguage] = useState('Unknown');
  const [analysisText, setAnalysisText] = useState('');
  const [vocalsUrl, setVocalsUrl] = useState(null);
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const audioRef = useRef(null);
  const fileInputRef = useRef(null);
  const animationFrameRef = useRef(null);

  const moodColors = {
    happy: ['#FFD700', '#FFA500', '#FF6B6B'],
    sad: ['#4A90E2', '#5C6BC0', '#7986CB'],
    energetic: ['#FF1744', '#F50057', '#FF4081'],
    calm: ['#26A69A', '#66BB6A', '#81C784'],
    default: ['#8BC34A', '#9CCC65', '#AED581'],
  };

  const [currentMood, setCurrentMood] = useState('default');
  const [waveformBars, setWaveformBars] = useState([]);

  const languages = [
    'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
    'Japanese', 'Korean', 'Chinese (Mandarin)', 'Chinese (Cantonese)',
    'Arabic', 'Russian', 'Hindi', 'Bengali', 'Urdu', 'Indonesian',
    'Turkish', 'Vietnamese', 'Thai', 'Dutch', 'Greek', 'Hebrew',
    'Swedish', 'Polish', 'Romanian', 'Czech', 'Hungarian', 'Finnish',
    'Danish', 'Norwegian', 'Ukrainian', 'Tagalog', 'Swahili', 'Tamil',
    'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Malayalam', 'Kannada',
  ];

  // Translation function using a real API
  const translateText = async (text, fromLang, toLang) => {
    try {
      // Call the backend translation API
      const response = await fetch('http://localhost:3001/api/translate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          from_language: fromLang,
          to_language: toLang
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.translated_text;
      } else {
        throw new Error('Translation API failed');
      }
    } catch (error) {
      console.error('Translation error:', error);
      // Fallback: return placeholder
      return `[Translation to ${toLang} failed] ${text}`;
    }
  };

  // Process audio file using real transcription API
  // Function to extract clean translation and reasoning from LLM output
  const extractCleanTranslation = (fullText) => {
    if (!fullText) return { cleanTranslation: '', reasoning: '' };
    
    // Try multiple patterns to catch different LLM output formats
    let match;
    
    // Pattern 1: <think>...</think>
    match = fullText.match(/<think>(.*?)<\/think>\s*(.*)/s);
    if (match && match[2]) {
      return {
        cleanTranslation: match[2].trim(),
        reasoning: match[1].trim()
      };
    }
    
    // Pattern 2: <think>...</think>
    match = fullText.match(/<think>(.*?)<\/think>\s*(.*)/s);
    if (match && match[2]) {
      return {
        cleanTranslation: match[2].trim(),
        reasoning: match[1].trim()
      };
    }
    
    // Pattern 3: <think>...</think>
    match = fullText.match(/<think>(.*?)<\/redacted_reasoning>\s*(.*)/s);
    if (match && match[2]) {
      return {
        cleanTranslation: match[2].trim(),
        reasoning: match[1].trim()
      };
    }
    
    // Pattern 4: <reasoning>...</reasoning>
    match = fullText.match(/<reasoning>(.*?)<\/reasoning>\s*(.*)/s);
    if (match && match[2]) {
      return {
        cleanTranslation: match[2].trim(),
        reasoning: match[1].trim()
      };
    }
    
    // Pattern 5: Handle mismatched tags (e.g., <think>...</think>, <think>...</think>)
    match = fullText.match(/<(think|reasoning|redacted_reasoning)>(.*?)<\/(think|reasoning|redacted_reasoning)>\s*(.*)/s);
    if (match && match[4]) {
      return {
        cleanTranslation: match[4].trim(),
        reasoning: match[2] ? match[2].trim() : ''
      };
    }
    
    // Pattern 6: If there's an opening tag but no proper closing tag, try to extract manually
    const openTagMatch = fullText.match(/<(think|reasoning|redacted_reasoning)>/);
    if (openTagMatch) {
      // Find where the tag opens and try to extract everything after it
      const tagIndex = fullText.indexOf('>');
      const reasoningText = fullText.substring(tagIndex + 1);
      // Try to find where the translation starts (look for meaningful text after reasoning)
      // This is a fallback for malformed tags
      return {
        cleanTranslation: reasoningText.trim(),
        reasoning: ''
      };
    }
    
    // Pattern 7: If text starts with tag content (not wrapped), return as translation
    // This handles cases where LLM outputs without tags
    return {
      cleanTranslation: fullText.trim(),
      reasoning: ''
    };
  };

  // Load lyrics from localStorage on component mount
  useEffect(() => {
    const storedOriginalLyrics = JSON.parse(localStorage.getItem('originalLyrics') || '[]');
    const storedTranslatedLyrics = JSON.parse(localStorage.getItem('translatedLyrics') || '[]');
    const storedCurrentLanguage = localStorage.getItem('currentLanguage') || 'English';
    const storedTranslatedLanguage = localStorage.getItem('translatedLanguage') || 'Spanish';
    const storedAnalysis = localStorage.getItem('analysisText') || '';
    const storedVocalsUrl = localStorage.getItem('vocalsUrl');
    const storedBackgroundUrl = localStorage.getItem('backgroundUrl');
    const storedUploadedFileName = localStorage.getItem('uploadedFileName');
    const storedAudioUrl = localStorage.getItem('audioUrl');
    
    if (storedOriginalLyrics.length > 0) {
      setOriginalLyrics(storedOriginalLyrics);
      setTranslatedLyrics(storedTranslatedLyrics);
      setCurrentLanguage(storedCurrentLanguage);
      setTranslatedLanguage(storedTranslatedLanguage);
      setDetectedLanguage(storedCurrentLanguage);
      setAnalysisText(storedAnalysis);
      
      if (storedUploadedFileName) {
        // Create a dummy file object to restore the UI state
        const dummyFile = {
          name: storedUploadedFileName,
          type: 'audio/mpeg'
        };
        setUploadedFile(dummyFile);
        
        // Restore audio URLs if available
        if (storedAudioUrl) setAudioUrl(storedAudioUrl);
        if (storedVocalsUrl) setVocalsUrl(storedVocalsUrl);
        if (storedBackgroundUrl) setBackgroundUrl(storedBackgroundUrl);
      }
    }
  }, []);

  const processAudioFile = async (file) => {
    setIsProcessing(true);
    try {
      console.log(`Processing audio file: ${file.name}`);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('file', file);
      
      // Try to call the backend API first
      try {
        const response = await fetch('http://localhost:8000/process-audio', {
          method: 'POST',
          body: formData,
        });
        
        if (response.ok) {
          const data = await response.json();
          console.log('Backend API response:', data);
          
          if (data.lyrics) {
            setDetectedLanguage(data.lyrics.detected_language || 'Unknown');
            setOriginalLyrics(data.lyrics.original_lyrics || []);
            setTranslatedLyrics(data.lyrics.translated_lyrics || []);
            setCurrentLanguage(data.lyrics.detected_language || 'Unknown');
            return;
          }
        }
      } catch (apiError) {
        console.log('Backend API not available, using direct transcription:', apiError.message);
      }
      
      // Fallback: Call Python transcription directly via a simple endpoint
      // This will use the actual transcription functions from your backend
      const formDataWithLanguages = new FormData();
      formDataWithLanguages.append('file', file);
      formDataWithLanguages.append('inputLanguage', currentLanguage);
      formDataWithLanguages.append('outputLanguage', translatedLanguage);
      
      const transcriptionResponse = await fetch('http://localhost:3001/api/transcribe', {
        method: 'POST',
        body: formDataWithLanguages,
        // Increase timeout to handle long transcription times
        signal: AbortSignal.timeout(300000), // 5 minutes timeout
      });
      
      if (transcriptionResponse.ok) {
        const transcriptionData = await transcriptionResponse.json();
        console.log('Direct transcription response:', transcriptionData);
        
        // Process the transcription data
        const { transcription, translated_transcription, detectedLanguage, duration, vocals_path, background_path } = transcriptionData;
        
        if (transcription && transcription !== "TRANSCRIPTION_FAILED") {
          // Create synchronized lyrics
          const createTimedLyrics = (text, duration) => {
            // Clean the text
            let cleaned = text.replace(/\n+/g, ' ').trim();
            
            // Split on sentence boundaries, preserving the punctuation
            let sentences = cleaned
              .split(/(?<=[.!?])\s+/)
              .filter(s => s.trim().length > 0)
              .map(s => s.trim());
            
            // Further split long sentences at commas or mid-sentence for better synchronization
            const MAX_WORDS_PER_LINE = 12; // Maximum words per lyric line
            const splitSentences = [];
            
            for (const sentence of sentences) {
              const wordCount = sentence.split(/\s+/).length;
              
              if (wordCount > MAX_WORDS_PER_LINE) {
                // Split long sentences intelligently
                // First try to split at commas
                const commaSplit = sentence.split(/(?<=,\s+)/);
                
                if (commaSplit.length > 1 && commaSplit.some(part => part.trim().split(/\s+/).length > MAX_WORDS_PER_LINE)) {
                  // If commas don't help enough, split by word count
                  const words = sentence.split(/\s+/);
                  let currentLine = [];
                  
                  for (const word of words) {
                    currentLine.push(word);
                    
                    if (currentLine.length >= MAX_WORDS_PER_LINE) {
                      splitSentences.push(currentLine.join(' '));
                      currentLine = [];
                    }
                  }
                  
                  if (currentLine.length > 0) {
                    splitSentences.push(currentLine.join(' '));
                  }
                } else {
                  // Use comma-based splitting
                  splitSentences.push(...commaSplit.map(s => s.trim()).filter(s => s.length > 0));
                }
              } else {
                splitSentences.push(sentence);
              }
            }
            
            sentences = splitSentences;
            
            if (!sentences.length) return [];
            
            // Estimate time per sentence based on word count (assuming ~150 words per minute)
            const wordsPerMinute = 150;
            const timePerWord = 60 / wordsPerMinute;
            
            const timedLyrics = [];
            let currentTime = 0;
            
            for (let i = 0; i < sentences.length; i++) {
              const sentence = sentences[i];
              const wordCount = sentence.split(/\s+/).length;
              const sentenceDuration = wordCount * timePerWord;
              
              // Make sure we don't exceed the total duration
              if (currentTime + sentenceDuration > duration) {
                const remainingTime = duration - currentTime;
                if (remainingTime > 0 && sentence.length > 0) {
                  timedLyrics.push({
                    text: sentence,
                    start: currentTime,
                    end: duration,
                    duration: remainingTime
                  });
                }
                break;
              }
              
              if (sentence.length > 0) {
                timedLyrics.push({
                  text: sentence,
                  start: currentTime,
                  end: currentTime + sentenceDuration,
                  duration: sentenceDuration
                });
              }
              
              currentTime += sentenceDuration;
            }
            
            // If we have remaining time, extend the last lyric
            if (timedLyrics.length > 0 && currentTime < duration) {
              const lastLyric = timedLyrics[timedLyrics.length - 1];
              lastLyric.end = duration;
              lastLyric.duration = duration - lastLyric.start;
            }
            
            return timedLyrics;
          };
          
          const originalLyrics = createTimedLyrics(transcription, duration || 12);
          
          // Use translated text from backend if available, otherwise translate on frontend
          let translatedLyrics = originalLyrics;
          if (translated_transcription) {
            // Extract clean translation and reasoning from LLM output
            const { cleanTranslation, reasoning } = extractCleanTranslation(translated_transcription);
            
            // Use the SAME timing structure as original, just swap the text
            // Split translated text by sentences
            const translatedSentences = cleanTranslation
              .replace(/\n+/g, ' ')
              .split(/(?<=[.!?])\s+/)
              .filter(s => s.trim().length > 0)
              .map(s => s.trim());
            
            // Map translated sentences to original timing
            translatedLyrics = originalLyrics.map((lyric, index) => {
              const translatedText = translatedSentences[index] || `[${translatedLanguage} translation]`;
              return {
                ...lyric, // Keep the same timing (start, end, duration)
                text: translatedText
              };
            });
            
            setAnalysisText(reasoning);
          } else if (translatedLanguage !== currentLanguage) {
            try {
              // Simple translation using a basic approach
              const translatedText = await translateText(transcription, currentLanguage, translatedLanguage);
              
              // Use the SAME timing structure as original
              const translatedSentences = translatedText
                .replace(/\n+/g, ' ')
                .split(/(?<=[.!?])\s+/)
                .filter(s => s.trim().length > 0)
                .map(s => s.trim());
              
              translatedLyrics = originalLyrics.map((lyric, index) => {
                const translatedText = translatedSentences[index] || `[${translatedLanguage} translation]`;
                return {
                  ...lyric, // Keep the same timing
                  text: translatedText
                };
              });
            } catch (translationError) {
              console.log('Translation failed, using original lyrics:', translationError);
              // If translation fails, show placeholder text
              translatedLyrics = originalLyrics.map(lyric => ({
                ...lyric,
                text: `[${translatedLanguage} translation coming soon]`
              }));
            }
          }
          
          setDetectedLanguage(currentLanguage);
          setOriginalLyrics(originalLyrics);
          setTranslatedLyrics(translatedLyrics);
          setCurrentLanguage(currentLanguage);
          
          // Save lyrics to localStorage for Karaoke page (will be completed after URLs are set)
          localStorage.setItem('originalLyrics', JSON.stringify(originalLyrics));
          localStorage.setItem('translatedLyrics', JSON.stringify(translatedLyrics));
          localStorage.setItem('currentLanguage', currentLanguage);
          localStorage.setItem('translatedLanguage', translatedLanguage);
          localStorage.setItem('analysisText', analysisText);
          localStorage.setItem('uploadedFileName', file.name);
          
          // Update the uploadedSongs entry with lyrics data for Previous Songs page
          const existingUploads = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
          const currentAudioUrl = localStorage.getItem('audioUrl'); // Get the blob URL from localStorage
          const updatedUploads = existingUploads.map(upload => {
            if (upload.name === file.name) {
              return {
                ...upload,
                originalLyrics,
                translatedLyrics,
                currentLanguage,
                translatedLanguage,
                analysisText,
                vocalsUrl: vocals_path ? `http://localhost:3001/api/audio/vocals/${vocals_path.split('/').pop()}` : null,
                backgroundUrl: background_path ? `http://localhost:3001/api/audio/background/${background_path.split('/').pop()}` : null,
                audioUrl: currentAudioUrl, // Keep the blob URL from localStorage
                detectedLanguage
              };
            }
            return upload;
          });
          localStorage.setItem('uploadedSongs', JSON.stringify(updatedUploads));
          
          console.log('✅ Transcript complete! originalLyrics length:', originalLyrics.length, 'isProcessing:', isProcessing);
          console.log('✅ Buttons should be ENABLED. originalLyrics.length > 0:', originalLyrics.length > 0);
          
          // Load separated audio files if paths are provided
          if (vocals_path || background_path) {
            // Extract filenames from paths
            if (vocals_path) {
              const vocalsFilename = vocals_path.split('/').pop();
              const vocalsUrlValue = `http://localhost:3001/api/audio/vocals/${vocalsFilename}`;
              setVocalsUrl(vocalsUrlValue);
              localStorage.setItem('vocalsUrl', vocalsUrlValue);
              console.log('Vocals URL:', vocalsUrlValue);
            }
            
            if (background_path) {
              const backgroundFilename = background_path.split('/').pop();
              const backgroundUrlValue = `http://localhost:3001/api/audio/background/${backgroundFilename}`;
              setBackgroundUrl(backgroundUrlValue);
              localStorage.setItem('backgroundUrl', backgroundUrlValue);
              console.log('Background URL:', backgroundUrlValue);
            }
          }
          
          console.log('Transcription completed:', {
            inputLanguage: currentLanguage,
            outputLanguage: translatedLanguage,
            originalLyrics: originalLyrics.length,
            duration: duration
          });
        } else {
          throw new Error('Transcription failed');
        }
      } else {
        throw new Error('Transcription API failed');
      }
      
    } catch (error) {
      console.error('Error processing audio:', error);
      
      // Check if it's a timeout error
      let errorMessage = "Error: Could not transcribe audio";
      if (error.name === 'TimeoutError' || error.message.includes('timeout')) {
        errorMessage = "Processing timed out - audio may be too long";
      } else if (error.message.includes('Failed to fetch')) {
        errorMessage = "Cannot connect to transcription server";
      }
      
      // Final fallback: Show error message
      const errorLyrics = [
        { text: errorMessage, start: 0, end: 3, duration: 3 },
        { text: "Please check your file format", start: 3, end: 6, duration: 3 },
        { text: "Supported: MP3, WAV, M4A", start: 6, end: 9, duration: 3 },
      ];
      
      setDetectedLanguage('Error');
      setOriginalLyrics(errorLyrics);
      setTranslatedLyrics(errorLyrics);
    } finally {
      setIsProcessing(false);
    }
  };

  // Check if this is the first visit
  useEffect(() => {
    const hasVisited = localStorage.getItem('hasVisitedHomePage');
    if (!hasVisited) {
      setShowLogoPopup(true);
      localStorage.setItem('hasVisitedHomePage', 'true');
    }
  }, []);

  useEffect(() => {
    if (uploadedFile) {
      const bars = Array.from({ length: 100 }, () => ({
        height: Math.random() * 100 + 20,
        animationDelay: Math.random() * 2,
      }));
      setWaveformBars(bars);

      const moods = ['happy', 'sad', 'energetic', 'calm'];
      setCurrentMood(moods[Math.floor(Math.random() * moods.length)]);
    }
  }, [uploadedFile]);

  useEffect(() => {
    if (audioRef.current && uploadedFile && !audioContext) {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const analyzerNode = context.createAnalyser();
      analyzerNode.fftSize = 256;

      const source = context.createMediaElementSource(audioRef.current);
      source.connect(analyzerNode);
      analyzerNode.connect(context.destination);

      setAudioContext(context);
      setAnalyser(analyzerNode);
    }
  }, [uploadedFile, audioContext]);

  useEffect(() => {
    if (analyser && isPlaying) {
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const animate = () => {
        analyser.getByteFrequencyData(dataArray);

        const newBars = Array.from({ length: 100 }, (_, i) => {
          const index = Math.floor((i / 100) * bufferLength);
          const value = dataArray[index] || 0;
          return {
            height: (value / 255) * 100 + 20,
            animationDelay: 0,
          };
        });

        setWaveformBars(newBars);
        animationFrameRef.current = requestAnimationFrame(animate);
      };

      animate();

      return () => {
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
      };
    }
  }, [analyser, isPlaying]);

  useEffect(() => {
    if (audioRef.current && isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime(audioRef.current.currentTime);
      }, 100);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  useEffect(() => {
    if (audioRef.current) {
      const handleLoadedMetadata = () => {
        setAudioDuration(audioRef.current.duration);
      };
      audioRef.current.addEventListener('loadedmetadata', handleLoadedMetadata);
      return () => {
        if (audioRef.current) {
          audioRef.current.removeEventListener('loadedmetadata', handleLoadedMetadata);
        }
      };
    }
  }, [uploadedFile]);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('audio/')) {
      setUploadedFile(file);
      const url = URL.createObjectURL(file);
      setAudioUrl(url);
      
      // Save audioUrl to localStorage for playback
      localStorage.setItem('audioUrl', url);

      // Save to localStorage for Previous Songs page
      const newUpload = {
        id: Date.now(),
        name: file.name,
        uploadDate: new Date().toLocaleDateString(),
        audioUrl: url
      };

      const existingUploads = JSON.parse(localStorage.getItem('uploadedSongs') || '[]');
      localStorage.setItem('uploadedSongs', JSON.stringify([newUpload, ...existingUploads]));

      // Process the audio file with the backend
      await processAudioFile(file);
    }
  };

  const handlePlayPause = async () => {
    console.log('handlePlayPause called. audioRef.current:', audioRef.current, 'audioUrl:', audioUrl, 'isPlaying:', isPlaying);
    if (audioRef.current && audioUrl) {
      try {
      if (isPlaying) {
        audioRef.current.pause();
          setIsPlaying(false);
      } else {
          await audioRef.current.play();
          setIsPlaying(true);
        }
      } catch (error) {
        console.error('Error playing audio:', error);
      }
    } else {
      console.error('Cannot play: audioRef or audioUrl missing');
    }
  };

  const handleGoToKaraoke = () => {
    navigate('/karaoke');
  };
  
  const handleGoHome = () => {
    // Clear localStorage first to prevent cached data from being loaded
    localStorage.removeItem('uploadedFile');
    localStorage.removeItem('audioUrl');
    localStorage.removeItem('originalLyrics');
    localStorage.removeItem('translatedLyrics');
    localStorage.removeItem('analysisText');
    localStorage.removeItem('vocalsUrl');
    localStorage.removeItem('backgroundUrl');
    localStorage.removeItem('currentLanguage');
    localStorage.removeItem('translatedLanguage');
    localStorage.removeItem('uploadedFileName');
    
    // Reset all states to go back to upload page
    setUploadedFile(null);
    setAudioUrl(null);
    setIsPlaying(false);
    setCurrentTime(0);
    setAudioDuration(0);
    setOriginalLyrics([]);
    setTranslatedLyrics([]);
    setAnalysisText('');
    setVocalsUrl(null);
    setBackgroundUrl(null);
    setDetectedLanguage('');
    setIsProcessing(false);
    
    // Force navigation to trigger a complete page reset
    window.location.href = '/';
  };

  const handleDownloadAudio = () => {
    // Download vocals
    if (vocalsUrl) {
      const a = document.createElement('a');
      a.href = vocalsUrl;
      a.download = `vocals_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (uploadedFile && audioUrl) {
      // Fallback to original audio if vocals not available
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = uploadedFile.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadMusic = () => {
    // Download background/instrumental
    if (backgroundUrl) {
      const a = document.createElement('a');
      a.href = backgroundUrl;
      a.download = `instrumental_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } else if (uploadedFile && audioUrl) {
      // Fallback to original audio if background not available
      const a = document.createElement('a');
      a.href = audioUrl;
      a.download = `instrumental_${uploadedFile.name}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const isLyricActive = (lyric) => currentTime >= lyric.start && currentTime < lyric.end;

  const LanguageSelector = ({ label, value, onChange, isOpen, toggleOpen }) => (
    <div className="relative">
      <button
        onClick={toggleOpen}
        className="bg-white hover:bg-gray-50 border-2 border-gray-300 px-6 py-3 rounded-lg min-w-[160px] text-left transition-colors"
      >
        <div className="text-xs text-gray-500 mb-1">{label}</div>
        <div className="font-medium text-black">{value}</div>
      </button>
      {isOpen && (
        <div className="absolute top-full mt-2 bg-white border-2 border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto z-50 min-w-[160px]">
          {languages.map(lang => (
            <button
              key={lang}
              onClick={() => {
                onChange(lang);
                toggleOpen();
              }}
              className="w-full px-4 py-2 text-left hover:bg-purple-100 transition-colors"
            >
              {lang}
            </button>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-200 relative">
      {/* Add pulse animation CSS */}
      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; transform: scaleY(0.8); }
          50% { opacity: 0.9; transform: scaleY(1.2); }
        }
      `}</style>
      
      {/* Logo Popup - Only shows on first visit */}
      {showLogoPopup && (
        <div className="logo-popup">
          <img src={logo} alt="Cadence AI Logo" />
        </div>
      )}

      {uploadedFile && (
        <div className="absolute left-0 right-0 flex items-center justify-center z-20" style={{ top: '140px', height: '200px' }}>
          {/* Waveform background - behind buttons */}
          <div className="absolute inset-0 flex items-center justify-center gap-1 h-48 opacity-40 pointer-events-none">
            {waveformBars.map((bar, i) => (
              <div
                key={i}
                className="w-1 bg-gradient-to-t rounded-full transition-all duration-300"
                style={{
                  height: `${bar.height}%`,
                  background: `linear-gradient(to top, ${moodColors[currentMood][0]}, ${moodColors[currentMood][1]}, ${moodColors[currentMood][2]})`,
                  animation: isPlaying ? `pulse ${2 + (i % 3)}s ease-in-out infinite` : 'none',
                  animationDelay: `${i * 0.05}s`
                }}
              />
            ))}
          </div>
          {/* Buttons - in front, clickable */}
          <div className="flex items-center gap-4 relative z-30">
              {/* Blue Button (Left) - Go to Karaoke */}
              <button
                onClick={() => {
                  console.log('Karaoke button clicked');
                  handleGoToKaraoke();
                }}
                disabled={isProcessing || originalLyrics.length === 0}
                className={`p-4 rounded-full transition-colors shadow-lg ${
                  isProcessing || originalLyrics.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-blue-500 hover:bg-blue-600'
                } text-white`}
                title={isProcessing ? 'Processing transcript... Please wait' : originalLyrics.length === 0 ? 'Waiting for transcript...' : 'Go to Karaoke Page'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </button>

              {/* Purple Button (Middle) - Play/Pause */}
              <button
                onClick={() => {
                  console.log('Play/Pause button clicked');
                  handlePlayPause();
                }}
                disabled={isProcessing || originalLyrics.length === 0}
                className={`p-4 rounded-full transition-colors shadow-lg ${
                  isProcessing || originalLyrics.length === 0
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-purple-600 hover:bg-purple-700'
                } text-white`}
                title={isProcessing ? 'Processing transcript... Please wait' : originalLyrics.length === 0 ? 'Waiting for transcript...' : 'Play/Pause audio'}
              >
                {isPlaying ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                )}
              </button>

              {/* Green Button (Right) - Upload */}
              <button
                onClick={() => {
                  console.log('Upload button clicked');
                  handleGoHome();
                }}
                disabled={isProcessing}
                className={`p-4 rounded-full transition-colors shadow-lg ${
                  isProcessing
                    ? 'bg-gray-400 cursor-not-allowed'
                    : 'bg-green-500 hover:bg-green-600'
                } text-white`}
                title={isProcessing ? 'Processing transcript... Please wait' : 'Upload New Song'}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </button>
          </div>
        </div>
      )}

      <Navbar />

      <div className="relative z-10 flex flex-col items-center justify-center px-8" style={{ marginTop: uploadedFile ? '10px' : '48px' }}>
        <div className={`transition-all duration-500 ${uploadedFile ? 'mb-2' : 'mb-8'}`}>
          <input
            type="text"
            placeholder="Cadence AI"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className={`font-bold text-center bg-transparent border-none outline-none placeholder-black text-black transition-all duration-500 ${
              uploadedFile ? 'text-xl' : 'text-3xl'
            }`}
          />
        </div>

        <div className={`w-full max-w-md transition-all duration-500 ${uploadedFile ? 'mb-2' : 'mb-6'}`}>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            onChange={handleFileUpload}
            className="hidden"
          />
          {uploadedFile ? (
            <div className="w-full bg-green-400 bg-opacity-50 backdrop-blur-sm rounded-lg flex items-center justify-center gap-3 shadow-lg py-2 px-4">
              <svg className="w-4 h-4 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-black text-sm flex-1 text-center">
                {uploadedFile.name}
              </span>
            </div>
          ) : (
            <button
              onClick={() => fileInputRef.current.click()}
              className="w-full bg-green-400 hover:bg-green-500 transition-colors rounded-lg py-8 flex items-center justify-center gap-4 shadow-lg"
            >
              <svg className="w-8 h-8 text-black" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
              <span className="font-medium text-black text-xl">
                Upload Audio File
              </span>
            </button>
          )}
        </div>

        {!uploadedFile && (
          <div className="flex items-center gap-4 mb-12">
            <LanguageSelector
              label="Current Language"
              value={currentLanguage}
              onChange={setCurrentLanguage}
              isOpen={showLanguageDropdown.current}
              toggleOpen={() => setShowLanguageDropdown(prev => ({ ...prev, current: !prev.current }))}
            />
            <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
            </svg>
            <LanguageSelector
              label="Translated Language"
              value={translatedLanguage}
              onChange={setTranslatedLanguage}
              isOpen={showLanguageDropdown.translated}
              toggleOpen={() => setShowLanguageDropdown(prev => ({ ...prev, translated: !prev.translated }))}
            />
          </div>
        )}

        {uploadedFile && (
          <div className="mb-48">
            <audio ref={audioRef} src={audioUrl} onEnded={() => setIsPlaying(false)} crossOrigin="anonymous" />
          </div>
        )}

        {uploadedFile && (
          <div className="w-full max-w-6xl mb-12">
            {isProcessing ? (
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-8 text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
                <h3 className="text-xl font-bold text-gray-800 mb-2">Processing Audio...</h3>
                <p className="text-gray-600">Separating vocals, transcribing lyrics, and translating... (This may take 2-5 minutes)</p>
              </div>
            ) : (
              <div className="space-y-6">
            <div className="grid grid-cols-2 gap-6">
              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-purple-600 pb-2">
                      Original ({detectedLanguage || currentLanguage})
                </h3>
                <div className="space-y-4">
                      {originalLyrics.length > 0 ? (
                        originalLyrics.map((lyric, index) => (
                    <p
                      key={index}
                      className={`text-lg transition-all duration-300 ${
                        isLyricActive(lyric)
                          ? 'text-purple-600 font-bold scale-105 bg-purple-50 p-2 rounded'
                          : 'text-gray-600'
                      }`}
                    >
                      {lyric.text}
                    </p>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No lyrics available</p>
                      )}
                </div>
              </div>

              <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-green-500 pb-2">
                  Translated ({translatedLanguage})
                </h3>
                <div className="space-y-4">
                      {translatedLyrics.length > 0 ? (
                        translatedLyrics.map((lyric, index) => (
                    <p
                      key={index}
                      className={`text-lg transition-all duration-300 ${
                        isLyricActive(lyric)
                          ? 'text-green-600 font-bold scale-105 bg-green-50 p-2 rounded'
                          : 'text-gray-600'
                      }`}
                    >
                      {lyric.text}
                    </p>
                        ))
                      ) : (
                        <p className="text-gray-500 italic">No translation available</p>
                      )}
                    </div>
                  </div>
                </div>

                {analysisText && (
                  <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-blue-500 pb-2">
                      Analysis
                    </h3>
                    <div className="max-h-60 overflow-y-auto">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">
                        {analysisText}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            )}
            </div>
        )}

        {/* Download Buttons - Only shown when file is uploaded */}
        {uploadedFile && (
          <div className="w-full max-w-6xl mb-12 flex justify-center gap-6">
            <button
              onClick={handleDownloadAudio}
              disabled={isProcessing || !vocalsUrl}
              className={`px-8 py-4 rounded-lg flex items-center gap-3 transition-colors shadow-lg ${
                isProcessing || !vocalsUrl
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700'
              } text-white`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
              </svg>
              <span className="font-semibold text-lg">
                {isProcessing ? 'Processing...' : 'Download Vocals'}
              </span>
            </button>

            <button
              onClick={handleDownloadMusic}
              disabled={isProcessing || !backgroundUrl}
              className={`px-8 py-4 rounded-lg flex items-center gap-3 transition-colors shadow-lg ${
                isProcessing || !backgroundUrl
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-green-600 hover:bg-green-700'
              } text-white`}
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="font-semibold text-lg">
                {isProcessing ? 'Processing...' : 'Download Instrumental'}
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default HomePage;