import React, { useState, useRef, useEffect } from 'react'
import Navbar from '../components/Navbar'

function HomePage() {
    const [uploadedFile, setUploadedFile] = useState(null)
    const [isPlaying, setIsPlaying] = useState(false)
    const [previousUploads, setPreviousUploads] = useState([])
    const [selectedSongs, setSelectedSongs] = useState(new Set())
    const [userName, setUserName] = useState('')
    const [audioUrl, setAudioUrl] = useState(null)
    const [currentLanguage, setCurrentLanguage] = useState('English')
    const [translatedLanguage, setTranslatedLanguage] = useState('Spanish')
    const [showLanguageDropdown, setShowLanguageDropdown] = useState({ current: false, translated: false })
    const [currentTime, setCurrentTime] = useState(0)
    const [audioContext, setAudioContext] = useState(null)
    const [analyser, setAnalyser] = useState(null)
    const audioRef = useRef(null)
    const fileInputRef = useRef(null)
    const animationFrameRef = useRef(null)

    const moodColors = {
        happy: ['#FFD700', '#FFA500', '#FF6B6B'],
        sad: ['#4A90E2', '#5C6BC0', '#7986CB'],
        energetic: ['#FF1744', '#F50057', '#FF4081'],
        calm: ['#26A69A', '#66BB6A', '#81C784'],
        default: ['#8BC34A', '#9CCC65', '#AED581']
    }

    const [currentMood, setCurrentMood] = useState('default')
    const [waveformBars, setWaveformBars] = useState([])

    const languages = [
        'English', 'Spanish', 'French', 'German', 'Italian', 'Portuguese',
        'Japanese', 'Korean', 'Chinese (Mandarin)', 'Chinese (Cantonese)',
        'Arabic', 'Russian', 'Hindi', 'Bengali', 'Urdu', 'Indonesian',
        'Turkish', 'Vietnamese', 'Thai', 'Dutch', 'Greek', 'Hebrew',
        'Swedish', 'Polish', 'Romanian', 'Czech', 'Hungarian', 'Finnish',
        'Danish', 'Norwegian', 'Ukrainian', 'Tagalog', 'Swahili', 'Tamil',
        'Telugu', 'Marathi', 'Gujarati', 'Punjabi', 'Malayalam', 'Kannada'
    ]

    const originalLyrics = [
        { text: "Welcome to the audio translation app", startTime: 0, endTime: 3 },
        { text: "Upload your favorite songs", startTime: 3, endTime: 6 },
        { text: "And see them translated in real time", startTime: 6, endTime: 9 },
        { text: "Enjoy music in any language", startTime: 9, endTime: 12 }
    ]

    const translatedLyrics = [
        { text: "Bienvenido a la aplicación de traducción de audio", startTime: 0, endTime: 3 },
        { text: "Sube tus canciones favoritas", startTime: 3, endTime: 6 },
        { text: "Y véalas traducidas en tiempo real", startTime: 6, endTime: 9 },
        { text: "Disfruta de la música en cualquier idioma", startTime: 9, endTime: 12 }
    ]

    useEffect(() => {
        if (uploadedFile) {
            const bars = Array.from({ length: 100 }, () => ({
                height: Math.random() * 100 + 20,
                animationDelay: Math.random() * 2
            }))
            setWaveformBars(bars)

            const moods = ['happy', 'sad', 'energetic', 'calm']
            setCurrentMood(moods[Math.floor(Math.random() * moods.length)])
        }
    }, [uploadedFile])

    useEffect(() => {
        if (audioRef.current && uploadedFile && !audioContext) {
            const context = new (window.AudioContext || window.webkitAudioContext)()
            const analyzerNode = context.createAnalyser()
            analyzerNode.fftSize = 256

            const source = context.createMediaElementSource(audioRef.current)
            source.connect(analyzerNode)
            analyzerNode.connect(context.destination)

            setAudioContext(context)
            setAnalyser(analyzerNode)
        }
    }, [uploadedFile, audioContext])

    useEffect(() => {
        if (analyser && isPlaying) {
            const bufferLength = analyser.frequencyBinCount
            const dataArray = new Uint8Array(bufferLength)

            const animate = () => {
                analyser.getByteFrequencyData(dataArray)

                const newBars = Array.from({ length: 100 }, (_, i) => {
                    const index = Math.floor((i / 100) * bufferLength)
                    const value = dataArray[index] || 0
                    return {
                        height: (value / 255) * 100 + 20,
                        animationDelay: 0
                    }
                })

                setWaveformBars(newBars)
                animationFrameRef.current = requestAnimationFrame(animate)
            }

            animate()

            return () => {
                if (animationFrameRef.current) {
                    cancelAnimationFrame(animationFrameRef.current)
                }
            }
        }
    }, [analyser, isPlaying])

    useEffect(() => {
        if (audioRef.current && isPlaying) {
            const interval = setInterval(() => {
                setCurrentTime(audioRef.current.currentTime)
            }, 100)
            return () => clearInterval(interval)
        }
    }, [isPlaying])

    const handleFileUpload = (e) => {
        const file = e.target.files[0]
        if (file && file.type.startsWith('audio/')) {
            setUploadedFile(file)
            const url = URL.createObjectURL(file)
            setAudioUrl(url)

            const newUpload = {
                id: Date.now(),
                name: file.name,
                uploadDate: new Date().toLocaleDateString(),
                duration: '0:00'
            }
            setPreviousUploads(prev => [newUpload, ...prev])
        }
    }

    const handlePlayPause = () => {
        if (audioRef.current) {
            if (isPlaying) {
                audioRef.current.pause()
            } else {
                audioRef.current.play()
            }
            setIsPlaying(!isPlaying)
        }
    }

    const toggleSelectSong = (id) => {
        setSelectedSongs(prev => {
            const newSet = new Set(prev)
            if (newSet.has(id)) {
                newSet.delete(id)
            } else {
                newSet.add(id)
            }
            return newSet
        })
    }

    const deleteSelectedSongs = () => {
        setPreviousUploads(prev => prev.filter(song => !selectedSongs.has(song.id)))
        setSelectedSongs(new Set())
    }

    const isLyricActive = (lyric) => {
        return currentTime >= lyric.startTime && currentTime < lyric.endTime
    }

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
                    {languages.map((lang) => (
                        <button
                            key={lang}
                            onClick={() => {
                                onChange(lang)
                                toggleOpen()
                            }}
                            className="w-full px-4 py-2 text-left hover:bg-purple-100 transition-colors"
                        >
                            {lang}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )

    return (
        <div className="min-h-screen bg-gray-200 relative">
            {uploadedFile && (
                <div className="absolute left-0 right-0 flex items-center justify-center opacity-40 pointer-events-none" style={{ top: '140px', height: '200px' }}>
                    <div className="flex items-center justify-center gap-1 h-48">
                        {waveformBars.map((bar, i) => (
                            <div
                                key={i}
                                className="w-1 bg-gradient-to-t rounded-full transition-all duration-75"
                                style={{
                                    height: `${bar.height}%`,
                                    background: `linear-gradient(to top, ${moodColors[currentMood][0]}, ${moodColors[currentMood][1]}, ${moodColors[currentMood][2]})`
                                }}
                            />
                        ))}
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-auto">
                        <button
                            onClick={handlePlayPause}
                            className="bg-purple-600 hover:bg-purple-700 text-white p-4 rounded-full transition-colors shadow-lg"
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
                    </div>
                </div>
            )}

            <Navbar />

            <div className="relative z-10 flex flex-col items-center justify-center px-8" style={{ marginTop: uploadedFile ? '10px' : '48px' }}>
                <div className={`transition-all duration-500 ${uploadedFile ? 'mb-2' : 'mb-8'}`}>
                    <input
                        type="text"
                        placeholder="INSERT NAME"
                        value={userName}
                        onChange={(e) => setUserName(e.target.value)}
                        className={`font-bold text-center bg-transparent border-none outline-none placeholder-black text-black transition-all duration-500 ${uploadedFile ? 'text-xl' : 'text-3xl'
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
                        <div className="grid grid-cols-2 gap-6">
                            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-purple-600 pb-2">
                                    Original ({currentLanguage})
                                </h3>
                                <div className="space-y-4">
                                    {originalLyrics.map((lyric, index) => (
                                        <p
                                            key={index}
                                            className={`text-lg transition-all duration-300 ${isLyricActive(lyric)
                                                    ? 'text-purple-600 font-bold scale-105 bg-purple-50 p-2 rounded'
                                                    : 'text-gray-600'
                                                }`}
                                        >
                                            {lyric.text}
                                        </p>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white bg-opacity-90 backdrop-blur-sm rounded-lg shadow-lg p-6">
                                <h3 className="text-xl font-bold mb-4 text-gray-800 border-b-2 border-green-500 pb-2">
                                    Translated ({translatedLanguage})
                                </h3>
                                <div className="space-y-4">
                                    {translatedLyrics.map((lyric, index) => (
                                        <p
                                            key={index}
                                            className={`text-lg transition-all duration-300 ${isLyricActive(lyric)
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
                    </div>
                )}

                <div className="w-full max-w-4xl">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-4">
                            <h2 className="text-2xl font-bold text-black">Previous Uploads</h2>
                            {selectedSongs.size > 0 && (
                                <button
                                    onClick={deleteSelectedSongs}
                                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Delete ({selectedSongs.size})
                                </button>
                            )}
                        </div>
                        <span className="text-sm text-gray-600">Select</span>
                    </div>

                    <div className="space-y-3">
                        {previousUploads.map((song) => (
                            <div
                                key={song.id}
                                className="flex items-center gap-4 bg-green-400 hover:bg-green-500 transition-colors rounded-lg p-4 shadow"
                            >
                                <input
                                    type="checkbox"
                                    checked={selectedSongs.has(song.id)}
                                    onChange={() => toggleSelectSong(song.id)}
                                    className="w-6 h-6 cursor-pointer accent-purple-600"
                                />
                                <div className="flex-1">
                                    <div className="font-medium text-black">{song.name}</div>
                                    <div className="text-sm text-gray-700">Uploaded: {song.uploadDate}</div>
                                </div>
                            </div>
                        ))}

                        {previousUploads.length === 0 && (
                            <div className="text-center py-8 text-gray-600">
                                No previous uploads yet. Upload your first audio file!
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default HomePage