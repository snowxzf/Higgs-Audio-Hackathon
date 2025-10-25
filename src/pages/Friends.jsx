import React from 'react'
import Navbar from '../components/Navbar'

function Friends() {
    return (
        <div className="min-h-screen bg-gray-200">
            <Navbar />
            <div className="container mx-auto px-8 py-12">
                <h1 className="text-4xl font-bold text-center mb-8">Friends</h1>
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <p className="text-lg text-gray-700 text-center">
                        Connect with friends and share your favorite translated songs!
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Friends