import React from 'react';
import Navbar from '../components/Navbar';
import micIcon from '../assets/mic.jpg';

function About() {
  return (
    <div className="min-h-screen bg-gray-200">
      <Navbar />
      <div className="container mx-auto px-8 py-12">
        <h1 className="text-4xl font-bold text-center mb-8">About</h1>
        <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-8">
          <p className="text-lg text-gray-700 mb-4">
            Welcome to CadenceAI, the ultimate app for music lovers to translate musics from different languages.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            Our app uses advanced AI technology to translate song lyrics in real-time, allowing you to enjoy music from around the world while retaining speech context.
          </p>
          <p className="text-lg text-gray-700 mb-4">
            The karaoke feature allows you to sing these songs, with your friends or by yourself. You can also share your favourite songs with your friends and connections to explore new music together.
          </p>
          <p className="text-lg text-gray-700">
            So what are you waiting for? Use CadenceAI today and start exploring the world of music like never before!
          </p>
        </div>

        <div className="flex gap-6 mt-6 justify-center">
          <img
            src={micIcon}
            alt="Microphone Icon"
            className="w-500 h-200 object-cover"
          />
        </div>
      </div>
    </div>
  );
}

export default About;