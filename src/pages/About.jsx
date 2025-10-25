import React from 'react'

function About() {
    return (
        <div className="min-h-screen bg-gray-200">
            <Navbar />
            <div className="container mx-auto px-8 py-12">
                <h1 className="text-4xl font-bold text-center mb-8">About</h1>
                <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
                    <p className="text-lg text-gray-700 mb-4">
                        Welcome to the Audio Translation App - your gateway to understanding music in any language.
                    </p>
                    <p className="text-lg text-gray-700 mb-4">
                        Our app uses advanced AI technology to translate song lyrics in real-time, allowing you to enjoy music from around the world while understanding every word.
                    </p>
                    <p className="text-lg text-gray-700">
                        Upload your favorite songs and experience them in a whole new way!
                    </p>
                </div>
            </div>
        </div>
    )
}

export default About