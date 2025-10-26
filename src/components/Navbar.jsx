import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import cadenceIcon from '../assets/Cadence AI_gray.jpg';

function Navbar() {
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    return (
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 bg-transparent">
            <div className="flex items-center gap-8">
                <div className="flex gap-8 text-lg">
                    <Link to="/" className={`text-black hover:text-gray-700 transition-colors relative ${isActive('/') ? '' : ''}`}>
                        <span className="relative z-10">Home</span>
                        {isActive('/') && (
                            <div className="absolute inset-0 bg-gray-400 rounded-full opacity-30 -m-2"></div>
                        )}
                    </Link>
                    <Link to="/about" className={`text-black hover:text-gray-700 transition-colors relative`}>
                        <span className="relative z-10">About</span>
                        {isActive('/about') && (
                            <div className="absolute inset-0 bg-gray-400 rounded-full opacity-30 -m-2"></div>
                        )}
                    </Link>
                    <Link to="/previous" className={`text-black hover:text-gray-700 transition-colors relative`}>
                        <span className="relative z-10">Previous Songs</span>
                        {isActive('/previous') && (
                            <div className="absolute inset-0 bg-gray-400 rounded-full opacity-30 -m-2"></div>
                        )}
                    </Link>
                    <Link to="/karaoke" className={`text-black hover:text-gray-700 transition-colors relative`}>
                        <span className="relative z-10">Karaoke</span>
                        {isActive('/karaoke') && (
                            <div className="absolute inset-0 bg-gray-400 rounded-full opacity-30 -m-2"></div>
                        )}
                    </Link>
                    <Link to="/friends" className={`text-black hover:text-gray-700 transition-colors relative`}>
                        <span className="relative z-10">Friends</span>
                        {isActive('/friends') && (
                            <div className="absolute inset-0 bg-gray-400 rounded-full opacity-30 -m-2"></div>
                        )}
                    </Link>
                </div>
            </div>
            <button className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-full transition-colors">
                Sign In
            </button>
        </nav>
    )
}

export default Navbar