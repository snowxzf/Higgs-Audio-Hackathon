# Quick Start Guide

Follow these steps to run the Cadence AI translation app:

## 1. Clone the Repository
```bash
git clone https://github.com/snowxzf/Higgs-Audio-Hackathon.git
cd Higgs-Audio-Hackathon
```

## 2. Install Node.js Dependencies
```bash
npm install
```
This installs all frontend dependencies including dotenv, express, multer, and React.

## 3. Set Up Python Environment
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## 4. Configure API Key
Create a `.env` file in the project root:
```bash
cp backend/utils/api_key.env .env
```
Or manually create `.env` with:
```
OPENAI_API_KEY=your_api_key_here
```

## 5. Run the Application

Open **three** terminal windows:

### Terminal 1: Frontend Server
```bash
npm run dev
```
Frontend runs on http://localhost:5173

### Terminal 2: Transcription Server
```bash
npm run server
```
Backend runs on http://localhost:3001

### Terminal 3: (Optional) FastAPI Backend
```bash
source venv/bin/activate
cd backend
uvicorn main:app --reload
```
Backend API runs on http://localhost:8000

## 6. Open in Browser
Navigate to http://localhost:5173

## Troubleshooting

### "Cannot connect to transcription server"
- Make sure Terminal 2 is running `npm run server`
- Check that port 3001 is not in use

### "Cannot transcribe audio"
- Ensure Python dependencies are installed (`pip install -r requirements.txt`)
- Verify your `.env` file has the correct API key
- Check that FFmpeg is installed on your system

### Python not found
- Make sure Python 3.8+ is installed
- Verify the `venv` is activated

## Features

- **Audio Translation**: Upload songs and translate lyrics
- **Audio Separation**: Automatically separate vocals and background
- **Karaoke Mode**: Record yourself singing with synchronized lyrics
- **Visual Lyrics**: Real-time highlighting synchronized with audio

## Tech Stack

- Frontend: React, Vite, TailwindCSS
- Backend: Node.js (Express), Python (FastAPI)
- AI Models: Higgs Audio Understanding, Qwen Thinking, Higgs Audio V2

