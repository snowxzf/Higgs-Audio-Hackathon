# Cadence AI - Music Translation App

A web application for translating music lyrics across languages with real-time karaoke functionality.

## Setup

1. **Install Node.js dependencies:**
   ```bash
   npm install
   ```

2. **Set up Python virtual environment:**
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   pip install -r requirements.txt
   ```

3. **Set up environment variables:**
   - Create a `.env` file in the project root
   - Add your OpenAI API key:
     ```
     OPENAI_API_KEY=your_api_key_here
     ```

## Running the Application

You need to run **three** services simultaneously:

### Terminal 1: Vite Frontend Server
```bash
npm run dev
```
This starts the React frontend on `http://localhost:5173`

### Terminal 2: Node.js Transcription Server
```bash
npm run server
```
This starts the Express backend on `http://localhost:3001`

### Terminal 3: FastAPI Backend (Optional)
```bash
source venv/bin/activate
cd backend
uvicorn main:app --reload
```
This starts the FastAPI backend on `http://localhost:8000`

## Features

- **Audio Translation**: Upload songs and translate lyrics across multiple languages
- **Audio Separation**: Automatically separates vocals and background music
- **Karaoke Mode**: Record yourself singing along with synchronized lyrics
- **Visual Lyrics**: Real-time lyric highlighting synchronized with audio playback
- **Download Options**: Download separated vocals and instrumental tracks

## Technologies Used

- **Frontend**: React, Vite, TailwindCSS
- **Backend**: Node.js (Express), Python (FastAPI)
- **AI Models**:
  - `higgs-audio-understanding-Hackathon` - Audio transcription
  - `Qwen3-32B-thinking-Hackathon` - Translation
  - `higgs-audio-v2-generation-3B-sft-Hackathon` - Voice generation

## Project Structure

```
├── src/
│   ├── pages/           # React page components
│   ├── components/       # Reusable components
│   └── assets/           # Images and other assets
├── backend/              # Python backend
│   ├── utils/            # Utility functions
│   └── uploads/          # Uploaded audio files
├── transcription-server.js  # Node.js server for audio processing
└── package.json          # Node.js dependencies and scripts

```

## Development

Made by Jessica, Aarya, & Sara — Second Year EngScis excited about music

Powered by Higgs Boson AI Hackathon

