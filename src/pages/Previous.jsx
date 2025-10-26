import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function PreviousSongs() {
  const [previousUploads, setPreviousUploads] = useState([])
  const [selectedSongs, setSelectedSongs] = useState(new Set())
  const navigate = useNavigate()

  useEffect(() => {
    // Load songs from localStorage
    const savedSongs = JSON.parse(localStorage.getItem('uploadedSongs') || '[]')
    setPreviousUploads(savedSongs)
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

  const handleSongClick = (song) => {
    // Navigate back to home page with the selected song
    // You can pass the song data via state
    navigate('/', { state: { selectedSong: song } })
  }

  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      
      <div className="container mx-auto px-8 py-12">
        <div className="w-full max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <h1 className="text-4xl font-bold text-black">Previous Songs</h1>
              
              {/* Select All Checkbox */}
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={previousUploads.length > 0 && selectedSongs.size === previousUploads.length}
                  onChange={toggleSelectAll}
                  className="w-5 h-5 cursor-pointer accent-purple-600"
                />
                <label className="text-sm text-gray-700 cursor-pointer">Select All</label>
              </div>
              
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
            <span className="text-sm text-gray-600">Select to delete</span>
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
                  onClick={(e) => e.stopPropagation()}
                />
                <div 
                  className="flex-1 cursor-pointer"
                  onClick={() => handleSongClick(song)}
                >
                  <div className="font-medium text-black hover:underline">{song.name}</div>
                  <div className="text-sm text-gray-700">Uploaded: {song.uploadDate}</div>
                </div>
              </div>
            ))}
            
            {previousUploads.length === 0 && (
              <div className="text-center py-12 bg-white rounded-lg shadow-lg">
                <svg className="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                </svg>
                <p className="text-xl text-gray-600 mb-2">No songs uploaded yet</p>
                <p className="text-gray-500">Upload your first audio file on the home page!</p>
                <button
                  onClick={() => navigate('/')}
                  className="mt-4 bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors"
                >
                  Go to Home
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default PreviousSongs