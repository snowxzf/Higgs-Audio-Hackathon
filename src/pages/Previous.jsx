import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function PreviousSongs() {
  const [previousUploads, setPreviousUploads] = useState([])
  const [selectedSongs, setSelectedSongs] = useState(new Set())
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false)
  const [favoriteIds, setFavoriteIds] = useState(new Set())
  const [showShareModal, setShowShareModal] = useState(false)
  const [shareTarget, setShareTarget] = useState('email') // 'email' or 'friend'
  const [shareEmail, setShareEmail] = useState('')
  const [shareFriend, setShareFriend] = useState('')
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

  const handleShare = () => {
    if (selectedSongs.size === 0) return
    setShowShareModal(true)
  }

  const shareSelectedSongs = () => {
    const selectedSongData = previousUploads.filter(song => selectedSongs.has(song.id))
    
    if (shareTarget === 'email') {
      // Create a mailto link with song data
      const subject = encodeURIComponent(`Shared Songs from Cadence AI`)
      const body = encodeURIComponent(
        `I wanted to share these songs with you:\n\n${selectedSongData.map(song => 
          `- ${song.name} (Uploaded: ${song.uploadDate})\n  Original: ${song.originalLyrics?.[0]?.text || 'N/A'}\n  Translated: ${song.translatedLyrics?.[0]?.text || 'N/A'}`
        ).join('\n\n')}`
      )
      window.location.href = `mailto:${shareEmail}?subject=${subject}&body=${body}`
      alert(`Opening email client to share with ${shareEmail}!`)
    } else if (shareTarget === 'friend') {
      // Load friends from localStorage
      const friends = JSON.parse(localStorage.getItem('friends') || '[]')
      const friend = friends.find(f => f.name === shareFriend)
      
      if (friend) {
        // Add songs to friend's shared songs list
        const sharedSongs = JSON.parse(localStorage.getItem(`sharedWith_${friend.id}`) || '[]')
        const updatedShared = [...sharedSongs, ...selectedSongData]
        localStorage.setItem(`sharedWith_${friend.id}`, JSON.stringify(updatedShared))
        alert(`Successfully shared ${selectedSongs.size} song(s) with ${shareFriend}!`)
      }
    }
    
    // Don't close modal automatically - let user click X
    // Clear form instead
    setShareEmail('')
    setShareFriend('')
    setSelectedSongs(new Set()) // Clear selection after sharing
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
                    Add to Favorites
                  </button>
                  <button
                    onClick={handleShare}
                    className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.885 12.938 9 12.482 9 12c0-.482-.115-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share ({selectedSongs.size})
                  </button>
                  <button
                    onClick={deleteSelectedSongs}
                    className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                    Delete
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

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 max-w-md w-full mx-4 relative">
            <button
              onClick={() => {
                setShowShareModal(false)
                setShareEmail('')
                setShareFriend('')
              }}
              className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <h2 className="text-2xl font-bold mb-4">Share Songs</h2>
            
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">Share via:</label>
              <div className="flex gap-4">
                <button
                  onClick={() => setShareTarget('email')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    shareTarget === 'email' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Email
                </button>
                <button
                  onClick={() => setShareTarget('friend')}
                  className={`flex-1 px-4 py-2 rounded-lg transition-colors ${
                    shareTarget === 'friend' 
                      ? 'bg-purple-500 text-white' 
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  Friend
                </button>
              </div>
            </div>

            {shareTarget === 'email' ? (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Email address:</label>
                <input
                  type="email"
                  value={shareEmail}
                  onChange={(e) => setShareEmail(e.target.value)}
                  placeholder="friend@example.com"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            ) : (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Select friend:</label>
                <select
                  value={shareFriend}
                  onChange={(e) => setShareFriend(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                >
                  <option value="">Choose a friend...</option>
                  {JSON.parse(localStorage.getItem('friends') || '[]').map(friend => (
                    <option key={friend.id} value={friend.name}>{friend.name}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={shareSelectedSongs}
                disabled={(shareTarget === 'email' && !shareEmail) || (shareTarget === 'friend' && !shareFriend)}
                className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed text-white px-6 py-3 rounded-lg transition-colors"
              >
                Share
              </button>
              <button
                onClick={() => {
                  setShowShareModal(false)
                  setShareEmail('')
                  setShareFriend('')
                }}
                className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 px-6 py-3 rounded-lg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default PreviousSongs