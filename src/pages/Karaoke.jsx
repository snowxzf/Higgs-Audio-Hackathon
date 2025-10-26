import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

function Karaoke() {
  const navigate = useNavigate();
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [bgGradient, setBgGradient] = useState('from-gray-900 via-gray-800 to-gray-900');
  const [currentTime, setCurrentTime] = useState(0);
  const [targetGradient, setTargetGradient] = useState('from-gray-900 via-gray-800 to-gray-900');

  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const chunksRef = useRef([]);
  const animationIdRef = useRef(null);
  const streamRef = useRef(null);
  const gradientTransitionRef = useRef(null);

  // Get lyrics from localStorage (stored from HomePage)
  const [originalLyrics, setOriginalLyrics] = useState([]);
  const [translatedLyrics, setTranslatedLyrics] = useState([]);
  const [currentLanguage, setCurrentLanguage] = useState('English');
  const [translatedLanguage, setTranslatedLanguage] = useState('Spanish');
  const [hasLyrics, setHasLyrics] = useState(false);
  
  // Background audio control state
  const [backgroundUrl, setBackgroundUrl] = useState(null);
  const [isBackgroundPlaying, setIsBackgroundPlaying] = useState(false);
  const [shouldPlayDuringRecording, setShouldPlayDuringRecording] = useState(false);
  const backgroundAudioRef = useRef(null);

  // Load lyrics and background audio from localStorage on component mount
  useEffect(() => {
    const storedOriginalLyrics = JSON.parse(localStorage.getItem('originalLyrics') || '[]');
    const storedTranslatedLyrics = JSON.parse(localStorage.getItem('translatedLyrics') || '[]');
    const storedCurrentLanguage = localStorage.getItem('currentLanguage') || 'English';
    const storedTranslatedLanguage = localStorage.getItem('translatedLanguage') || 'Spanish';
    const storedBackgroundUrl = localStorage.getItem('backgroundUrl');
    
    if (storedOriginalLyrics.length > 0) {
      setOriginalLyrics(storedOriginalLyrics);
      setTranslatedLyrics(storedTranslatedLyrics);
      setCurrentLanguage(storedCurrentLanguage);
      setTranslatedLanguage(storedTranslatedLanguage);
      setHasLyrics(true);
      
      // Load background audio URL if available
      if (storedBackgroundUrl) {
        setBackgroundUrl(storedBackgroundUrl);
      }
    } else {
      setHasLyrics(false);
    }
  }, []);

  useEffect(() => {
    if (targetGradient !== bgGradient) {
      if (gradientTransitionRef.current) {
        clearTimeout(gradientTransitionRef.current);
      }
      gradientTransitionRef.current = setTimeout(() => {
        setBgGradient(targetGradient);
      }, 50);
    }
    return () => {
      if (gradientTransitionRef.current) {
        clearTimeout(gradientTransitionRef.current);
      }
    };
  }, [targetGradient, bgGradient]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (isRecording) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = (Date.now() - startTime) / 1000;
        setCurrentTime(elapsed);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(0);
    }
  }, [isRecording]);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return;

    animationIdRef.current = requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);

    const WIDTH = canvas.width;
    const HEIGHT = canvas.height;
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    const barWidth = (WIDTH / dataArray.length) * 2.5;
    let x = 0;
    let avg = 0;

    for (let i = 0; i < dataArray.length; i++) {
      const barHeight = dataArray[i] * 3;
      avg += barHeight;
      const r = barHeight + 25 * (i / dataArray.length);
      const g = 250 * (i / dataArray.length);
      const b = 50;
      ctx.fillStyle = `rgb(${r},${g},${b})`;
      ctx.fillRect(x, HEIGHT - barHeight, barWidth, barHeight);
      x += barWidth + 1;
    }

    avg /= dataArray.length;
    let newGradient;
    if (avg < 60) {
      newGradient = 'from-blue-900 via-blue-700 to-blue-900';
    } else if (avg < 120) {
      newGradient = 'from-yellow-600 via-orange-500 to-yellow-600';
    } else {
      newGradient = 'from-red-700 via-red-900 to-red-700';
    }

    if (newGradient !== targetGradient) {
      setTargetGradient(newGradient);
    }
  };

  const handleRecord = async () => {
    if (isRecording) {
      // Stop recording
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      
      // Stop background music if playing
      if (backgroundAudioRef.current && isBackgroundPlaying) {
        backgroundAudioRef.current.pause();
        backgroundAudioRef.current.currentTime = 0; // Reset to start
        setIsBackgroundPlaying(false);
      }
      
      setIsRecording(false);
      setBgGradient('from-gray-900 via-gray-800 to-gray-900');
      setTargetGradient('from-gray-900 via-gray-800 to-gray-900');
    } else {
      // Start recording
      try {
        // Play background music if enabled
        if (shouldPlayDuringRecording && backgroundAudioRef.current) {
          backgroundAudioRef.current.play();
          setIsBackgroundPlaying(true);
        }
        
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;

        mediaRecorderRef.current = new MediaRecorder(stream);
        audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)();
        sourceRef.current = audioCtxRef.current.createMediaStreamSource(stream);
        analyserRef.current = audioCtxRef.current.createAnalyser();
        analyserRef.current.fftSize = 256;
        const bufferLength = analyserRef.current.frequencyBinCount;
        dataArrayRef.current = new Uint8Array(bufferLength);
        sourceRef.current.connect(analyserRef.current);

        drawVisualizer();

        chunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (e) => {
          if (e.data.size > 0) {
            chunksRef.current.push(e.data);
          }
        };

        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const timestamp = new Date().toLocaleString();
          setRecordings(prev => [...prev, { url, timestamp, id: Date.now() }]);
          chunksRef.current = [];
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
      } catch (error) {
        console.error('Error accessing microphone:', error);
        alert('Could not access microphone. Please allow microphone permissions.');
      }
    }
  };

  const downloadRecording = (url, id) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = `karaoke_recording_${id}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const deleteRecording = (id) => {
    setRecordings(prev => prev.filter(rec => rec.id !== id));
  };

  const isLyricActive = (lyric) => currentTime >= lyric.startTime && currentTime < lyric.endTime;

  return (
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} transition-all duration-[2000ms] ease-in-out`}>
      {/* Navbar */}
      <div className="relative z-30 bg-white">
        <Navbar />
      </div>
      
      {/* Background Music Controls - Top Right Corner */}
      {backgroundUrl && hasLyrics && (
        <div className="absolute top-32 right-8 z-20">
          <h4 className="text-sm font-semibold text-white mb-3">Instrumental Settings</h4>
          
          {/* Listen to instrumental button */}
          <div className="flex items-center justify-between gap-3 mb-3">
            <span className="text-sm text-white">Listen to instrumental</span>
            <button
              onClick={() => {
                if (backgroundAudioRef.current) {
                  if (isBackgroundPlaying) {
                    backgroundAudioRef.current.pause();
                    backgroundAudioRef.current.currentTime = 0;
                    setIsBackgroundPlaying(false);
                  } else {
                    backgroundAudioRef.current.play();
                    setIsBackgroundPlaying(true);
                  }
                }
              }}
              className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded-full transition-colors flex-shrink-0"
              title={isBackgroundPlaying ? 'Pause instrumental' : 'Play instrumental'}
            >
              {isBackgroundPlaying ? (
                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>
          
          {/* Play during recording toggle */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-sm text-white">Play during recording</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={shouldPlayDuringRecording}
                onChange={(e) => setShouldPlayDuringRecording(e.target.checked)}
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
            </label>
          </div>
        </div>
      )}

      {/* Visualizer Area */}
      <div className="relative flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        
        {/* Hidden audio element for background music */}
        {backgroundUrl && (
          <audio ref={backgroundAudioRef} src={backgroundUrl} />
        )}

        {!hasLyrics ? (
          /* Welcome Screen - Show when no lyrics uploaded */
          <div className="relative z-10 flex flex-col items-center justify-center gap-6 max-w-2xl mx-auto px-8 text-center">
            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-8">
              <h2 className="text-3xl font-bold text-gray-800 mb-4">Welcome to Karaoke Mode!</h2>
              <p className="text-lg text-gray-700 mb-4">
                Upload a song on the Home page to get started with karaoke.
              </p>
              <p className="text-base text-gray-600 mb-6">
                Once you've uploaded your song, you can record yourself singing along with the lyrics
                displayed in both the original and translated languages, with a real-time audio visualizer
                that reacts to your voice!
              </p>
              <button
                onClick={() => navigate('/')}
                className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-lg"
              >
                Go to Home to Upload
              </button>
            </div>
          </div>
        ) : (
          /* Karaoke Interface - Show when lyrics are available */
          <div className="relative z-10 flex items-center justify-center gap-8 max-w-7xl mx-auto px-8">
          {/* Original Lyrics - Left Side */}
          <div className="flex-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-purple-600 pb-2">
              Original ({currentLanguage})
            </h3>
            <div className="space-y-3">
              {originalLyrics.map((lyric, index) => (
                <p
                  key={index}
                  className={`text-base transition-all duration-300 ${isLyricActive(lyric)
                      ? 'text-purple-600 font-bold scale-105 bg-purple-50 p-2 rounded'
                      : 'text-gray-600'
                    }`}
                >
                  {lyric.text}
                </p>
              ))}
            </div>
          </div>

          {/* Play/Record Button - Center */}
          <div className="flex-shrink-0">
            <button
              onClick={handleRecord}
              className={`w-20 h-20 rounded-full border-none cursor-pointer transition-all duration-300 flex items-center justify-center ${isRecording
                  ? 'bg-red-900 shadow-2xl'
                  : 'bg-red-600 shadow-xl hover:bg-red-700'
                } ${isRecording ? 'animate-pulse' : ''}`}
            >
              {isRecording ? (
                <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 24 24">
                  <rect x="6" y="4" width="4" height="16" />
                  <rect x="14" y="4" width="4" height="16" />
                </svg>
              ) : (
                <svg className="w-8 h-8 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          </div>

          {/* Translated Lyrics - Right Side */}
          <div className="flex-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-green-500 pb-2">
              Translated ({translatedLanguage})
            </h3>
            <div className="space-y-3">
              {translatedLyrics.map((lyric, index) => (
                <p
                  key={index}
                  className={`text-base transition-all duration-300 ${isLyricActive(lyric)
                      ? 'text-green-600 font-bold scale-105 bg-green-50 p-2 rounded'
                      : 'text-gray-600'
                    }`}
                >
                  {lyric.text}
                </p>
              ))}
            </div>
          </div>

            {/* Recordings List */}
            {recordings.length > 0 && (
          <div className="absolute bottom-8 right-8 bg-black bg-opacity-50 backdrop-blur-md rounded-lg p-4 max-w-md max-h-96 overflow-y-auto z-20">
            <h3 className="text-white text-lg font-semibold mb-3">Recordings</h3>
            <div className="space-y-2">
              {recordings.map((recording) => (
                <div key={recording.id} className="bg-white bg-opacity-10 rounded-lg p-3 flex items-center justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm mb-2">{recording.timestamp}</p>
                    <audio controls className="w-full h-8">
                      <source src={recording.url} type="audio/webm" />
                    </audio>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => downloadRecording(recording.url, recording.id)}
                      className="bg-blue-600 hover:bg-blue-700 text-white p-2 rounded-full transition-colors"
                      title="Download"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                      </svg>
                    </button>
                    <button
                      onClick={() => deleteRecording(recording.id)}
                      className="bg-red-600 hover:bg-red-700 text-white p-2 rounded-full transition-colors"
                      title="Delete"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default Karaoke;