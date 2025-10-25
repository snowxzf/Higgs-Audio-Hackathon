import React, { useState, useEffect, useRef } from 'react';
import Navbar from '../components/Navbar';

function Karaoke() {
  const [isRecording, setIsRecording] = useState(false);
  const [recordings, setRecordings] = useState([]);
  const [bgGradient, setBgGradient] = useState('from-gray-900 via-gray-800 to-gray-900');
  const [currentTime, setCurrentTime] = useState(0);
  
  const canvasRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const analyserRef = useRef(null);
  const audioCtxRef = useRef(null);
  const sourceRef = useRef(null);
  const dataArrayRef = useRef(null);
  const chunksRef = useRef([]);
  const animationIdRef = useRef(null);
  const streamRef = useRef(null);

  // Sample lyrics for demonstration
  const originalLyrics = [
    { text: "Start recording your karaoke performance", startTime: 0, endTime: 3 },
    { text: "Sing along with your favorite songs", startTime: 3, endTime: 6 },
    { text: "Watch the visualizer react to your voice", startTime: 6, endTime: 9 },
    { text: "Download your recordings when done", startTime: 9, endTime: 12 },
  ];

  const translatedLyrics = [
    { text: "Comienza a grabar tu actuación de karaoke", startTime: 0, endTime: 3 },
    { text: "Canta junto con tus canciones favoritas", startTime: 3, endTime: 6 },
    { text: "Mira cómo el visualizador reacciona a tu voz", startTime: 6, endTime: 9 },
    { text: "Descarga tus grabaciones cuando termines", startTime: 9, endTime: 12 },
  ];

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
      const interval = setInterval(() => {
        setCurrentTime(prev => prev + 0.1);
      }, 100);
      return () => clearInterval(interval);
    } else {
      setCurrentTime(0);
    }
  }, [isRecording]);

  const drawVisualizer = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const analyser = analyserRef.current;
    const dataArray = dataArrayRef.current;

    if (!analyser || !dataArray) return;

    animationIdRef.current = requestAnimationFrame(drawVisualizer);
    analyser.getByteFrequencyData(dataArray);
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Calculate number of bars to display across the width
    const numBars = 150;
    const barWidth = canvas.width / numBars;
    const barSpacing = 2;
    let avg = 0;

    // Draw frequency bars from bottom
    for (let i = 0; i < numBars; i++) {
      const dataIndex = Math.floor((i / numBars) * dataArray.length);
      const barHeight = (dataArray[dataIndex] / 255) * (canvas.height * 0.4); // Max 40% of canvas height
      avg += dataArray[dataIndex];
      
      const x = i * barWidth;
      
      // Create gradient for each bar (blue to cyan)
      const gradient = ctx.createLinearGradient(0, canvas.height, 0, canvas.height - barHeight);
      gradient.addColorStop(0, '#1e90ff');
      gradient.addColorStop(0.5, '#00bfff');
      gradient.addColorStop(1, '#87ceeb');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, canvas.height - barHeight, barWidth - barSpacing, barHeight);
      
      // Add a glow effect
      ctx.shadowBlur = 10;
      ctx.shadowColor = '#00bfff';
      ctx.fillRect(x, canvas.height - barHeight, barWidth - barSpacing, barHeight);
      ctx.shadowBlur = 0;
    }

    // Update background based on average frequency
    avg /= numBars;
    if (avg < 60) {
      setBgGradient('from-blue-900 via-blue-700 to-blue-900');
    } else if (avg < 120) {
      setBgGradient('from-yellow-600 via-orange-500 to-yellow-600');
    } else {
      setBgGradient('from-red-700 via-red-900 to-red-700');
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
      setIsRecording(false);
      setBgGradient('from-gray-900 via-gray-800 to-gray-900');
    } else {
      // Start recording
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        streamRef.current = stream;
        
        const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
        const source = audioCtx.createMediaStreamSource(stream);
        const analyserNode = audioCtx.createAnalyser();
        analyserNode.fftSize = 512; // Increased for better sensitivity
        analyserNode.smoothingTimeConstant = 0.8;
        
        source.connect(analyserNode);
        
        audioCtxRef.current = audioCtx;
        sourceRef.current = source;
        analyserRef.current = analyserNode;
        dataArrayRef.current = new Uint8Array(analyserNode.frequencyBinCount);

        mediaRecorderRef.current = new MediaRecorder(stream);
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
        drawVisualizer(); // Start drawing immediately
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
    <div className={`min-h-screen bg-gradient-to-br ${bgGradient} transition-all duration-1000`}>
      {/* Navbar */}
      <div className="relative z-30 bg-white">
        <Navbar />
      </div>

      {/* Visualizer Area */}
      <div className="relative flex items-center justify-center" style={{ height: 'calc(100vh - 80px)' }}>
        <canvas ref={canvasRef} className="absolute top-0 left-0 w-full h-full z-0" />
        
        {/* Content Container with Lyrics on Sides */}
        <div className="relative z-10 flex items-center justify-center gap-8 max-w-7xl mx-auto px-8">
          {/* Original Lyrics - Left Side */}
          <div className="flex-1 bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6 max-w-md">
            <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-purple-600 pb-2">
              Original (English)
            </h3>
            <div className="space-y-3">
              {originalLyrics.map((lyric, index) => (
                <p
                  key={index}
                  className={`text-base transition-all duration-300 ${
                    isLyricActive(lyric)
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
              className={`w-20 h-20 rounded-full border-none cursor-pointer transition-all duration-300 flex items-center justify-center ${
                isRecording 
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
              Translated (Spanish)
            </h3>
            <div className="space-y-3">
              {translatedLyrics.map((lyric, index) => (
                <p
                  key={index}
                  className={`text-base transition-all duration-300 ${
                    isLyricActive(lyric)
                      ? 'text-green-600 font-bold scale-105 bg-green-50 p-2 rounded'
                      : 'text-gray-600'
                  }`}
                >
                  {lyric.text}
                </p>
              ))}
            </div>
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
    </div>
  );
}

export default Karaoke;