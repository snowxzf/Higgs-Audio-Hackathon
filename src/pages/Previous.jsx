import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function PreviousSongs() {
  const [previousUploads, setPreviousUploads] = useState([])
  const [selectedSongs, setSelectedSongs] = useState(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    // Load songs from localStorage
    const savedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]')
    setPreviousUploads(savedSongs)
    
    // Load favorites
    const savedFavorites = JSON.parse(localStorage.getItem('favoriteSongs') || '[]')
    setFavoriteIds(new Set(savedFavorites))
  }, [])

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

  const toggleSelectAll = () => {
    if (selectedSongs.size === previousUploads.length) {
      // Deselect all
      setSelectedSongs(new Set())
    } else {
      // Select all
      const allIds = new Set(previousUploads.map(song => song.id))
      setSelectedSongs(allIds)
    }
  }

  const deleteSelectedSongs = () => {
    const updatedUploads = previousUploads.filter(song => !selectedSongs.has(song.id))
    setPreviousUploads(updatedUploads)
    localStorage.setItem('uploadedSongs', JSON.stringify(updatedUploads))
    setSelectedSongs(new Set())
  }

  const toggleFavorite = (id) => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      // Save to localStorage
      localStorage.setItem('favoriteSongs', JSON.stringify(Array.from(newSet)))
      return newSet
    })
  }

  const addSelectedToFavorites = () => {
    setFavoriteIds(prev => {
      const newSet = new Set(prev)
      selectedSongs.forEach(id => newSet.add(id))
      localStorage.setItem('favoriteSongs', JSON.stringify(Array.from(newSet)))
      return newSet
    })
    setSelectedSongs(new Set())
  }

  // Filter songs based on showFavoritesOnly
  const displayedSongs = showFavoritesOnly 
    ? previousUploads.filter(song => favoriteIds.has(song.id))
    : previousUploads

  const handleSongClick = (song) => {
    // Restore all the song data to localStorage so HomePage can display it
    if (song.originalLyrics) localStorage.setItem('originalLyrics', JSON.stringify(song.originalLyrics));
    if (song.translatedLyrics) localStorage.setItem('translatedLyrics', JSON.stringify(song.translatedLyrics));
    if (song.currentLanguage) localStorage.setItem('currentLanguage', song.currentLanguage);
    if (song.translatedLanguage) localStorage.setItem('translatedLanguage', song.translatedLanguage);
    if (song.analysisText) localStorage.setItem('analysisText', song.analysisText);
    if (song.audioUrl) localStorage.setItem('audioUrl', song.audioUrl);
    if (song.vocalsUrl) localStorage.setItem('vocalsUrl', song.vocalsUrl);
    if (song.backgroundUrl) localStorage.setItem('backgroundUrl', song.backgroundUrl);
    if (song.detectedLanguage) localStorage.setItem('detectedLanguage', song.detectedLanguage);
    localStorage.setItem('uploadedFileName', song.name);
    
    // Navigate to home page - it will automatically load from localStorage
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      
      <div className="container mx-auto px-8 py-12">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-black">
                {showFavoritesOnly ? 'Favorite Songs' : 'Previous Songs'}
              </h1>
              
              {/* Toggle Favorites View */}
              <button
                onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  showFavoritesOnly 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-purple-100 hover:bg-purple-200 text-purple-700'
                }`}
              >
                <svg className="w-5 h-5" fill={showFavoritesOnly ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                {showFavoritesOnly ? 'Show All' : 'Show Favorites'}
              </button>
              
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={displayedSongs.length > 0 && selectedSongs.size === displayedSongs.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 cursor-pointer accent-purple-600"
                />
                <label className="text-sm text-gray-700 cursor-pointer">Select All</label>
              </div>
              
              {selectedSongs.size > 0 && (
                <>
                  <button
                    onClick={addSelectedToFavorites}
                    className="bg-pink-500 hover:bg-pink-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                    </svg>
                    Add to Favorites ({selectedSongs.size})
                  </button>
                  <button
                    onClick={deleteSelectedSongs}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete ({selectedSongs.size})
                  </button>
                </>
              )}
            </div>
            <span className="text-sm text-gray-600">Select to manage</span>
          </div>

          <div className="space-y-3">
            {displayedSongs.map((song) => (
              <div
                key={song.id}
                className="flex items-center gap-4 bg-green-400 hover:bg-green-500 transition-colors rounded-lg p-4 shadow"
              >
                <input
                  type="checkbox"
                  checked={selectedSongs.has(song.id)}
                  onChange={() => toggleSelectSong(song.id)}
                  className="w-6 h-6 cursor-pointer accent-purple-600"
                  onClick={(e) => e.stopPropagation()}
                />
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSongClick(song)}
                >
                  <div className="font-medium text-black hover:underline">{song.name}</div>
                  <div className="text-sm text-gray-700">Uploaded: {song.uploadDate}</div>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFavorite(song.id);
                  }}
                  className="p-2 hover:bg-green-600 rounded-full transition-colors"
                >
                  <svg className={`w-6 h-6 ${favoriteIds.has(song.id) ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} fill={favoriteIds.has(song.id) ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                  </svg>
                </button>
              </div>
            ))}
            
            {displayedSongs.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-lg">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={previousUploads.length === 0 ? "M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" : "M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"} />
                </svg>
                <p className="text-xl text-gray-600 mb-2">
                  {previousUploads.length === 0 ? 'No songs uploaded yet' : showFavoritesOnly ? 'No favorite songs yet' : 'No matching songs'}
                </p>
                <p className="text-gray-500">
                  {previousUploads.length === 0 ? 'Upload your first audio file on the home page!' : showFavoritesOnly ? 'Mark some songs as favorites to see them here!' : 'Try changing your filters.'}
                </p>
                {previousUploads.length === 0 && (
                  <button
                    onClick={() => navigate('/')}
                    className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors"
                  >
                    Go to Home
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviousSongs