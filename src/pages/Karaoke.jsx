import React from 'react'

function Karaoke() {
    return (
        <div className="min-h-screen bg-gray-200">
            <Navbar />
            <div className="container mx-auto px-8 py-12">
                <h1 className="text-4xl font-bold text-center mb-8">Karaoke Mode</h1>
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <p className="text-lg text-gray-700 text-center">
                        Karaoke mode coming soon! Sing along with translated lyrics.
                    </p>
                </div>
            </div>
        </div>
    )
}

export default Karaoke