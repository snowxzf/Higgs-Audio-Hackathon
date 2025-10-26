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
          <p className="text-lg text-gray-700 mb-6">
            So what are you waiting for? Use CadenceAI today and start exploring the world of music like never before!
          </p>
          
          <div className="mt-6 pt-6 border-t-2 border-gray-200">
            <p className="text-lg font-semibold text-gray-800 mb-3">
              Powered by Higgs Boson AI
            </p>
            <p className="text-sm text-gray-600 mb-2">
              This project was built for the Higgs Boson AI Hackathon and leverages the following cutting-edge AI models:
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
              <li><strong>higgs-audio-understanding-Hackathon</strong> — For audio transcription and language detection</li>
              <li><strong>Qwen3-32B-thinking-Hackathon</strong> — For intelligent translation with syllable and rhyme preservation</li>
              <li><strong>higgs-audio-v2-generation-3B-sft-Hackathon</strong> — For expressive audio generation and voice cloning</li>
            </ul>
          </div>
        </div>

        <div className="flex gap-6 mt-6 justify-center">
          <img
            src={micIcon}
            alt="Microphone Icon"
            className="w-500 h-200 object-cover"
          />
        </div>
        
        <div className="max-w-3xl mx-auto mt-8 pt-8 border-t-2 border-gray-300">
          <p className="text-sm text-gray-600 text-center">
            Made by Jessica, Aarya, & Sara — Second Year EngScis excited about music
          </p>
        </div>
      </div>
    </div>
  );
}

export default About;