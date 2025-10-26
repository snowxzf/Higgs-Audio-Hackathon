import React from 'react'
import { Link, useLocation } from 'react-router-dom'

function Navbar() {
    const location = useLocation()

    const isActive = (path) => location.pathname === path

    return (
        <nav className="relative z-10 flex items-center justify-between px-8 py-6 bg-transparent">
            <div className="flex items-center gap-8">
                <svg className="w-8 h-8 text-black cursor-pointer hover:rotate-90 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
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